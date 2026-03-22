import type { MetadataRoute } from "next";

const BASE_URL = "https://www.tryclean.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date("2026-03-22"),
    },
    {
      url: `${BASE_URL}/pricing-plan`,
      lastModified: new Date("2026-03-22"),
    },
    {
      url: `${BASE_URL}/waitlist`,
      lastModified: new Date("2026-03-22"),
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date("2026-03-22"),
    },
  ];
}
