import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

// Corre la migración real en un Postgres en memoria y verifica que la base,
// y no solo el código, impida dos turnos superpuestos del mismo barbero.

async function setup() {
  const pg = new PGlite({ extensions: { btree_gist } });
  await pg.exec(await readFile("db/migrations/0001_turnos.sql", "utf8"));
  const client = await pg.query<{ id: string }>(
    "insert into clients (email, name, phone) values ('a@example.com', 'A', '1155550000') returning id",
  );
  const clientId = client.rows[0].id;
  let n = 0;
  const book = (barber: string, start: string, end: string) =>
    pg.query(
      `insert into appointments (client_id, barber_id, service_id, service_name, price_ars, starts_at, ends_at, manage_token)
       values ($1, $2, 'corte', 'Corte', 19000, $3, $4, $5)`,
      [clientId, barber, start, end, `token-${n++}`],
    );
  return { pg, book };
}

test("la base rechaza un turno que pisa a otro del mismo barbero", async () => {
  const { book } = await setup();
  await book("franco", "2026-11-14T13:00:00Z", "2026-11-14T14:00:00Z");
  await assert.rejects(book("franco", "2026-11-14T13:30:00Z", "2026-11-14T14:00:00Z"), { code: "23P01" });
});

test("turnos seguidos, de otro barbero, o sobre uno cancelado sí entran", async () => {
  const { pg, book } = await setup();
  await book("franco", "2026-11-14T13:00:00Z", "2026-11-14T14:00:00Z");
  await book("franco", "2026-11-14T14:00:00Z", "2026-11-14T14:30:00Z");
  await book("lisandro", "2026-11-14T13:00:00Z", "2026-11-14T14:00:00Z");

  await pg.exec("update appointments set status = 'cancelled' where barber_id = 'lisandro'");
  await book("lisandro", "2026-11-14T13:30:00Z", "2026-11-14T14:00:00Z");
});
