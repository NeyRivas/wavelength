import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#181820";
const LAVENDER = "#c9c3f4";

/**
 * Apple/iOS home-screen touch icon — same ring-and-dot brand mark as
 * app/icon.tsx (components/landing/logo-mark.tsx), just larger (180x180,
 * Apple's recommended touch-icon size) and on a solid white backing
 * instead of transparent, since iOS renders touch icons on the home
 * screen without the surrounding page context a browser tab has.
 */
export default function AppleIcon() {
  const stroke = Math.round(size.width * (2 / 24));
  const dot = Math.round(size.width * (6.5 / 24));

  return new ImageResponse(
    <div
      style={{
        width: size.width,
        height: size.height,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: size.width - stroke * 4,
          height: size.height - stroke * 4,
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
      </div>
    </div>,
    { ...size },
  );
}
