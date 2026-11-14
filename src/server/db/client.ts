import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Acceso a la base de datos.
 *
 * - Con DATABASE_URL (producción): se conecta a Postgres (Supabase).
 * - Sin DATABASE_URL, en desarrollo: usa PGlite, un Postgres embebido que guarda
 *   los datos en .data/pglite. No hace falta instalar ni configurar nada.
 */

export type Row = Record<string, unknown>;

export type Db = {
  /** Consulta con parámetros ($1, $2…). Devuelve las filas. */
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Ejecuta varias sentencias SQL seguidas, sin parámetros (migraciones). */
  exec(text: string): Promise<void>;
};

/** En producción solo hay reservas si la base está configurada. */
export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL) || process.env.NODE_ENV !== "production";
}

// En desarrollo Next recarga los módulos: guardamos la conexión en globalThis
// para no abrir una nueva en cada recarga.
const globalForDb = globalThis as unknown as { __frankBarberDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.__frankBarberDb ??= connect().catch((error) => {
    // Si la conexión falla, el próximo pedido vuelve a intentar en vez de quedar con el error guardado.
    globalForDb.__frankBarberDb = undefined;
    throw error;
  });
  return globalForDb.__frankBarberDb;
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) return connectPostgres(url);

  if (process.env.NODE_ENV === "production") {
    throw new Error("Falta la variable de entorno DATABASE_URL.");
  }
  return connectLocal();
}

async function connectPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, {
    // El pooler de Supabase (puerto 6543) no admite sentencias preparadas.
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });

  return {
    async query<T extends Row>(text: string, params: unknown[] = []) {
      const rows = await sql.unsafe(text, params as never[]);
      return rows as unknown as T[];
    },
    async exec(text) {
      await sql.unsafe(text);
    },
  };
}

async function connectLocal(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { btree_gist } = await import("@electric-sql/pglite/contrib/btree_gist");
  const dataDir = join(process.cwd(), ".data");
  await mkdir(dataDir, { recursive: true });
  const pg = new PGlite(join(dataDir, "pglite"), { extensions: { btree_gist } });

  const db: Db = {
    async query<T extends Row>(text: string, params: unknown[] = []) {
      const result = await pg.query<T>(text, params);
      return result.rows;
    },
    async exec(text) {
      await pg.exec(text);
    },
  };

  await migrate(db);
  return db;
}

/** Aplica, en orden, las migraciones de db/migrations que todavía no se corrieron. */
export async function migrate(db: Db) {
  await db.exec(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set((await db.query<{ name: string }>("select name from _migrations")).map((row) => row.name));

  const dir = join(process.cwd(), "db/migrations");
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    await db.exec(await readFile(join(dir, file), "utf8"));
    await db.query("insert into _migrations (name) values ($1)", [file]);
  }
}

/** Código de Postgres para "viola una restricción de exclusión" (turno superpuesto). */
export function isOverlapError(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23P01";
}
