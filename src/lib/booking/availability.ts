/**
 * Cálculo de horarios disponibles. Funciones puras: no tocan la base ni el
 * reloj, reciben todo por parámetro, así se pueden testear (availability.test.ts).
 *
 * Las fechas "locales" son strings YYYY-MM-DD y las horas HH:MM, siempre en la
 * hora de la barbería. Los instantes se manejan en milisegundos UTC.
 */

/** Valor del selector de barbero cuando el cliente no tiene preferencia. */
export const ANY_BARBER = "cualquiera";

/** Disponibilidad de un día, tal como la devuelve /api/disponibilidad. */
export type DayAvailability = {
  /** Fecha local, YYYY-MM-DD. */
  date: string;
  /** Horarios con al menos un barbero libre. Vacío si está cerrado o completo. */
  slots: { time: string; barberIds: string[] }[];
};

export type DayHours = { open: string; close: string } | null;

/** Intervalo ocupado, en milisegundos UTC. `end` es exclusivo. */
export type Interval = { start: number; end: number };

export type Slot = {
  /** Hora local de inicio, HH:MM. */
  time: string;
  /** Instante de inicio, ISO 8601 en UTC. */
  startsAt: string;
  /** Barberos libres en ese horario. */
  barberIds: string[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** ¿Es una fecha real con formato YYYY-MM-DD? (rechaza 2026-02-31) */
export function isValidDate(date: string) {
  if (!DATE_PATTERN.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function isValidTime(time: string) {
  return TIME_PATTERN.test(time);
}

/** Fecha local (YYYY-MM-DD) de un instante, en la zona horaria dada. */
export function localDate(instant: Date, timeZone: string) {
  // El formato en-CA es justamente YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    instant,
  );
}

export function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

/** Día de la semana de una fecha local: 0 = domingo … 6 = sábado. */
export function weekday(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Instante (ms UTC) de una fecha y hora locales. `utcOffset` con formato "-03:00". */
export function toInstant(date: string, time: string, utcOffset: string) {
  return new Date(`${date}T${time}:00${utcOffset}`).getTime();
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

export type FreeSlotsInput = {
  date: string;
  /** Horario de atención de ese día; `null` si está cerrado. */
  hours: DayHours;
  durationMinutes: number;
  slotMinutes: number;
  utcOffset: string;
  /** Barberos a considerar: uno solo, o todos si el cliente no tiene preferencia. */
  barberIds: string[];
  /** Turnos ya tomados de cada barbero. */
  busy: Record<string, Interval[]>;
  /** No se ofrecen horarios que empiecen antes de este instante (ms UTC). */
  notBefore: number;
};

/**
 * Horarios de un día en los que al menos un barbero puede hacer el servicio
 * completo: arranca dentro del horario, termina antes del cierre y no pisa
 * ningún turno existente.
 */
export function freeSlots(input: FreeSlotsInput): Slot[] {
  const { date, hours, durationMinutes, slotMinutes, utcOffset, barberIds, busy, notBefore } = input;
  if (!hours) return [];

  const lastStart = toMinutes(hours.close) - durationMinutes;
  const slots: Slot[] = [];

  for (let minutes = toMinutes(hours.open); minutes <= lastStart; minutes += slotMinutes) {
    const time = toTime(minutes);
    const start = toInstant(date, time, utcOffset);
    if (start < notBefore) continue;

    const wanted: Interval = { start, end: start + durationMinutes * 60_000 };
    const free = barberIds.filter((id) => !(busy[id] ?? []).some((taken) => overlaps(wanted, taken)));

    if (free.length > 0) {
      slots.push({ time, startsAt: new Date(start).toISOString(), barberIds: free });
    }
  }

  return slots;
}
