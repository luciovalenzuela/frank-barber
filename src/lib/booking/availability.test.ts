import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  freeSlots,
  isValidDate,
  isValidTime,
  localDate,
  toInstant,
  weekday,
  type FreeSlotsInput,
} from "./availability.ts";

const OFFSET = "-03:00";
const at = (date: string, time: string) => toInstant(date, time, OFFSET);

// Sábado 14/11/2026, 9:30 a 20:30.
const base: FreeSlotsInput = {
  date: "2026-11-14",
  hours: { open: "09:30", close: "20:30" },
  durationMinutes: 30,
  slotMinutes: 30,
  utcOffset: OFFSET,
  barberIds: ["franco"],
  busy: {},
  notBefore: 0,
};

const times = (input: FreeSlotsInput) => freeSlots(input).map((slot) => slot.time);

test("fechas y horas válidas", () => {
  assert.equal(isValidDate("2026-11-14"), true);
  assert.equal(isValidDate("2026-02-31"), false);
  assert.equal(isValidDate("14/11/2026"), false);
  assert.equal(isValidTime("09:30"), true);
  assert.equal(isValidTime("24:00"), false);
  assert.equal(isValidTime("9:30"), false);
});

test("la fecha local usa la hora de Argentina, no UTC", () => {
  // 01:30 UTC del 15 todavía es 22:30 del 14 en Buenos Aires.
  assert.equal(localDate(new Date("2026-11-15T01:30:00Z"), "America/Argentina/Buenos_Aires"), "2026-11-14");
});

test("sumar días y día de la semana", () => {
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(weekday("2026-11-14"), 6);
  assert.equal(weekday("2026-11-15"), 0);
});

test("un día cerrado no tiene horarios", () => {
  assert.deepEqual(freeSlots({ ...base, hours: null }), []);
});

test("un servicio de 30 min ocupa todo el horario, hasta media hora antes del cierre", () => {
  const result = times(base);
  assert.equal(result[0], "09:30");
  assert.equal(result.at(-1), "20:00");
  assert.equal(result.length, 22);
});

test("un servicio de 60 min tiene que terminar antes del cierre", () => {
  const result = times({ ...base, durationMinutes: 60 });
  assert.equal(result.at(-1), "19:30");
});

test("el instante de inicio se guarda en UTC", () => {
  assert.equal(freeSlots(base)[0].startsAt, "2026-11-14T12:30:00.000Z");
});

test("un turno tomado saca ese horario, pero no los vecinos", () => {
  const busy = { franco: [{ start: at("2026-11-14", "10:00"), end: at("2026-11-14", "10:30") }] };
  const result = times({ ...base, busy });
  assert.equal(result.includes("10:00"), false);
  assert.equal(result.includes("09:30"), true);
  assert.equal(result.includes("10:30"), true);
});

test("un servicio de 60 min no entra si pisa un turno que empieza media hora después", () => {
  const busy = { franco: [{ start: at("2026-11-14", "10:30"), end: at("2026-11-14", "11:00") }] };
  const result = times({ ...base, durationMinutes: 60, busy });
  assert.equal(result.includes("09:30"), true); // termina 10:30, justo cuando empieza el otro
  assert.equal(result.includes("10:00"), false); // terminaría 11:00, pisa
  assert.equal(result.includes("10:30"), false);
  assert.equal(result.includes("11:00"), true);
});

test("sin preferencia: el horario sigue libre mientras quede un barbero", () => {
  const taken = [{ start: at("2026-11-14", "10:00"), end: at("2026-11-14", "10:30") }];
  const oneBusy = freeSlots({ ...base, barberIds: ["franco", "lisandro"], busy: { franco: taken } });
  assert.deepEqual(oneBusy.find((slot) => slot.time === "10:00")?.barberIds, ["lisandro"]);

  const allBusy = times({ ...base, barberIds: ["franco", "lisandro"], busy: { franco: taken, lisandro: taken } });
  assert.equal(allBusy.includes("10:00"), false);
});

test("no se ofrecen horarios anteriores al mínimo de anticipación", () => {
  const result = times({ ...base, notBefore: at("2026-11-14", "15:10") });
  assert.equal(result[0], "15:30");
});
