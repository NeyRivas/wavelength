/**
 * Quiet reassurance band, same pattern as for-couples-not-about-right.tsx
 * (soft tint, centered, standalone statement, no CTA) — mirrored as its
 * own .ff-how* classes (app/globals.css) rather than reusing .fc-reassure
 * directly, consistent with this file family's existing convention of
 * page-scoped names (.fc-*, .wtp-*, .gtk-*) even when the underlying
 * values match exactly.
 *
 * The copy itself is its own, accurate wording for how these two games
 * actually work (lib/wavelength/guess-accuracy.ts,
 * lib/wavelength/friendship-memory.ts): unlike the couples experience
 * (genuinely no score at all — see ForCouplesNotAboutRight's own copy),
 * both Friends games DO produce a real result: a count of how many of
 * the other person's guesses were correct, out of twelve (never a
 * percentage, never a compatibility label — computeGuessAccuracy/
 * computeFriendshipMemory only ever return a correct/total count and one
 * of four fixed tier messages). This section says exactly that — a
 * friendship trivia score, not a compatibility score — rather than
 * reusing "no score" language that wouldn't be true for this experience.
 */
export function ForFriendsHowItWorks() {
  return (
    <section className="ff-how">
      <div className="ff-how__inner">
        <h2 className="ff-how__heading">A friendship trivia game, not a popularity contest.</h2>
        <p className="ff-how__text">
          There&apos;s no compatibility score, and nothing about your friendship gets judged.
          You&apos;ll just see a simple count of how many answers your friend guessed right — a fun
          way to find out who really knows who.
        </p>
      </div>
    </section>
  );
}
