import type { MetadataRoute } from "next";
import { booking, siteUrl } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [{ url: siteUrl, changeFrequency: "monthly", priority: 1 }];
  if (booking.enabled) {
    pages.push({ url: `${siteUrl}/reservar`, changeFrequency: "monthly", priority: 0.8 });
  }
  return pages;
}
