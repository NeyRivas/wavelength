import { ImageResponse } from "next/og";

import {
  BRAND,
  grainDataUri,
  loadDarkShareImageFonts,
  logoMarkDataUri,
  rgba,
  SHARE_IMAGE_SIZE,
} from "@/lib/seo/share-image";

// The X/Twitter-specific card image — separate from the lighter,
// glass-card app/opengraph-image.tsx that every other network reads.
// X's own product chrome is overwhelmingly dark, so the user chose this
// design to match it: the same ink background and soft dark glows as
// the site's own dark closing CTA (.landing-dark-cta, app/globals.css)
// rather than reusing the light design against a dark app shell.
export const alt = "Sameeeish — are you really on the same page? A playful question game for two.";
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const fonts = await loadDarkShareImageFonts();
  const logoSrc = logoMarkDataUri("#ffffff");
  const grainSrc = grainDataUri(size.width, size.height);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: BRAND.ink,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -140,
          left: -160,
          width: 560,
          height: 560,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${rgba("#38384a", 0.9)} 0%, ${rgba("#38384a", 0)} 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 30,
          right: 30,
          width: 420,
          height: 420,
          borderRadius: 9999,
          background: `radial-gradient(circle at 35% 35%, ${rgba(BRAND.lavender, 0.35)} 0%, ${rgba(BRAND.lavender, 0)} 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -170,
          right: -100,
          width: 520,
          height: 520,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${rgba("#3a2e35", 0.95)} 0%, ${rgba("#3a2e35", 0)} 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -110,
          left: "9%",
          width: 360,
          height: 360,
          borderRadius: 9999,
          background: `radial-gradient(circle at 60% 40%, ${rgba(BRAND.pink, 0.3)} 0%, ${rgba(BRAND.pink, 0)} 65%)`,
        }}
      />
      <img
        src={grainSrc}
        alt=""
        width={size.width}
        height={size.height}
        style={{ position: "absolute", inset: 0, opacity: 0.045 }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 90px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <img src={logoSrc} alt="" width={40} height={40} />
          <span
            style={{
              fontFamily: "Nunito Sans",
              fontWeight: 700,
              fontSize: 19,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            SAMEEEISH
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Fraunces",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 64,
            lineHeight: 1.18,
            color: "#ffffff",
            marginBottom: 26,
          }}
        >
          <span>Are you really</span>
          <span>on the same page?</span>
        </div>
        <div
          style={{
            width: 56,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${BRAND.lavender}, ${BRAND.blue})`,
            marginBottom: 26,
            display: "flex",
          }}
        />
        <span
          style={{
            fontFamily: "Nunito Sans",
            fontWeight: 600,
            fontSize: 21,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.55)",
            maxWidth: 620,
          }}
        >
          A playful question game for two. Answer apart, compare together.
        </span>
      </div>
    </div>,
    { ...size, fonts },
  );
}
