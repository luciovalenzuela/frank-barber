import { cacheLife } from "next/cache";
import { barbers as defaultBarbers, booking, services as defaultServices, type Barber, type Service } from "@/content/site";
import type { DayHours } from "@/lib/booking/availability";
import { getDb, isDatabaseConfigured } from "./db/client";

/**
 * Servicios, barberos y horarios. Viven en la base (tablas services, barbers y
 * barber_hours) y se editan desde Supabase. Si la base no está configurada, se
 * usan los valores de src/content/site.ts.
 */
export type Catalog = {
  services: Service[];
  barbers: Barber[];
  /** Horario de cada barbero por día de la semana (0 = domingo). Sin entrada = no atiende. */
  hours: Record<string, Record<number, DayHours>>;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  includes: string[];
  price_ars: number;
  duration_minutes: number;
  badge: string | null;
};

type BarberRow = { id: string; name: string; role: string; photo_url: string | null };

type HoursRow = { barber_id: string; weekday: number; opens: string; closes: string };

function fallbackCatalog(): Catalog {
  const hours: Catalog["hours"] = {};
  for (const barber of defaultBarbers) hours[barber.id] = { ...booking.weeklyHours };
  return { services: defaultServices, barbers: defaultBarbers, hours };
}

/** Catálogo al día, leído en el momento. Lo usan las reservas. */
export async function getCatalog(): Promise<Catalog> {
  if (!isDatabaseConfigured()) return fallbackCatalog();

  const db = await getDb();
  const [serviceRows, barberRows, hoursRows] = await Promise.all([
    db.query<ServiceRow>(
      `select id, name, description, includes, price_ars, duration_minutes, badge
       from services where active order by sort_order, name`,
    ),
    db.query<BarberRow>(`select id, name, role, photo_url from barbers where active order by sort_order, name`),
    db.query<HoursRow>(
      `select h.barber_id, h.weekday, to_char(h.opens, 'HH24:MI') as opens, to_char(h.closes, 'HH24:MI') as closes
       from barber_hours h join barbers b on b.id = h.barber_id where b.active`,
    ),
  ]);

  const hours: Catalog["hours"] = {};
  for (const row of barberRows) hours[row.id] = {};
  for (const row of hoursRows) {
    (hours[row.barber_id] ??= {})[row.weekday] = { open: row.opens, close: row.closes };
  }

  return {
    services: serviceRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      includes: row.includes,
      priceArs: row.price_ars,
      durationMinutes: row.duration_minutes,
      ...(row.badge ? { badge: row.badge } : {}),
    })),
    barbers: barberRows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      ...(row.photo_url ? { photo: row.photo_url } : {}),
    })),
    hours,
  };
}

/**
 * El mismo catálogo, guardado en caché unos minutos, para las páginas públicas
 * (landing y /reservar). Un cambio de precio en Supabase se ve en el sitio en
 * pocos minutos sin volver a deployar.
 */
export async function getPublicCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  try {
    return await getCatalog();
  } catch (error) {
    // Si la base no responde, la landing se sigue viendo con los datos del código.
    console.error("[catalogo]", error);
    return fallbackCatalog();
  }
}
