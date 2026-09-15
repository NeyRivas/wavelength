/**
 * Quiet reassurance band between "Small questions" and the closing
 * summary — the page's clearest, standalone statement of the "not a
 * compatibility test" positioning: no score, no percentage, no verdict on
 * the relationship. Soft peach tint (color-mix'd toward white, same
 * treatment as the peach step panel on /how-it-works) rather than the
 * dark ink used for the CTA/contrast sections, so it reads as a calm
 * aside, not another headline moment.
 */
export function ForCouplesNotAboutRight() {
  return (
    <section className="fc-reassure">
      <div className="fc-reassure__inner">
        <h2 className="fc-reassure__heading">
          It&apos;s not about the &ldquo;right&rdquo; answer.
        </h2>
        <p className="fc-reassure__text">
          There&apos;s no passing score, and no percentage that decides how compatible you are.
          Wavelength just shows you where your answers land next to each other — so the moments you
          match become a nice surprise, and the moments you don&apos;t become something worth
          talking about.
        </p>
      </div>
    </section>
  );
}
