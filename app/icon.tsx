import { ImageResponse } from "next/og";

export const contentType = "image/png";

const INK = "#181820";
const LAVENDER = "#c9c3f4";

/**
 * Browser tab favicon. A `<link rel="icon">` needs an actual image file,
 * not a component, so this rasterizes the exact same ring-and-dot brand
 * mark already used inline everywhere else (components/landing/logo-mark.tsx
 * — lavender ring, dark ink center dot, no wordmark) at favicon sizes,
 * rather than inventing a new mark. generateImageMetadata emits both a
 * 16x16 and a 32x32 version so the tab icon stays crisp at the small
 * sizes browsers actually render it at.
 */
export function generateImageMetadata() {
  return [
    { id: "16", size: { width: 16, height: 16 } },
    { id: "32", size: { width: 32, height: 32 } },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  const stroke = Math.max(1, Math.round(size * (2 / 24)));
  const dot = Math.round(size * (6.5 / 24));

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        boxSizing: "border-box",
        border: `${stroke}px solid ${LAVENDER}`,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: INK,
        }}
      />
    </div>,
    { width: size, height: size },
  );
}
