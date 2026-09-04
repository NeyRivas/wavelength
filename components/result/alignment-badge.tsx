import type { AlignmentLevel } from "@/lib/scoring/score";

const CLASS_BY_LEVEL: Record<AlignmentLevel, string> = {
  "High Alignment": "badge--high",
  "Mixed Alignment": "badge--mixed",
  "Low Alignment": "badge--low",
};

export function AlignmentBadge({ level }: { level: AlignmentLevel }) {
  return <span className={`badge ${CLASS_BY_LEVEL[level]}`}>{level}</span>;
}
