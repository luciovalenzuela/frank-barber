import { randomBytes } from "node:crypto";
import { z } from "zod";
import { booking } from "@/content/site";
import {
  ANY_BARBER,
  addDays,
  freeSlots,
  isValidDate,
  isValidTime,
  localDate,
  toInstant,
  weekday,
  type DayAvailability,
  type Interval,
  type DayHours,
  type Slot,
} from "@/lib/booking/availability";
import { getCatalog, type Catalog } from "./catalog";
import { getDb, isOverlapError } from "./db/client";
import { sendBookingEmails, sendCancellationEmails } from "./emails";

export type Appointment = {
  id: string;
  token: string;
  status: "confirmed" | "cancelled";
  startsAt: Date;
  endsAt: Date;
  barberId: string;
  barberName: string;
  serviceName: string;
  priceArs: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
};

type AppointmentRow = {
  id: string;
  barber_name: string | null;
  manage_token: string;
  status: "confirmed" | "cancelled";
  starts_at: Date | string;
  ends_at: Date | string;
  barber_id: string;
  service_name: string;
  price_ars: number;
  client_name: string;
  client_email: string;
  client_phone: string;
};

const APPOINTMENT_SELECT = `
  select a.id, a.manage_token, a.status, a.starts_at, a.ends_at, a.barber_id, b.name as barber_name,
         a.service_name, a.price_ars,
         c.name as client_name, c.email as client_email, c.phone as client_phone
  from appointments a
  join clients c on c.id = a.client_id
  left join barbers b on b.id = a.barber_id`;

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    token: row.manage_token,
    status: row.status,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    barberId: row.barber_id,
    barberName: row.barber_name ?? row.barber_id,
    serviceName: row.service_name,
    priceArs: row.price_ars,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
  };
}

function resolveBarberIds(catalog: Catalog, barberChoice: string) {
  if (barberChoice === ANY_BARBER) return catalog.barbers.map((barber) => barber.id);
  return catalog.barbers.some((barber) => barber.id === barberChoice) ? [barberChoice] : null;
}

/** Turnos confirmados de los barberos indicados que caen dentro del rango. */
async function loadBusy(barberIds: string[], from: Date, to: Date) {
  const db = await getDb();
  const rows = await db.query<{ barber_id: string; starts_at: Date | string; ends_at: Date | string }>(
    `select barber_id, starts_at, ends_at
     from appointments
     where status = 'confirmed'
       and barber_id = any($1::text[])
       and starts_at < $3::timestamptz
       and ends_at > $2::timestamptz`,
    [barberIds, from.toISOString(), to.toISOString()],
  );

  const busy: Record<string, Interval[]> = {};
  for (const row of rows) {
    (busy[row.barber_id] ??= []).push({
      start: new Date(row.starts_at).getTime(),
      end: new Date(row.ends_at).getTime(),
    });
  }
  return busy;
}

function slotsFor(
  catalog: Catalog,
  date: string,
  durationMinutes: number,
  barberIds: string[],
  busy: Record<string, Interval[]>,
  now: Date,
) {
  const day = weekday(date);
  const barberHours: Record<string, DayHours> = {};
  for (const id of barberIds) barberHours[id] = catalog.hours[id]?.[day] ?? null;

  return freeSlots({
    date,
    barberHours,
    durationMinutes,
    slotMinutes: booking.slotMinutes,
    utcOffset: booking.utcOffset,
    busy,
    notBefore: now.getTime() + booking.minLeadMinutes * 60_000,
  });
}

/** Días reservables desde hoy, con los horarios libres y qué barberos pueden en cada uno. */
export async function getAvailability(serviceId: string): Promise<DayAvailability[] | null> {
  const catalog = await getCatalog();
  const service = catalog.services.find((item) => item.id === serviceId);
  if (!service) return null;

  const barberIds = catalog.barbers.map((barber) => barber.id);
  const now = new Date();
  const today = localDate(now, booking.timeZone);
  const dates = Array.from({ length: booking.daysAhead }, (_, index) => addDays(today, index));
  const windowEnd = new Date(toInstant(addDays(today, booking.daysAhead), "00:00", booking.utcOffset));
  const busy = await loadBusy(barberIds, now, windowEnd);

  return dates.map((date) => ({
    date,
    slots: slotsFor(catalog, date, service.durationMinutes, barberIds, busy, now).map((slot) => ({
      time: slot.time,
      barberIds: slot.barberIds,
    })),
  }));
}

const bookingSchema = z.object({
  serviceId: z.string(),
  barberId: z.string(),
  date: z.string().refine(isValidDate),
  time: z.string().refine(isValidTime),
  name: z.string().trim().min(2, "Escribí tu nombre.").max(80, "El nombre es demasiado largo."),
  email: z.string().trim().toLowerCase().pipe(z.email("Revisá el email: no parece válido.").max(120)),
  phone: z
    .string()
    .trim()
    .max(25, "El teléfono es demasiado largo.")
    .regex(/^[+\d][\d\s()-]*$/, "El teléfono solo puede tener números, espacios y guiones.")
    .refine((value) => value.replace(/\D/g, "").length >= 8, "Revisá el teléfono: le faltan números."),
});

export type BookingInput = z.input<typeof bookingSchema>;

export type BookingResult =
  | { ok: true; token: string }
  /** `slot_taken`: el horario se ocupó mientras el cliente completaba el formulario. */
  | { ok: false; code: "invalid" | "slot_taken" | "limit" | "error"; message: string };

const SLOT_TAKEN: BookingResult = {
  ok: false,
  code: "slot_taken",
  message: "Ese horario se acaba de ocupar. Elegí otro, por favor.",
};

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid", message: parsed.error.issues[0]?.message || "Revisá los datos del turno." };
  }
  const data = parsed.data;

  const catalog = await getCatalog();
  const service = catalog.services.find((item) => item.id === data.serviceId);
  const barberIds = resolveBarberIds(catalog, data.barberId);
  if (!service || !barberIds) {
    return { ok: false, code: "invalid", message: "Elegí un servicio y un barbero." };
  }

  // Nunca confiamos en el horario que manda el navegador: se vuelve a calcular acá.
  const now = new Date();
  const today = localDate(now, booking.timeZone);
  if (data.date < today || data.date >= addDays(today, booking.daysAhead)) {
    return { ok: false, code: "invalid", message: "Esa fecha no está disponible para reservar." };
  }

  const dayStart = new Date(toInstant(data.date, "00:00", booking.utcOffset));
  const dayEnd = new Date(toInstant(addDays(data.date, 1), "00:00", booking.utcOffset));
  const busy = await loadBusy(barberIds, dayStart, dayEnd);
  const slot: Slot | undefined = slotsFor(catalog, data.date, service.durationMinutes, barberIds, busy, now).find(
    (item) => item.time === data.time,
  );
  if (!slot) return SLOT_TAKEN;

  const db = await getDb();

  const [client] = await db.query<{ id: string }>(
    `insert into clients (email, name, phone)
     values ($1, $2, $3)
     on conflict (email) do update set name = excluded.name, phone = excluded.phone, updated_at = now()
     returning id`,
    [data.email, data.name, data.phone],
  );

  const [{ count }] = await db.query<{ count: number }>(
    `select count(*)::int as count from appointments
     where client_id = $1 and status = 'confirmed' and starts_at > now()`,
    [client.id],
  );
  if (count >= booking.maxActivePerClient) {
    return {
      ok: false,
      code: "limit",
      message: `Ya tenés ${count} turnos reservados. Cancelá alguno o escribinos por WhatsApp para sumar otro.`,
    };
  }

  // Sin preferencia: probamos primero con el barbero que menos turnos tiene ese día.
  const candidates = [...slot.barberIds].sort((a, b) => (busy[a]?.length ?? 0) - (busy[b]?.length ?? 0));
  const startsAt = new Date(slot.startsAt);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  for (const barberId of candidates) {
    const token = randomBytes(24).toString("base64url");
    try {
      await db.query(
        `insert into appointments
           (client_id, barber_id, barber_chosen, service_id, service_name, price_ars, starts_at, ends_at, manage_token)
         values ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9)`,
        [
          client.id,
          barberId,
          data.barberId !== ANY_BARBER,
          service.id,
          service.name,
          service.priceArs,
          startsAt.toISOString(),
          endsAt.toISOString(),
          token,
        ],
      );
    } catch (error) {
      // Otro cliente tomó ese barbero en el mismo instante: probamos con el siguiente.
      if (isOverlapError(error)) continue;
      throw error;
    }

    const appointment = await getAppointment(token);
    if (appointment) await sendBookingEmails(appointment);
    return { ok: true, token };
  }

  return SLOT_TAKEN;
}

export async function getAppointment(token: string): Promise<Appointment | null> {
  // Los tokens son base64url de 32 caracteres: cualquier otra cosa ni se consulta.
  if (!/^[\w-]{20,64}$/.test(token)) return null;
  const db = await getDb();
  const [row] = await db.query<AppointmentRow>(`${APPOINTMENT_SELECT} where a.manage_token = $1`, [token]);
  return row ? toAppointment(row) : null;
}

/** ¿Ya empezó (o pasó) el turno? */
export function hasStarted(appointment: Appointment) {
  return appointment.startsAt.getTime() <= Date.now();
}

export type CancelResult = { ok: true } | { ok: false; message: string };

export async function cancelAppointment(token: string): Promise<CancelResult> {
  const appointment = await getAppointment(token);
  if (!appointment) return { ok: false, message: "No encontramos ese turno." };
  if (appointment.status === "cancelled") return { ok: true };
  if (hasStarted(appointment)) {
    return { ok: false, message: "Ese turno ya pasó y no se puede cancelar." };
  }

  const db = await getDb();
  const updated = await db.query(
    `update appointments set status = 'cancelled', cancelled_at = now()
     where id = $1 and status = 'confirmed'
     returning id`,
    [appointment.id],
  );
  if (updated.length > 0) await sendCancellationEmails(appointment);
  return { ok: true };
}
