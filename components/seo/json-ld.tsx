/**
 * Renders one JSON-LD structured-data block. A plain server component —
 * no hooks, no "use client" — so it costs nothing on the client and works
 * everywhere a page or a shared content component (e.g. ExperienceFaq,
 * FaqSection — see lib/seo/structured-data.ts for the object builders)
 * wants to emit schema.org markup alongside the same visible content it
 * describes.
 *
 * `<` is escaped to `<` so a value containing a literal `</script>`
 * (unlikely in this app's own copy, but not impossible) can never close
 * the tag early or inject markup — the same escape Next.js's own
 * `generateMetadata` JSON-LD examples use.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
