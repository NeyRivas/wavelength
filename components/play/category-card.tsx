import Link from "next/link";

/**
 * One of /play's three top-level options (Dating & Couples, Friends, Make
 * Your Own). Same card visual system as the ready-made game cards
 * (game-card.tsx: .landing-card + a .landing-card__blob accent) so both
 * screens of /play read as one consistent experience — this is plain
 * navigation (a Link, not a Server Action), since choosing a category is
 * just routing to /play/[group], and "Make Your Own" routes straight to
 * the existing /create.
 *
 * `vividClass` (visual-refresh pass, reusing the exact Dating & Couples
 * treatment — see game-card.tsx/globals.css's .game-card--vivid*): a
 * pastel gradient, two soft decorative shapes, and a glass "Choose" CTA.
 * app/play/page.tsx passes one of the three existing --vivid-a/b/c
 * variants to each card; nothing else about this component's own markup
 * changed beyond the one new CTA line.
 */
export function CategoryCard({
  href,
  title,
  description,
  blobClass,
  vividClass,
}: {
  href: string;
  title: string;
  description: string;
  blobClass: string;
  vividClass?: string;
}) {
  const cardClassName = `landing-card game-card${vividClass ? ` game-card--vivid ${vividClass}` : ""}`;

  return (
    <Link href={href} className={cardClassName}>
      <div className={`landing-card__blob ${blobClass}`} aria-hidden="true" />
      <h2 className="game-card__title">{title}</h2>
      <p className="category-card__text">{description}</p>
      <span className="game-card__cta">
        Choose <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
