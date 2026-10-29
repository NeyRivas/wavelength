/**
 * Renders every entry in calendar.mjs into ready-to-upload files under out/:
 *   post      → out/NN-post.png                       (1080×1350)
 *   carousel  → out/NN-carousel/01.png … NN.png       (1080×1350)
 *   reel      → out/NN-reel-cover.png                 (1080×1920)
 *               + out/NN-reel.mp4 for kind "animated" (motion.mjs; silent, add audio in IG)
 *
 * Usage:  node render.mjs            (everything)
 *         node render.mjs 4 11 12    (only those post numbers)
 *
 * Look: minimal — one flat background per format (THEME_BY_FORMAT), ink
 * type, lavender as the only accent.
 *
 * Needs Playwright (Chromium) and ffmpeg. Fonts are the site's own
 * (Fraunces + Nunito), embedded from fonts/ so rendering works offline.
 */

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { POSTS } from "./calendar.mjs";
import { chatplusCover, introCover, renderMotion } from "./motion.mjs";

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try {
    return require("playwright");
  } catch {
    const globalRoot = execFileSync("npm", ["root", "-g"]).toString().trim();
    return require(join(globalRoot, "playwright"));
  }
})();

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const font = (f) => readFileSync(join(HERE, "fonts", f)).toString("base64");

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
/** `*word*` → italic accent; `\n` → line break. */
const rich = (s) =>
  esc(s)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");

/** Font size that keeps a question inside its panel, by length. */
function qSize(text, tall) {
  const n = text.length;
  const base = n < 55 ? 96 : n < 80 ? 84 : n < 105 ? 74 : 64;
  return tall ? base + 8 : base;
}

const LOGO = `<svg viewBox="0 0 24 24" fill="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#9d93e8"/><stop offset="100%" stop-color="#7fbde6"/></linearGradient></defs>
<circle cx="12" cy="12" r="9" stroke="url(#g)" stroke-width="2.25"/><circle cx="12" cy="12" r="3.75" fill="currentColor"/></svg>`;

/** Visual direction: one flat background, ink text, lavender as the only accent. */
const THEMES = {
  solid: {
    bg: "#c9c3f4",
    fg: "#181820",
    accent: "#181820",
    pill: "rgba(255,255,255,.55)",
    line: "rgba(24,24,32,.18)",
    btn: "#181820",
    btnFg: "#fff",
  },
  ink: {
    bg: "#181820",
    fg: "#f4f2fd",
    accent: "#c9c3f4",
    pill: "rgba(201,195,244,.14)",
    line: "rgba(244,242,253,.16)",
    btn: "#c9c3f4",
    btnFg: "#181820",
  },
  paper: {
    bg: "#f7f6f2",
    fg: "#181820",
    accent: "#7d70d8",
    pill: "#c9c3f4",
    line: "rgba(24,24,32,.12)",
    btn: "#181820",
    btnFg: "#fff",
  },
};
/** Each format owns one theme so the grid reads as a system, not a mix:
 * carousels on paper, reels on ink, single posts on lavender. STYLE=… forces one. */
const THEME_BY_FORMAT = { carousel: "paper", reel: "ink", post: "solid" };

function page({ w, h, tint, body, footer = "", counter = "" }) {
  const t = THEMES[tint] ?? THEMES.paper;
  const tall = h > w * 1.5;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fraunces;src:url(data:font/woff2;base64,${FRAUNCES}) format("woff2");font-weight:100 900;font-style:normal}
@font-face{font-family:Fraunces;src:url(data:font/woff2;base64,${FRAUNCES_I}) format("woff2");font-weight:100 900;font-style:italic}
@font-face{font-family:Nunito;src:url(data:font/woff2;base64,${NUNITO}) format("woff2");font-weight:200 1000}
*{box-sizing:border-box;margin:0}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:Nunito,sans-serif;color:${t.fg};background:${t.bg};position:relative;
  display:flex;flex-direction:column;padding:${tall ? "300px 90px 420px" : "80px 84px 76px"}}
header{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px;font-family:Fraunces;font-weight:600;font-size:40px;letter-spacing:-.01em}
.brand svg{width:46px;height:46px}
.pill{font-weight:800;font-size:22px;letter-spacing:.16em;text-transform:uppercase;background:${t.pill};color:${t.fg};
  border:0;padding:12px 26px;border-radius:999px}
main{flex:1;display:flex;flex-direction:column;justify-content:center;max-width:none;padding:0;margin:0}
.panel{padding:0}
.q{font-family:Fraunces;font-weight:500;line-height:1.14;letter-spacing:-.005em;font-variation-settings:"opsz" 72}
.num{font-family:Fraunces;font-style:italic;font-weight:400;font-size:64px;color:${t.accent};margin-bottom:22px}
.kicker{font-weight:800;font-size:28px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:34px;opacity:.75}
.title{font-family:Fraunces;font-weight:600;line-height:1.06;letter-spacing:-.015em;font-variation-settings:"opsz" 96}
em{font-style:italic;font-weight:500;color:${t.accent}}
.steps{display:flex;flex-direction:column;gap:30px}
.step{display:flex;gap:30px;align-items:flex-start}
.step b{flex:none;width:78px;height:78px;border-radius:50%;background:${t.btn};color:${t.btnFg};display:grid;place-items:center;
  font-family:Fraunces;font-size:40px;font-weight:600}
.step h3{font-family:Fraunces;font-weight:600;font-size:46px;line-height:1.15;margin-bottom:6px}
.step p{font-size:30px;line-height:1.4;opacity:.8}
.cta-btn{display:inline-block;margin-top:46px;background:${t.btn};color:${t.btnFg};font-weight:800;font-size:34px;padding:26px 44px;border-radius:999px}
.small{font-size:30px;font-weight:700;opacity:.75;margin-top:28px;line-height:1.4}
footer{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:28px;margin-top:40px;padding-top:30px;border-top:2px solid ${t.line}}
footer:empty{border:0}
.count{font-weight:700;opacity:.6}
</style></head><body>
<header><div class="brand">${LOGO}Sameeeish</div>${counter}</header>
<main>${body}</main>
<footer>${footer}</footer>
</body></html>`;
}

const FRAUNCES = font("fraunces.woff2");
const FRAUNCES_I = font("fraunces-italic.woff2");
const NUNITO = font("nunito.woff2");

const FEED = { w: 1080, h: 1350 };
const STORY = { w: 1080, h: 1920 };
const pill = (s) => (s ? `<span class="pill">${esc(s)}</span>` : "");

// ── Slide builders ────────────────────────────────────────────────────────
const questionSlide = (size, tint, mood, q, footer, num) =>
  page({
    ...size,
    tint,
    counter: pill(mood),
    body: `<div class="panel">${num ? `<div class="num">${num}</div>` : ""}<div class="q" style="font-size:${qSize(q, size.h > 1500)}px">${rich(q)}</div></div>`,
    footer,
  });

const coverSlide = (size, tint, mood, kicker, title, footer) =>
  page({
    ...size,
    tint,
    counter: pill(mood),
    body: `<div class="kicker">${esc(kicker)}</div><div class="title" style="font-size:${title.length > 40 ? 112 : 128}px">${rich(title)}</div>`,
    footer,
  });

const stepsSlide = (size, tint, mood, heading, steps, footer) =>
  page({
    ...size,
    tint,
    counter: pill(mood),
    body: `<div class="title" style="font-size:72px;margin-bottom:56px">${rich(heading)}</div><div class="steps">${steps
      .map(
        (s, i) =>
          `<div class="step"><b>${i + 1}</b><div><h3>${esc(s.h)}</h3><p>${esc(s.b)}</p></div></div>`,
      )
      .join("")}</div>`,
    footer,
  });

const ctaSlide = (size, tint) =>
  page({
    ...size,
    tint,
    body: `<div class="kicker">Your turn</div><div class="title" style="font-size:104px">Play it <em>together.</em></div>
<div class="small" style="font-size:36px">Answer separately. See where you're the same — and where you're -ish.</div>
<div><span class="cta-btn">Link in bio → sameeeish.com</span></div>
<div class="small">Free · 2 players · No sign up</div>`,
    footer: `<span>Save this 🔖</span><span>Send it to your person →</span>`,
  });

const swipe = (i, total) => `<span>Swipe →</span><span class="count">${i}/${total}</span>`;
const send = `<span>Send this to your person →</span><span class="count">sameeeish.com</span>`;

function slidesFor(p) {
  if (p.format === "post") {
    if (p.statement)
      return [
        coverSlide(
          FEED,
          p.tint,
          null,
          p.statement.kicker,
          p.statement.text,
          `<span>sameeeish.com</span><span class="count">Link in bio</span>`,
        ),
      ];
    return [questionSlide(FEED, p.tint, p.mood, p.question, send)];
  }
  if (p.format === "carousel") {
    const steps = p.steps ? 1 : 0;
    const items = p.items ?? [];
    const total = 1 + steps + items.length + 1;
    const out = [coverSlide(FEED, p.tint, p.mood, p.cover.kicker, p.cover.title, swipe(1, total))];
    if (p.steps)
      out.push(
        stepsSlide(
          FEED,
          p.tint,
          p.mood,
          p.items ? "How to play it" : "Four steps. That's it.",
          p.steps,
          swipe(2, total),
        ),
      );
    items.forEach((it, i) => {
      const q = typeof it === "string" ? it : it.q;
      const mood = typeof it === "string" ? p.mood : it.mood;
      out.push(
        questionSlide(
          FEED,
          p.tint,
          mood,
          q,
          swipe(out.length + 1, total),
          String(i + 1).padStart(2, "0"),
        ),
      );
    });
    out.push(ctaSlide(FEED, p.tint));
    return out;
  }
  return [];
}

const reelCover = (p) => {
  if (p.kind === "filmed")
    return coverSlide(
      STORY,
      p.tint,
      p.pillar === "We played it" ? "We played it" : null,
      "Watch till the end",
      p.cover,
      "",
    );
  if (p.motion === "rapid") return coverSlide(STORY, p.tint, p.mood, "Rapid fire", p.cover, "");
  // Reuses the lavender question-post look for a reel that replaced a post.
  if (p.coverStyle === "post") return questionSlide(STORY, "solid", p.mood, p.question, send);
  if (p.motion === "chatplus")
    return chatplusCover(p, { fraunces: FRAUNCES, frauncesItalic: FRAUNCES_I, nunito: NUNITO });
  if (p.motion === "howto")
    return coverSlide(STORY, p.tint, null, "In 15 seconds", "How to play *Sameeeish*", "");
  if (p.motion === "intro")
    return introCover(p, { fraunces: FRAUNCES, frauncesItalic: FRAUNCES_I, nunito: NUNITO });
  return questionSlide(
    STORY,
    p.tint,
    p.mood,
    p.question,
    `<span>Send this to your person →</span>`,
  );
};

// ── Render ────────────────────────────────────────────────────────────────
const only = process.argv.slice(2).map(Number);
const todo = only.length ? POSTS.filter((p) => only.includes(p.n)) : POSTS;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const pg = await ctx.newPage();

async function shot(html, size, file) {
  await pg.setViewportSize({ width: size.w, height: size.h });
  await pg.setContent(html, { waitUntil: "load" });
  await pg.evaluate(() => document.fonts.ready);
  // Shrink any question/title that still overflows its column.
  await pg.evaluate(() => {
    const main = document.querySelector("main");
    for (const el of document.querySelectorAll(".q,.title")) {
      let fs = parseFloat(getComputedStyle(el).fontSize);
      while (
        (main.scrollHeight > main.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) &&
        fs > 40
      ) {
        fs -= 2;
        el.style.fontSize = fs + "px";
      }
    }
  });
  await pg.screenshot({ path: file, type: "png" });
}

for (const p of todo) {
  p.tint = process.env.STYLE ?? THEME_BY_FORMAT[p.format];
  const nn = String(p.n).padStart(2, "0");
  if (p.format === "post") {
    await shot(slidesFor(p)[0], FEED, join(OUT, `${nn}-post.png`));
  } else if (p.format === "carousel") {
    const dir = join(OUT, `${nn}-carousel`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const slides = slidesFor(p);
    for (let i = 0; i < slides.length; i++)
      await shot(slides[i], FEED, join(dir, `${String(i + 1).padStart(2, "0")}.png`));
  } else {
    await shot(reelCover(p), STORY, join(OUT, `${nn}-reel-cover.png`));
    if (p.kind === "animated")
      await renderMotion(
        pg,
        p,
        { fraunces: FRAUNCES, frauncesItalic: FRAUNCES_I, nunito: NUNITO },
        join(OUT, `${nn}-reel.mp4`),
        join(OUT, `.tmp-${nn}`),
      );
    // A still from the finished video makes the best cover for some reels.
    if (p.kind === "animated" && p.coverFrame != null)
      execFileSync("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-ss",
        String(p.coverFrame),
        "-i",
        join(OUT, `${nn}-reel.mp4`),
        "-frames:v",
        "1",
        join(OUT, `${nn}-reel-cover.png`),
      ]);
  }
  console.log(`✓ ${nn} ${p.format}${p.kind ? `/${p.kind}` : ""}`);
}
await browser.close();
