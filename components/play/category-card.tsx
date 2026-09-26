import Link from "next/link";

/**
 * One of /play's three top-level options (Dating & Couples, Friends, Make
 * Your Own). Same card visual system as the ready-made game cards
 * (game-card.tsx: .landing-card + a .landing-card__blob accent) so both
 * screens of /play read as one consistent experience — this is plain
 * navigation (a Link, not a Server Action), since choosing a category is
 * just routing to /play/[group], and "Make Your Own" routes straight to
 * the existing /create. Deliberately just a heading + one line of
 * supporting text, nothing else — no extra CTA label, no metadata.
 */
export function CategoryCard({
  href,
  title,
  description,
  blobClass,
}: {
  href: string;
  title: string;
  description: string;
  blobClass: string;
}) {
  return (
    <Link href={href} className="landing-card game-card">
      <div className={`landing-card__blob ${blobClass}`} aria-hidden="true" />
      <h2 className="game-card__title">{title}</h2>
      <p className="category-card__text">{description}</p>
    </Link>
  );
}
