import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd, type BreadcrumbSegment } from "@/lib/seo/structured-data";

/**
 * Replaces BackLink (components/landing/back-link.tsx) on the /play tree
 * specifically — the one part of the site with a real, multi-level
 * hierarchy to show (Home > Play > category > experience). Reuses
 * .landing-back-link-row's exact row/column so it lines up exactly where
 * BackLink used to sit, and .landing-back-link's own muted link style for
 * every segment but the current page, which renders as plain text
 * (aria-current="page") rather than a link to itself.
 *
 * Bundles the matching BreadcrumbList JSON-LD (lib/seo/structured-data.ts)
 * in the same component so the two can never drift apart — one `trail`
 * prop drives both the visible row and the schema a crawler reads.
 */
export function Breadcrumbs({ trail }: { trail: BreadcrumbSegment[] }) {
  return (
    <>
      <JsonLd data={breadcrumbListJsonLd(trail)} />
      <nav className="landing-back-link-row landing-breadcrumbs" aria-label="Breadcrumb">
        <ol className="landing-breadcrumbs__list">
          {trail.map((segment, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={segment.href} className="landing-breadcrumbs__item">
                {isLast ? (
                  <span className="landing-breadcrumbs__current" aria-current="page">
                    {segment.label}
                  </span>
                ) : (
                  <Link href={segment.href} className="landing-back-link">
                    {segment.label}
                  </Link>
                )}
                {!isLast && (
                  <span className="landing-breadcrumbs__sep" aria-hidden="true">
                    ›
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
