/**
 * Motion reels: builds a self-animating 1080×1920 HTML page for an animated
 * reel (CSS keyframes only) and captures it frame by frame into an MP4.
 *
 * Three styles, chosen by the post's `motion` field in calendar.mjs:
 *   intro — kinetic statements, word by word (the pinned brand intro)
 *   chat  — hook → question → two people "type" their answers → SAME / -ISH stamp
 *   rapid — "this or that": one dilemma every STEP seconds with a draining timer
 *
 * Capture is deterministic: every animation is paused and seeked to each
 * frame's timestamp, so the video never depends on how fast the browser runs.
 * Ink theme only (reels own the ink look in the grid).
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const FPS = 30;
const LAV = "#c9c3f4";
const INK = "#181820";
const SNOW = "#f4f2fd";
const PAPER = "#f7f6f2";

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/** Words that pop in one after another; `*word*` segments render as the italic accent. */
function words(text, start, step) {
  let i = 0;
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) => {
      const accent = part.startsWith("*");
      const spans = part
        .replace(/\*/g, "")
        .trim()
        .split(/\s+/)
        .map(
          (w) =>
            `<span class="w" style="animation-delay:${(start + i++ * step).toFixed(2)}s">${esc(w)}</span>`,
        )
        .join(" ");
      return accent ? `<em>${spans}</em>` : spans;
    })
    .join(" ");
}

function shell(fonts, duration, css, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fraunces;src:url(data:font/woff2;base64,${fonts.fraunces}) format("woff2");font-weight:100 900}
@font-face{font-family:Fraunces;src:url(data:font/woff2;base64,${fonts.frauncesItalic}) format("woff2");font-weight:100 900;font-style:italic}
@font-face{font-family:Nunito;src:url(data:font/woff2;base64,${fonts.nunito}) format("woff2");font-weight:200 1000}
*{box-sizing:border-box;margin:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:${INK};color:${SNOW};font-family:Nunito}
.brand{position:absolute;left:90px;top:300px;display:flex;align-items:center;gap:14px;font-family:Fraunces;font-weight:600;font-size:40px}
.brand svg{width:46px;height:46px}
.bar{position:absolute;left:90px;right:90px;top:250px;height:6px;border-radius:3px;background:rgba(244,242,253,.12);overflow:hidden}
.bar i{display:block;height:100%;background:${LAV};transform-origin:left;transform:scaleX(0);animation:grow ${duration}s linear forwards}
@keyframes grow{to{transform:scaleX(1)}}
em{font-style:italic;font-weight:500;color:${LAV}}
.w{display:inline-block;opacity:0;transform:translateY(40px) scale(.9);animation:pop .3s cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes pop{to{opacity:1;transform:none}}
@keyframes fadein{to{opacity:1}}
@keyframes leave{to{opacity:0;transform:scale(1.06)}}
.display{font-family:Fraunces;font-weight:600;line-height:1.02;letter-spacing:-.02em}
.kicker{font-weight:800;font-size:28px;letter-spacing:.16em;text-transform:uppercase;opacity:0;animation:pop .3s forwards;color:${LAV}}
.end{position:absolute;left:90px;right:90px;display:flex;flex-direction:column;gap:30px}
.end p{font-size:44px;font-weight:800;opacity:0;animation:pop .35s forwards}
.cta{align-self:flex-start;background:${LAV};color:${INK};font-weight:800;font-size:38px;padding:26px 44px;border-radius:999px;opacity:0;animation:pop .35s forwards}
${css}
</style></head><body>
<div class="bar"><i></i></div>
<div class="brand"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="${LAV}" stroke-width="2.25"/><circle cx="12" cy="12" r="3.75" fill="${SNOW}"/></svg>Sameeeish</div>
${body}
</body></html>`;
}

// ── intro ─────────────────────────────────────────────────────────────────
function intro(p, fonts) {
  const SEG = 2.3;
  const last = p.frames.length - 1;
  const duration = last * SEG + 3.6;
  const segs = p.frames
    .map((f, i) => {
      const s = i * SEG;
      const exit =
        i < last ? `animation:leave .25s ease-in ${(s + SEG - 0.25).toFixed(2)}s forwards;` : "";
      const n = f.text.replace(/\*/g, "").split(/\s+/).length;
      const cta =
        i === last
          ? `<span class="cta" style="animation-delay:${(s + 0.25 + n * 0.12 + 0.3).toFixed(2)}s">Play free → link in bio</span>`
          : "";
      return `<section class="seg" style="${exit}">
  <span class="kicker" style="animation-delay:${s.toFixed(2)}s">${esc(f.kicker)}</span>
  <div class="display">${f.text
    .split("\n")
    .map((line, li, all) => {
      const before = all
        .slice(0, li)
        .join(" ")
        .replace(/\*/g, "")
        .split(/\s+/)
        .filter(Boolean).length;
      return words(line, s + 0.18 + before * 0.12, 0.12);
    })
    .join("<br>")}</div>
  ${cta}
</section>`;
    })
    .join("");
  const css = `.seg{position:absolute;left:90px;right:90px;top:560px;display:flex;flex-direction:column;gap:40px}
.seg .display{font-size:140px}`;
  return { duration, html: shell(fonts, duration, css, segs) };
}

// ── chat reveal ───────────────────────────────────────────────────────────
function chat(p, fonts) {
  const T = { q: 2.2, a: 5.1, aType: 6.2, b: 6.7, bType: 8.1, stamp: 9.2, end: 10.2 };
  const duration = 13;
  const hookWords = p.hook.replace(/\*/g, "").split(/\s+/).length;
  const css = `
.hook{position:absolute;left:90px;right:90px;top:620px;font-size:146px;animation:leave .3s ease-in ${T.q - 0.35}s forwards}
.dim{position:absolute;inset:0;animation:dim .4s ease ${T.stamp - 0.2}s forwards}
@keyframes dim{to{opacity:.14;filter:blur(3px)}}
.q{position:absolute;left:90px;right:90px;top:430px}
.pill{display:inline-block;font-weight:800;font-size:24px;letter-spacing:.16em;text-transform:uppercase;background:rgba(201,195,244,.14);
  padding:12px 26px;border-radius:999px;margin-bottom:36px;opacity:0;animation:pop .3s ${T.q}s forwards}
.qt{font-family:Fraunces;font-weight:500;font-size:${p.question.length > 80 ? 70 : 84}px;line-height:1.12}
.chat{position:absolute;left:90px;right:90px;top:${p.question.length > 80 ? 920 : 860}px;display:flex;flex-direction:column;gap:34px}
.row{display:flex;flex-direction:column;gap:12px;opacity:0;animation:pop .35s forwards}
.row.b{align-items:flex-end}
.name{font-weight:800;font-size:26px;letter-spacing:.14em;text-transform:uppercase;opacity:.6}
.bubble{font-size:50px;font-weight:700;line-height:1.25;padding:30px 40px;border-radius:44px;max-width:840px;color:${INK}}
.a .bubble{background:${SNOW};border-bottom-left-radius:12px}
.b .bubble{background:${LAV};border-bottom-right-radius:12px}
.cell{display:grid}.dots,.txt{grid-area:1/1}
.dots{display:flex;gap:14px;padding:12px 4px;animation:hide .01s forwards}
.dots i{width:22px;height:22px;border-radius:50%;background:${INK};opacity:.35;animation:blink .9s infinite}
.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes blink{0%,100%{opacity:.25;transform:none}40%{opacity:.8;transform:translateY(-8px)}}
@keyframes hide{to{opacity:0;visibility:hidden}}
.txt{opacity:0;animation:fadein .01s forwards}
.stamp{position:absolute;left:50%;top:960px;font-family:Fraunces;font-style:italic;font-weight:600;font-size:${p.verdict.length > 4 ? 280 : 340}px;color:${LAV};
  transform:translate(-50%,-50%) scale(3) rotate(-14deg);opacity:0;animation:stamp .38s cubic-bezier(.3,1.6,.5,1) ${T.stamp}s forwards;white-space:nowrap}
@keyframes stamp{to{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-8deg)}}
.flash{position:absolute;inset:0;background:${LAV};opacity:0;animation:flash .45s ${T.stamp}s forwards}
@keyframes flash{0%{opacity:0}15%{opacity:.35}100%{opacity:0}}
body{animation:shake .35s ${T.stamp + 0.25}s}
@keyframes shake{20%{transform:translate(-14px,8px)}40%{transform:translate(12px,-10px)}60%{transform:translate(-8px,6px)}80%{transform:translate(6px,-4px)}}
.end{bottom:420px}`;
  const bubble = (side, who, at, typeAt) =>
    `<div class="row ${side}" style="animation-delay:${at}s"><span class="name">${esc(who.name)}</span>
<div class="bubble"><div class="cell"><div class="dots" style="animation-delay:${typeAt}s"><i></i><i></i><i></i></div><div class="txt" style="animation-delay:${typeAt}s">${esc(who.text)}</div></div></div></div>`;
  const body = `<div class="hook display">${words(p.hook, 0, 0.28 * Math.min(1, 4 / hookWords))}</div>
<div class="dim">
  <div class="q"><span class="pill">${esc(p.mood)}</span><div class="qt">${words(p.question, T.q + 0.1, 0.13)}</div></div>
  <div class="chat">${bubble("a", p.a, T.a, T.aType)}${bubble("b", p.b, T.b, T.bType)}</div>
</div>
<div class="flash"></div>
<div class="stamp">${esc(p.verdict)}</div>
<div class="end"><p style="animation-delay:${T.end}s">${esc(p.endLine ?? "Same… or -ish? Comment yours 👇")}</p><span class="cta" style="animation-delay:${T.end + 0.35}s">Play free → link in bio</span></div>`;
  return { duration, html: shell(fonts, duration, css, body) };
}

// ── rapid fire ────────────────────────────────────────────────────────────
function rapid(p, fonts) {
  const HOOK = 1.6;
  const STEP = p.step ?? 1.25;
  const END = HOOK + p.items.length * STEP;
  const duration = END + 3.2;
  const css = `
.hook{position:absolute;left:90px;right:90px;top:620px;animation:leave .25s ease-in ${HOOK - 0.25}s forwards}
.hook .display{font-size:156px}
.hook p{margin-top:40px;font-weight:800;font-size:46px;opacity:.75}
.item{position:absolute;left:90px;right:90px;top:420px;bottom:420px;display:flex;flex-direction:column;gap:22px;opacity:0;animation:life ${STEP}s linear both}
@keyframes life{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.meta{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;min-height:110px}
.label{font-family:Fraunces;font-style:italic;font-weight:500;font-size:56px;line-height:1.1;color:${LAV};max-width:780px}
.count{font-weight:800;font-size:30px;opacity:.55;font-variant-numeric:tabular-nums}
.opt{flex:1;display:grid;place-items:center;text-align:center;border-radius:48px;font-family:Fraunces;font-weight:600;line-height:1;letter-spacing:-.02em;padding:0 40px;color:${INK}}
.opt.a{background:${PAPER};animation:inL .28s cubic-bezier(.2,1.2,.4,1) both}
.opt.b{background:${LAV};animation:inR .28s cubic-bezier(.2,1.2,.4,1) both}
@keyframes inL{from{transform:translateX(-120px) rotate(-3deg);opacity:0}to{transform:none;opacity:1}}
@keyframes inR{from{transform:translateX(120px) rotate(3deg);opacity:0}to{transform:none;opacity:1}}
.or{align-self:center;margin:-62px 0;z-index:2;width:110px;height:110px;border-radius:50%;background:${INK};display:grid;place-items:center;
  font-family:Fraunces;font-style:italic;font-size:46px;animation:spin .35s cubic-bezier(.2,1.6,.4,1) both}
@keyframes spin{from{transform:scale(0) rotate(-90deg)}to{transform:none}}
.timer{height:12px;border-radius:6px;background:rgba(244,242,253,.12);overflow:hidden}
.timer i{display:block;height:100%;background:${SNOW};transform-origin:left;animation:drain ${STEP}s linear both}
@keyframes drain{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.end{top:600px}.end .display{font-size:132px}`;
  const size = (s) => (s.length > 13 ? 92 : 118);
  const items = p.items
    .map(([label, a, b], i) => {
      const s = (HOOK + i * STEP).toFixed(2);
      const d = `style="animation-delay:${s}s"`;
      return `<section class="item" ${d}>
  <div class="meta"><span class="label">${esc(label)}</span><span class="count">${i + 1}/${p.items.length}</span></div>
  <div class="opt a" style="animation-delay:${s}s;font-size:${size(a)}px">${esc(a)}</div>
  <div class="or" ${d}>or</div>
  <div class="opt b" style="animation-delay:${s}s;font-size:${size(b)}px">${esc(b)}</div>
  <div class="timer"><i ${d}></i></div>
</section>`;
    })
    .join("");
  const body = `<div class="hook"><div class="display">${words(p.hookTitle, 0, 0.22)}</div><p>${words(p.hookSub ?? "Don't think. Just pick.", 0.75, 0.12)}</p></div>
${items}
<div class="end"><div class="display">${words(p.endTitle ?? "How many did *you match?*", END, 0.1)}</div>
<p style="animation-delay:${(END + 0.9).toFixed(2)}s">${esc(p.endLine ?? "Send this to your person and compare 👀")}</p>
<span class="cta" style="animation-delay:${(END + 1.3).toFixed(2)}s">Play the full game → link in bio</span></div>`;
  return { duration, html: shell(fonts, duration, css, body) };
}

const STYLES = { intro, chat, rapid };

/** Renders the post's motion reel to `file` (H.264, 30 fps, silent). */
export async function renderMotion(page, p, fonts, file, tmpDir) {
  const { html, duration } = STYLES[p.motion](p, fonts);
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const total = Math.round(duration * FPS);
  for (let f = 0; f < total; f++) {
    await page.evaluate(
      (t) => {
        for (const a of document.getAnimations()) {
          a.pause();
          a.currentTime = t;
        }
      },
      (f / FPS) * 1000,
    );
    await page.screenshot({
      path: join(tmpDir, `${String(f).padStart(4, "0")}.jpg`),
      type: "jpeg",
      quality: 92,
    });
  }
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-framerate",
    String(FPS),
    "-i",
    join(tmpDir, "%04d.jpg"),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-movflags",
    "+faststart",
    file,
  ]);
  rmSync(tmpDir, { recursive: true, force: true });
}
