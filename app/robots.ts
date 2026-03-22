import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/onboarding/",
          "/sign-in/",
          "/sign-up/",
          "/sso-callback/",
          "/forgot-password/",
          "/invite/",
          "/success/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.tryclean.ai/sitemap.xml",
  };
}
