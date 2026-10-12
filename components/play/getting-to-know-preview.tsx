import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/wavelength/categories";
import { GETTING_TO_KNOW_EACH_OTHER_QUESTIONS } from "@/lib/wavelength/ready-made-games";

const SAMPLE_PER_CATEGORY = 2;

/**
 * Reuses the existing --wl-* tint vocabulary (the same five names
 * app/globals.css's .gtk-browse-group__pill--* already accepts) rather
 * than inventing new colors — one tint per category actually present in
 * GETTING_TO_KNOW_EACH_OTHER_QUESTIONS (relationship, lifestyle,
 * adventures_travel, values_priorities; "money" and "future" never occur
 * in this game, so they're simply absent from both this map and the
 * rendered output below).
 */
const CATEGORY_TINTS: Partial<Record<Category, string>> = {
  relationship: "pink",
  lifestyle: "mint",
  adventures_travel: "blue",
  values_priorities: "lavender",
};

/**
 * SEO pass: a plain Server Component (no "use client") rendering a small,
 * fixed sample of real question text from GETTING_TO_KNOW_EACH_OTHER_QUESTIONS
 * (lib/wavelength/ready-made-games.ts) — the exact same array the actual
 * game seeds a draft Wavelength with via startReadyMadeGame
 * (app/actions/ready-made-games.ts), so this preview can never drift into
 * showing questions the product doesn't actually ask.
 *
 * Deliberately a small, deterministic slice — the first SAMPLE_PER_CATEGORY
 * questions per category, in source order, grouped by the existing
 * CATEGORY_LABELS (lib/wavelength/categories.ts) — not the full 12-question
 * set and not a random pick, same reasoning as
 * components/date-night/date-night-preview.tsx's own sample: a genuine
 * taste of real content, not an attempt to rank via sheer text volume, and
 * cheap to keep in sync since it's computed from the one real data array
 * rather than a separately maintained copy.
 */
export function GettingToKnowPreview() {
  const groups = CATEGORIES.filter((category) => CATEGORY_TINTS[category])
    .map((category) => ({
      category,
      questions: GETTING_TO_KNOW_EACH_OTHER_QUESTIONS.filter((q) => q.category === category).slice(
        0,
        SAMPLE_PER_CATEGORY,
      ),
    }))
    .filter((group) => group.questions.length > 0);

  return (
    <section className="gtk-browse" aria-label="Sample getting to know each other questions">
      <h2 className="gtk-browse__heading">A few questions to start with</h2>
      <p className="gtk-browse__subtitle">
        A small taste of our getting to know each other questions, grouped by theme.
      </p>
      {groups.map((group) => (
        <div key={group.category} className="gtk-browse-group">
          <h3 className="gtk-browse-group__heading">
            <span
              className={`gtk-browse-group__pill gtk-browse-group__pill--${CATEGORY_TINTS[group.category]}`}
            >
              {CATEGORY_LABELS[group.category]}
            </span>
          </h3>
          <ul className="gtk-browse-group__list">
            {group.questions.map((question) => (
              <li key={question.text} className="gtk-browse-item">
                {question.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
