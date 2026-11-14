import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { booking, instagramLink, site, siteUrl } from "@/content/site";
import "./globals.css";

const display = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const title = `${site.name} · Barbería`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: site.name,
    title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a08",
  colorScheme: "dark",
};

/** Datos estructurados para que Google entienda que es un negocio local. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  name: site.name,
  description: site.description,
  url: siteUrl,
  telephone: site.contact.phoneHref,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.location.address,
    addressLocality: site.location.locality,
    addressRegion: site.location.region,
    postalCode: site.location.postalCode,
    addressCountry: "AR",
  },
  geo: { "@type": "GeoCoordinates", ...site.location.geo },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday"],
      opens: "09:30",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Thursday", "Friday", "Saturday"],
      opens: "09:30",
      closes: "20:30",
    },
  ],
  potentialAction: {
    "@type": "ReserveAction",
    target: booking.enabled ? `${siteUrl}/reservar` : site.bookingUrl,
  },
  sameAs: [instagramLink],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-svh font-sans">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {/* Sin JavaScript no hay animación de entrada: se muestra todo directamente. */}
        <noscript>
          <style>{`.reveal { opacity: 1; transform: none; }`}</style>
        </noscript>
      </body>
    </html>
  );
}
