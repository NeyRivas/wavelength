import { catalogHref, catalogSection, type CatalogCard } from "@/lib/wavelength/catalog";
import type { ReadyMadeGameGroup } from "@/lib/wavelength/ready-made-games";

import type { BreadcrumbSegment } from "./structured-data";

/**
 * Breadcrumb trails for the /play tree — the one part of the site with a
 * real, multi-level hierarchy (Home > Play > category > experience).
 * Every label here is read from lib/wavelength/catalog.ts's
 * CATALOG_SECTIONS, the same data the category pages' own headings and
 * card titles already come from, so a trail can never say something
 * different from the page it leads to or from. Every other marketing
 * page (/, /how-it-works, /for-couples, …) sits one level under Home and
 * keeps its plain BackLink instead — a two-item trail there would add
 * markup without adding real hierarchy information.
 */

const HOME: BreadcrumbSegment = { label: "Home", href: "/" };
const PLAY: BreadcrumbSegment = { label: "Play", href: "/play" };

export function playRootBreadcrumb(): BreadcrumbSegment[] {
  return [HOME, PLAY];
}

export function playCategoryBreadcrumb(group: ReadyMadeGameGroup): BreadcrumbSegment[] {
  const section = catalogSection(group);
  return [...playRootBreadcrumb(), { label: section.heading, href: `/play/${group}` }];
}

function cardBreadcrumbSegment(group: ReadyMadeGameGroup, gameId: string): BreadcrumbSegment {
  const card = catalogSection(group).cards.find((c: CatalogCard) => c.gameId === gameId);
  if (!card) throw new Error(`no catalog card for game "${gameId}" in group "${group}"`);
  return { label: card.title, href: catalogHref(card) };
}

export function playExperienceBreadcrumb(
  group: ReadyMadeGameGroup,
  gameId: string,
): BreadcrumbSegment[] {
  return [...playCategoryBreadcrumb(group), cardBreadcrumbSegment(group, gameId)];
}
