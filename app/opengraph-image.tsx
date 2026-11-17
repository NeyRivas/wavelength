import { ImageResponse } from "next/og";

import {
  BRAND,
  grainDataUri,
  loadLightShareImageFonts,
  logoMarkDataUri,
  rgba,
  SHARE_IMAGE_SIZE,
} from "@/lib/seo/share-image";

// The site-wide Open Graph share image — Facebook, LinkedIn, iMessage,
// WhatsApp, Slack, and anything else that reads `og:image` rather than
// the X/Twitter-specific card (app/twitter-image.tsx's dark design).
// Lives at the app root, so it's the default image for every route that
// doesn't define its own opengraph-image (none currently do) per
// Next.js's file-convention metadata resolution. User-approved design:
// a frosted "glass" card over a soft four-corner pastel mesh, echoing
// the home page's own ambient-blob treatment (app/globals.css) rather
// than a flat gradient or a literal screenshot of the product.
export const alt = "Sameeeish — a playful question game for two. See if you're on the same page.";
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const fonts = await loadLightShareImageFonts();
  const logoSrc = logoMarkDataUri(BRAND.ink);
  const grainSrc = grainDataUri(size.width, size.height);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: "#fbfaf8",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -160,
          left: -180,
          width: 640,
          height: 640,
          borderRadius: 9999,
          background: `radial-gradient(circle at 42% 42%, ${rgba(BRAND.lavender, 0.8)} 0%, ${rgba(BRAND.lavender, 0)} 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -140,
          width: 520,
          height: 520,
          borderRadius: 9999,
          background: `radial-gradient(circle at 58% 42%, ${rgba(BRAND.peach, 0.6)} 0%, ${rgba(BRAND.peach, 0)} 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          right: -120,
          width: 640,
          height: 640,
          borderRadius: 9999,
          background: `radial-gradient(circle at 58% 58%, ${rgba(BRAND.mint, 0.75)} 0%, ${rgba(BRAND.mint, 0)} 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -180,
          left: -100,
          width: 480,
          height: 480,
          borderRadius: 9999,
          background: `radial-gradient(circle at 42% 58%, ${rgba(BRAND.pink, 0.55)} 0%, ${rgba(BRAND.pink, 0)} 70%)`,
        }}
      />
      <img
        src={grainSrc}
        alt=""
        width={size.width}
        height={size.height}
        style={{ position: "absolute", inset: 0, opacity: 0.015 }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 900,
            padding: "64px 76px",
            borderRadius: 32,
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 40px 80px -28px rgba(24,24,32,0.22)",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <img src={logoSrc} alt="" width={34} height={34} />
            <span
              style={{
                fontFamily: "Nunito Sans",
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: 2,
                color: BRAND.ink,
                opacity: 0.55,
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
              fontSize: 58,
              lineHeight: 1.16,
              color: BRAND.ink,
              marginBottom: 22,
            }}
          >
            <span>See if you&apos;re</span>
            <span>on the same page.</span>
          </div>
          <span
            style={{
              fontFamily: "Nunito Sans",
              fontWeight: 600,
              fontSize: 21,
              lineHeight: 1.5,
              color: "#5c6773",
              maxWidth: 640,
            }}
          >
            A question game for two — couples, friends, or anyone curious. Free, no sign-up.
          </span>
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
