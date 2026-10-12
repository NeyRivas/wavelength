import { DATE_NIGHT_QUESTIONS, MOOD_LABELS, MOOD_TINTS, MOODS } from "@/lib/date-night/questions";

const SAMPLE_PER_MOOD = 2;

/**
 * SEO pass: a plain Server Component (no "use client") rendering a small,
 * fixed sample of real question text — unlike DateNightExperience (the
 * interactive mood filter/search/swipe/favorites tool just below this,
 * mounted via DateNightExperienceLoader's `ssr:false` dynamic import),
 * this has no state, no interactivity, and ships in the page's initial
 * HTML. It exists so a crawler (or any no-JS/pre-hydration view) sees
 * real, substantial date-night question text and mood categories, not
 * just the three-line hero above it.
 *
 * Deliberately a small, deterministic slice — the first SAMPLE_PER_MOOD
 * questions per mood, in source order — not the full ~60-question
 * library and not a random pick. A full server-rendered dump would just
 * duplicate the interactive tool's own "Browse Questions" section (which
 * already lists everything, filterable) for no real benefit, and reads
 * as an attempt to rank via sheer text volume rather than a genuine,
 * stable preview; a representative sample is both honest about what
 * this section is (a taste, not the catalog) and cheap to keep in sync
 * since it's computed from the same `DATE_NIGHT_QUESTIONS` array the
 * interactive tool already uses, not a separately maintained copy.
 *
 * Reuses the exact `.dn-browse*` classes DateNightExperience's own
 * "Browse Questions" section already uses (app/globals.css) — same
 * visual language, zero new CSS — minus the interactive
 * button/favorite-heart markup those list items use, since this list
 * has nothing to click.
 */
export function DateNightPreview() {
  const groups = MOODS.map((mood) => ({
    mood,
    questions: DATE_NIGHT_QUESTIONS.filter((q) => q.moods[0] === mood).slice(0, SAMPLE_PER_MOOD),
  })).filter((group) => group.questions.length > 0);

  return (
    <section className="dn-browse" aria-label="Sample date night questions">
      <h2 className="dn-browse__heading">A few questions to start with</h2>
      <p className="dn-browse__subtitle">
        A small taste of our date night questions, grouped by mood — flirty, funny, romantic,
        random, deep, and hypothetical.
      </p>
      {groups.map((group) => (
        <div key={group.mood} className="dn-browse-group">
          <h3 className="dn-browse-group__heading">
            <span
              className={`dn-browse-group__pill dn-browse-group__pill--${MOOD_TINTS[group.mood]}`}
            >
              {MOOD_LABELS[group.mood]}
            </span>
          </h3>
          <ul className="dn-browse-group__list">
            {group.questions.map((question) => (
              <li key={question.id} className="dn-browse-item">
                <span className="dn-browse-item__main">
                  <span className="dn-browse-item__text">{question.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
