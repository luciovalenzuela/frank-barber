/**
 * Contenido del sitio — TODO lo editable vive en este archivo.
 *
 * Los valores marcados con "COMPLETAR" son de ejemplo: reemplazalos por los
 * datos reales de la barbería antes de publicar.
 */

/** URL pública del sitio. En Vercel se resuelve sola; se puede forzar con NEXT_PUBLIC_SITE_URL. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const site = {
  name: "Frank Barber",
  tagline: "Cortes clásicos, estilo de hoy.",
  description:
    "Frank Barber: barbería de oficio. Cortes, barba y afeitado clásico a navaja. Reservá tu turno por WhatsApp.",

  contact: {
    // COMPLETAR: número de WhatsApp en formato internacional, solo dígitos (54 9 + área + número).
    whatsappNumber: "5491100000000",
    // COMPLETAR: teléfono tal como se quiere mostrar.
    phoneDisplay: "+54 9 11 0000-0000",
    // COMPLETAR: teléfono para el link tel: (con + y sin espacios).
    phoneHref: "+5491100000000",
    // COMPLETAR: email que recibe las consultas del formulario.
    email: "hola@example.com",
    // COMPLETAR: usuario de Instagram (sin @).
    instagramUser: "frankbarber",
  },

  location: {
    // COMPLETAR: dirección real. También se usa para ubicar el mapa.
    address: "Av. Siempre Viva 123",
    city: "Buenos Aires, Argentina",
    // Opcional: indicaciones cortas (piso, entre calles, etc.).
    note: "Local a la calle",
  },

  /** Mensaje con el que se abre WhatsApp al tocar "Reservar turno". */
  bookingMessage: "¡Hola! Quiero reservar un turno en Frank Barber.",
} as const;

export const navigation = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Galería", href: "#galeria" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
] as const;

export type Service = {
  name: string;
  description: string;
  price: string;
  duration: string;
  featured?: boolean;
};

// COMPLETAR: lista real de servicios y precios.
export const services: Service[] = [
  {
    name: "Corte",
    description: "Corte a tijera o máquina, lavado y peinado.",
    price: "$ 00.000",
    duration: "40 min",
  },
  {
    name: "Corte + Barba",
    description: "El combo completo: corte, perfilado de barba y toalla caliente.",
    price: "$ 00.000",
    duration: "60 min",
    featured: true,
  },
  {
    name: "Barba",
    description: "Perfilado, rebaje y terminación con navaja.",
    price: "$ 00.000",
    duration: "25 min",
  },
  {
    name: "Afeitado clásico",
    description: "Afeitado a navaja con toalla caliente y bálsamo.",
    price: "$ 00.000",
    duration: "30 min",
  },
  {
    name: "Corte niños",
    description: "Para los más chicos, hasta 12 años.",
    price: "$ 00.000",
    duration: "30 min",
  },
  {
    name: "Cejas",
    description: "Perfilado de cejas con navaja.",
    price: "$ 00.000",
    duration: "10 min",
  },
];

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
  { alt: "Afeitado a navaja" },
  { alt: "Corte clásico", tall: true },
  { alt: "Sillón de barbero", tall: true },
  { alt: "Detalle de herramientas" },
  { alt: "Fachada del local" },
];

export const hero = {
  eyebrow: "Barbería de oficio",
  /** Opcional: imagen de fondo dentro de /public (ej. "/images/hero.jpg"). */
  image: undefined as string | undefined,
};

// COMPLETAR: historia y bajada reales.
export const about = {
  title: "Oficio, navaja y buena charla",
  paragraphs: [
    "Frank Barber nació de una idea simple: que cortarse el pelo vuelva a ser un rato para uno. Un sillón cómodo, un trabajo prolijo y sin apuro.",
    "Combinamos las técnicas de la barbería clásica con los estilos de hoy. Cada corte se conversa antes de empezar y se termina con el detalle que hace la diferencia.",
  ],
  highlights: [
    { value: "Clásico", label: "Tijera, navaja y toalla caliente" },
    { value: "A medida", label: "Cada corte se conversa primero" },
    { value: "Con turno", label: "Sin esperas ni apuros" },
  ],
};

export type Barber = { name: string; role: string; photo?: string };

// COMPLETAR: equipo real (y fotos en /public/images).
export const barbers: Barber[] = [
  { name: "Frank", role: "Fundador y barbero" },
  { name: "Nombre Apellido", role: "Barbero" },
  { name: "Nombre Apellido", role: "Barbero" },
];

export type OpeningHours = { days: string; hours: string | null };

// COMPLETAR: horarios reales. `hours: null` = cerrado.
export const openingHours: OpeningHours[] = [
  { days: "Lunes", hours: null },
  { days: "Martes a viernes", hours: "10:00 – 20:00" },
  { days: "Sábado", hours: "10:00 – 18:00" },
  { days: "Domingo", hours: null },
];

/* ---------- Helpers de links ---------- */

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${site.contact.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const bookingLink = whatsappLink(site.bookingMessage);

export const instagramLink = `https://www.instagram.com/${site.contact.instagramUser}/`;

export const fullAddress = `${site.location.address}, ${site.location.city}`;

export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  fullAddress,
)}&output=embed`;

export const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  fullAddress,
)}`;
