import styles from "./result-cards.module.css";

export const CARD_COUNT = 4;

// Pastel palette, one color per dot — growing in size left to right, like a
// small cluster of light bubbles rather than a plain web progress bar.
// Ported verbatim from the approved prototype.
const DOT_COLORS = ["#C9C3F4", "#B9DDF4", "#F3C7DD", "#F7D0B5"];
const DOT_SIZES = [6, 8, 10, 12];

export function ProgressDots({ current }: { current: number }) {
  return (
    <div className={styles.dots} role="img" aria-label={`Card ${current + 1} of ${CARD_COUNT}`}>
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <span
          key={i}
          className={[styles.dot, i === current ? styles.dotCurrent : ""].filter(Boolean).join(" ")}
          style={{
            width: DOT_SIZES[i],
            height: DOT_SIZES[i],
            background: DOT_COLORS[i],
            opacity: i <= current ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
