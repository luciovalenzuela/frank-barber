// Aplica las migraciones de db/migrations a la base de producción.
// Uso: npm run db:migrate   (lee DATABASE_URL de .env.local)

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Cargala en .env.local (ver .env.example).");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

try {
  await sql.unsafe(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set((await sql`select name from _migrations`).map((row) => row.name));

  const dir = join(process.cwd(), "db/migrations");
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(await readFile(join(dir, file), "utf8"));
      await tx`insert into _migrations (name) values (${file})`;
    });
    console.log(`✓ ${file}`);
    count += 1;
  }

  console.log(count ? `Listo: ${count} migración(es) aplicada(s).` : "La base ya estaba al día.");
} finally {
  await sql.end();
}
