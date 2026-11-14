/**
 * Contenido del sitio — TODO lo editable vive en este archivo.
 *
 * Los datos de contacto, servicios, precios, horarios y equipo salen del
 * perfil público de la barbería en AgendaPro y Google Maps (noviembre 2026).
 * Lo marcado con "COMPLETAR" todavía falta o conviene revisarlo.
 */

/** URL pública del sitio. En Vercel se resuelve sola; se puede forzar con NEXT_PUBLIC_SITE_URL. */
// Con `||` y no `??`: una variable definida pero vacía (como en .env.example) cuenta como no definida.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const site = {
  name: "Frank Barber",
  /** El lema que usan en Instagram. */
  tagline: "Encontrá tu mejor versión.",
  /** Cómo se presentan: "Brindamos la mejor experiencia en cada servicio". */
  promise: "La mejor experiencia en cada servicio.",
  description:
    "Frank Barber, barbería en Caseros. Corte, barba y afeitado con asesoramiento personalizado. Reservá tu turno online o por WhatsApp.",

  contact: {
    /** Número de WhatsApp en formato internacional, solo dígitos. */
    whatsappNumber: "541128311134",
    phoneDisplay: "011 2831-1134",
    /** Teléfono para el link tel: (con + y sin espacios). */
    phoneHref: "+541128311134",
    // COMPLETAR: email de contacto. Con `null` no se muestra ni se ofrece "Enviar por email".
    email: null as string | null,
    /** Usuario de Instagram (sin @). */
    instagramUser: "frankbarbercaseros",
  },

  location: {
    address: "Gral. Manuel Belgrano 4779",
    locality: "Caseros",
    region: "Provincia de Buenos Aires",
    postalCode: "B1678",
    /** Coordenadas para los datos estructurados (Google). */
    geo: { latitude: -34.6068358, longitude: -58.5634561 },
    // Opcional: indicaciones cortas (entre calles, referencia, etc.).
    note: null as string | null,
  },

  /** Página de reservas online. Es a donde lleva "Reservar turno". */
  bookingUrl: "https://agendapro.com/site/ar/frankbarber/80594",

  /** Mensaje con el que se abre WhatsApp desde el sitio. */
  whatsappMessage: "¡Hola! Vengo desde la web de Frank Barber.",
} as const;

export const navigation = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Galería", href: "#galeria" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
] as const;

export type Service = {
  /** Identificador estable: se guarda en la base de datos con cada turno. No cambiarlo. */
  id: string;
  name: string;
  description: string;
  /** Precio en pesos, sin puntos. */
  priceArs: number;
  /** Duración en minutos. Tiene que ser múltiplo de `booking.slotMinutes`. */
  durationMinutes: number;
  /** Etiqueta opcional. Los servicios con etiqueta se muestran destacados. */
  badge?: string;
  /** Qué incluye, en pocas palabras. Se muestra al reservar. */
  includes: string[];
};

/** Servicios y precios. Actualizar acá cuando cambien: valen para la landing y para las reservas. */
export const services: Service[] = [
  {
    id: "corte",
    name: "Corte de cabello",
    description:
      "Con asesoramiento profesional, adaptado a tus rasgos y tu estilo. Incluye lavado premium con productos Schwarzkopf.",
    priceArs: 19000,
    durationMinutes: 30,
    includes: ["Asesoramiento profesional", "Lavado premium Schwarzkopf", "Café de Café Martínez"],
  },
  {
    id: "corte-y-barba",
    name: "Corte y barba",
    description:
      "Corte de cabello y arreglo de barba con asesoramiento personalizado, vapor facial iónico y lavado premium.",
    priceArs: 24000,
    durationMinutes: 60,
    includes: ["Corte + arreglo de barba", "Vapor facial iónico", "Lavado premium Schwarzkopf", "Café de Café Martínez"],
    badge: "Servicio completo",
  },
  {
    id: "barba-clasica",
    name: "Barba clásica",
    description:
      "Perfilado limpio y preciso, con vapor facial iónico y tónicos y aceites que hidratan y ayudan a modelar la barba.",
    priceArs: 18000,
    durationMinutes: 30,
    includes: ["Perfilado a medida", "Vapor facial iónico", "Tónicos y aceites", "Café de Café Martínez"],
  },
  {
    id: "afeitado",
    name: "Afeitado de barba",
    description:
      "Afeitado al ras con vapor facial iónico y productos para hidratar, calmar y proteger la piel.",
    priceArs: 18000,
    durationMinutes: 30,
    includes: ["Afeitado al ras", "Vapor facial iónico", "Hidratación de la piel", "Café de Café Martínez"],
  },
  {
    id: "corte-y-afeitado",
    name: "Corte y afeitado",
    description:
      "Corte de cabello y afeitado al ras, con asesoramiento personalizado, vapor facial iónico y lavado premium.",
    priceArs: 24000,
    durationMinutes: 60,
    includes: ["Corte + afeitado al ras", "Vapor facial iónico", "Lavado premium Schwarzkopf", "Café de Café Martínez"],
  },
];

export function formatPrice(priceArs: number) {
  return `$ ${priceArs.toLocaleString("es-AR")}`;
}

/** Lo que acompaña a todos los servicios. Se muestra como última tarjeta de la grilla. */
export const servicesExtras = {
  title: "En todos los servicios",
  items: ["Espresso, latte o cappuccino de Café Martínez", "Wi-Fi libre", "Un ambiente pensado para relajarte"],
};

export type GalleryItem = {
  /** Ruta dentro de /public (ej. "/images/galeria-1.jpg"). Sin `src` se muestra un placeholder. */
  src?: string;
  alt: string;
  /** Las fotos "tall" ocupan dos filas en la grilla. */
  tall?: boolean;
};

// COMPLETAR: subir las fotos a /public/images y completar `src`.
// Con 8 fotos y este patrón de `tall` la grilla queda completa, sin huecos.
export const gallery: GalleryItem[] = [
  { alt: "Corte degradado", tall: true },
  { alt: "Perfilado de barba" },
  { alt: "Interior del local", tall: true },
  { alt: "Afeitado" },
  { alt: "Corte clásico", tall: true },
  { alt: "Sillón de barbero", tall: true },
  { alt: "Detalle de herramientas" },
  { alt: "Fachada del local" },
];

export const hero = {
  eyebrow: "Barbería profesional · Caseros",
  /** Opcional: imagen de fondo dentro de /public (ej. "/images/hero.jpg"). */
  image: undefined as string | undefined,
};

// COMPLETAR: revisar el texto y sumar la historia de la barbería si quieren contarla.
export const about = {
  title: "Una barbería para sentirte como en casa",
  paragraphs: [
    "En Frank Barber cada corte empieza con una charla. Te asesoramos según tus rasgos, tus preferencias y tu estilo, y nos tomamos el tiempo necesario para que te vayas conforme.",
    "Mientras te atendemos podés disfrutar de un café, con Wi-Fi libre, en un ambiente pensado para que te relajes. Te esperamos de lunes a sábado en Caseros.",
  ],
  highlights: [
    { value: "A medida", label: "Asesoramiento según tu rostro y tu estilo" },
    { value: "Con café", label: "Espresso, latte o cappuccino mientras te atendemos" },
    // Dato de Google Maps a noviembre de 2026: actualizarlo cada tanto.
    { value: "4,8 ★", label: "Más de 180 reseñas en Google" },
  ],
};

export type Barber = {
  /** Identificador estable: se guarda en la base de datos con cada turno. No cambiarlo. */
  id: string;
  name: string;
  role: string;
  photo?: string;
};

// COMPLETAR: fotos del equipo en /public/images, y roles si quieren distinguirlos.
export const barbers: Barber[] = [
  { id: "franco", name: "Franco", role: "Barbero" },
  { id: "lisandro", name: "Lisandro", role: "Barbero" },
  { id: "hernan", name: "Hernán", role: "Barbero" },
  { id: "valentin", name: "Valentín", role: "Barbero" },
];

export type OpeningHours = { days: string; hours: string | null };

/** Horarios tal como se muestran en la landing. `hours: null` = cerrado. */
export const openingHours: OpeningHours[] = [
  { days: "Lunes a miércoles", hours: "9:30 – 20:00" },
  { days: "Jueves a sábado", hours: "9:30 – 20:30" },
  { days: "Domingo", hours: null },
];

/* ---------- Reservas online ---------- */

export type DayHours = { open: string; close: string } | null;

export const booking = {
  /** Con la variable NEXT_PUBLIC_ONLINE_BOOKING=1, "Reservar turno" lleva a /reservar en vez de a AgendaPro. */
  enabled: process.env.NEXT_PUBLIC_ONLINE_BOOKING === "1",
  timeZone: "America/Argentina/Buenos_Aires",
  /** Argentina no cambia la hora, así que el desfasaje con UTC es fijo. */
  utcOffset: "-03:00",
  /** Cada cuánto empieza un turno. */
  slotMinutes: 30,
  /** Hasta cuántos días para adelante se puede reservar. */
  daysAhead: 21,
  /** Anticipación mínima para reservar, en minutos. */
  minLeadMinutes: 60,
  /** Turnos futuros que puede tener un mismo email a la vez. */
  maxActivePerClient: 3,
  /**
   * Horario de atención por día (0 = domingo … 6 = sábado). Tiene que coincidir con `openingHours`.
   * COMPLETAR: hoy todos los barberos atienden todo el horario; falta cargar francos y horarios propios.
   */
  weeklyHours: {
    0: null,
    1: { open: "09:30", close: "20:00" },
    2: { open: "09:30", close: "20:00" },
    3: { open: "09:30", close: "20:00" },
    4: { open: "09:30", close: "20:30" },
    5: { open: "09:30", close: "20:30" },
    6: { open: "09:30", close: "20:30" },
  } as Record<number, DayHours>,
};

/* ---------- Helpers de links ---------- */

export function whatsappLink(message: string = site.whatsappMessage) {
  return `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** A dónde lleva "Reservar turno": al sistema propio si está activado, si no a AgendaPro. */
export const bookingLink = booking.enabled ? "/reservar" : site.bookingUrl;

export const instagramLink = `https://www.instagram.com/${site.contact.instagramUser}/`;

export const cityLine = `${site.location.locality}, ${site.location.region}`;

export const fullAddress = `${site.location.address}, ${cityLine}`;

/** Buscar por nombre + dirección hace que el mapa marque el local y no solo la calle. */
const mapQuery = encodeURIComponent(`${site.name}, ${fullAddress}`);

export const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

export const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
