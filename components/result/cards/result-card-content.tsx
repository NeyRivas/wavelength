import type { ResultCardsData } from "@/lib/wavelength/result-cards";

import { OffsetWave, SyncedWave } from "./wave-motifs";
import styles from "./result-cards.module.css";

/**
 * The four card layouts, ported from the approved app/proto-result-cards
 * prototype with one change: every string that was hardcoded demo data
 * there (names, score, category words/chips) is now a prop driven by the
 * real `ResultCardsData` (lib/wavelength/result-cards.ts). Every other
 * piece of copy, every class name, and the overall composition is frozen
 * exactly as approved — this file must not introduce new visual design,
 * only wire in real data.
 */

// Decorative only (chip dot color) — cycled by position, not tied to a
// specific category identity, since ResultCardsData only carries the
// already-resolved display labels (see lib/wavelength/result-cards.ts).
const CHIP_COLORS = ["#F7D0B5", "#F3C7DD", "#B9DDF4", "#C5E8DD", "#C9C3F4"];

function namesLine(aliasA: string, aliasB: string): string {
  return `${aliasA.toUpperCase()} + ${aliasB.toUpperCase()}`;
}

export function CardOne({ data }: { data: ResultCardsData }) {
  return (
    <div className={styles.content}>
      <div className={styles.eyebrow}>Your wavelength</div>
      <div className={styles.names}>{namesLine(data.aliasA, data.aliasB)}</div>
      <div className={styles.score}>{data.score}%</div>
      <div className={styles.caption}>On the same wavelength</div>
      <div className={styles.waveLarge}>
        <SyncedWave width={200} height={80} />
      </div>
    </div>
  );
}

export function CardTwo({ data }: { data: ResultCardsData }) {
  return (
    <div className={styles.content}>
      <div className={styles.eyebrow}>You really clicked</div>
      <div className={styles.spotlight}>
        {data.alignedCategories.map((label) => (
          <span key={label} className={styles.spotlightWord}>
            {label}
          </span>
        ))}
      </div>
      <p className={styles.line}>Some things you just don&rsquo;t have to talk about.</p>
      <div className={styles.wave}>
        <SyncedWave width={150} height={60} />
      </div>
    </div>
  );
}

export function CardThree({ data }: { data: ResultCardsData }) {
  const hasDifferences = data.differentCategories.length > 0;
  return (
    <div className={styles.content}>
      <div className={styles.eyebrow}>Different wavelengths</div>
      <div className={styles.diffHeadline}>
        {hasDifferences ? "Different tempos, same song." : "Aligned across the board."}
      </div>
      {hasDifferences ? (
        <>
          <div className={styles.chipRow}>
            {data.differentCategories.map((label, i) => (
              <div key={label} className={styles.chip}>
                <span
                  className={styles.chipDot}
                  style={{ background: CHIP_COLORS[i % CHIP_COLORS.length] }}
                />
                {label}
              </div>
            ))}
          </div>
          <div className={styles.wave}>
            <OffsetWave />
          </div>
        </>
      ) : (
        <>
          <p className={styles.line}>You matched on every category this time.</p>
          <div className={styles.wave}>
            <SyncedWave width={150} height={60} />
          </div>
        </>
      )}
    </div>
  );
}

export function CardFour({ data }: { data: ResultCardsData }) {
  return (
    <div className={styles.content}>
      <div className={styles.shareWordmark}>Wavelength</div>
      <div className={styles.names}>{namesLine(data.aliasA, data.aliasB)}</div>
      <div className={[styles.score, styles.scoreSmall].join(" ")}>{data.score}%</div>
      <div className={styles.caption}>On the same wavelength</div>
      <div className={styles.waveLarge}>
        <SyncedWave width={220} height={88} />
      </div>
      <div className={styles.shareBadge}>wavelength.zone</div>
    </div>
  );
}

export const RESULT_CARDS = [CardOne, CardTwo, CardThree, CardFour];
