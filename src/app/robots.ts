import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Los links de turnos son personales y la API no es contenido.
    rules: { userAgent: "*", allow: "/", disallow: ["/turno/", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
