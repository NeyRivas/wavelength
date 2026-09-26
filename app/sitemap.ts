import type { MetadataRoute } from "next";

const BASE_URL = "https://sameeeish.com";

/**
 * Only the approved, canonical marketing pages — no questionnaire
 * tokens, results, or other dynamic app routes (see app/robots.ts for the
 * matching disallow rules on those).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ways-to-play`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/for-couples`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${BASE_URL}/faq`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
}
