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
const CHAR = 0.045; // typewriter speed, seconds per character

/**
 * Typewriter text: one span per character, revealed in order, with a caret
 * riding on the newest character and blinking on the last one until `until`.
 * `*accent*` segments become the italic accent; `\n` breaks the line.
 * Returns the markup and when typing finishes.
 */
function typed(text, start, until, step = CHAR) {
  let t = start;
  const chars = text.replace(/[*\n]/g, "").length;
  let k = 0;
  const html = text
    .split("\n")
    .map((line) =>
      line
        .split(/(\*[^*]+\*)/)
        .filter(Boolean)
        .map((part) => {
          const accent = part.startsWith("*");
          const inner = part
            .replace(/\*/g, "")
            .split(/( )/)
            .map((word) => {
              if (word === " ") {
                k++;
                t += step;
                return " ";
              }
              const letters = [...word]
                .map((ch) => {
                  k++;
                  const d = t.toFixed(3);
                  t += step;
                  const lastChar = k === chars;
                  const caret = lastChar
                    ? `,blink .9s steps(1) ${d}s ${Math.max(1, Math.ceil((until - Number(d)) / 0.9))}`
                    : `,caret ${step}s linear ${d}s`;
                  return `<span class="ch" style="animation:fadein .01s linear ${d}s forwards${caret}">${esc(ch)}</span>`;
                })
                .join("");
              return `<span class="word">${letters}</span>`;
            })
            .join("");
          return accent ? `<em>${inner}</em>` : inner;
        })
        .join(""),
    )
    .join("<br>");
  return { html, end: t };
}

/** The chat-language illustration under each intro statement, keyed by scene index. */
function introVisual(i, s, typedEnd) {
  const at = (x) => `style="animation-delay:${(s + x).toFixed(2)}s"`;
  const dots = (x) =>
    `<span class="dots" style="animation:dotsout .01s linear ${(s + x).toFixed(2)}s forwards"><i></i><i></i><i></i></span>`;
  if (i === 0)
    return `<div class="vis">
  <div class="qcard pop" ${at(0.5)}><span class="ql">Question 1 of 8</span><span class="qq">Beach or mountains?</span></div>
  <div class="people"><span class="who pop" ${at(0.9)}>Ana</span><span class="link pop" ${at(1.05)}></span><span class="who b pop" ${at(1.2)}>Leo</span></div>
</div>`;
  if (i === 1) {
    const reveal = (x) => `style="animation-delay:${(s + x).toFixed(2)}s"`;
    return `<div class="vis">
  <div class="row pop" ${at(0.4)}><span class="name">Ana</span><div class="bubble a"><span class="swap">${dots(1.3)}<span class="hid" ${reveal(1.3)}>Mountains</span></span></div></div>
  <div class="row r pop" ${at(0.8)}><span class="name">Leo</span><div class="bubble b"><span class="swap">${dots(1.8)}<span class="hid" ${reveal(1.8)}>Beach</span></span></div></div>
  <span class="lock pop" ${at(2.1)}>🔒 Hidden until you both answer</span>
</div>`;
  }
  if (i === 2) {
    const t0 = Math.max(1.0, typedEnd - s - 0.9);
    return `<div class="vis">
  <div class="cmp pop" ${at(t0)}><span class="cl">Night in or night out?</span><span class="pair"><b>Night in</b><b class="b">Night in</b></span><span class="tag same stamp" ${at(t0 + 0.35)}>Same</span></div>
  <div class="cmp pop" ${at(t0 + 0.7)}><span class="cl">Beach or mountains?</span><span class="pair"><b>Mountains</b><b class="b">Beach</b></span><span class="tag ish stamp" ${at(t0 + 1.05)}>-ish</span></div>
</div>`;
  }
  return `<div class="vis end-vis">
  <span class="cta big pop" ${at(Math.max(0.6, typedEnd - s + 0.2))}>Play free → link in bio</span>
  <span class="facts pop" ${at(Math.max(0.9, typedEnd - s + 0.5))}>Free · 2 players · No sign up · sameeeish.com</span>
</div>`;
}

const INTRO_CSS = `
.seg{position:absolute;left:90px;right:90px;top:400px;bottom:340px;display:flex;flex-direction:column;gap:34px}
.seg .display{font-size:128px;line-height:1.04}
.word{white-space:nowrap}
.ch{opacity:0}
@keyframes caret{from,to{box-shadow:6px 0 0 ${LAV}}}
@keyframes blink{0%{box-shadow:6px 0 0 ${LAV}}50%{box-shadow:none}}
.vis{margin-block:auto;display:flex;flex-direction:column;gap:30px}
.pop{opacity:0;animation:pop .35s cubic-bezier(.2,1.4,.4,1) forwards}
.qcard{background:${PAPER};color:${INK};border-radius:52px;padding:64px 60px;display:flex;flex-direction:column;gap:12px}
.ql{font-weight:800;font-size:24px;letter-spacing:.16em;text-transform:uppercase;opacity:.5}
.qq{font-family:Fraunces;font-weight:600;font-size:104px;line-height:1.02}
.people{display:flex;align-items:center;gap:18px}
.who{font-weight:800;font-size:44px;padding:22px 44px;border-radius:999px;background:${SNOW};color:${INK}}
.who.b{background:${LAV}}
.link{flex:1;height:4px;border-radius:2px;background:rgba(244,242,253,.25)}
.row{display:flex;flex-direction:column;gap:10px}
.row.r{align-items:flex-end}
.name{font-weight:800;font-size:26px;letter-spacing:.14em;text-transform:uppercase;opacity:.6}
.bubble{font-size:72px;font-weight:700;line-height:1.2;padding:40px 56px;border-radius:52px;color:${INK};min-width:420px}
.bubble.a{background:${SNOW};border-bottom-left-radius:12px}
.bubble.b{background:${LAV};border-bottom-right-radius:12px}
.swap{display:grid}.swap>*{grid-area:1/1}
.dots{display:flex;gap:18px;align-items:center;padding:24px 0}
.dots i{width:28px;height:28px;border-radius:50%;background:${INK};opacity:.35;animation:dotblink .9s infinite}
.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes dotblink{0%,100%{opacity:.25;transform:none}40%{opacity:.8;transform:translateY(-8px)}}
.hid{opacity:0;filter:blur(14px);animation:fadein .01s forwards}
@keyframes dotsout{to{opacity:0}}
.lock{align-self:center;font-weight:800;font-size:38px;margin-top:10px;opacity:0;color:${LAV}}
.cmp{display:grid;grid-template-columns:1fr auto;grid-template-areas:"cl tag" "pair tag";gap:18px 24px;align-items:center;
  background:rgba(244,242,253,.06);border-radius:48px;padding:44px 44px}
.cl{grid-area:cl;font-weight:800;font-size:26px;letter-spacing:.12em;text-transform:uppercase;opacity:.6}
.pair{grid-area:pair;display:flex;gap:14px;flex-wrap:wrap}
.pair b{font-size:50px;font-weight:700;padding:20px 36px;border-radius:999px;background:${SNOW};color:${INK}}
.pair b.b{background:${LAV}}
.tag{grid-area:tag;font-family:Fraunces;font-style:italic;font-weight:600;font-size:116px;color:${LAV};line-height:1}
.stamp{opacity:0;transform:scale(2.4) rotate(-12deg);animation:stampin .35s cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes stampin{to{opacity:1;transform:rotate(-6deg)}}
.end-vis{gap:34px;align-items:flex-start}
.seg.last{justify-content:center}
.seg.last .vis{flex:none;margin:60px 0 0}
.seg.last .display{font-size:140px}
.cta.big{font-size:52px;padding:40px 64px}
.facts{font-weight:800;font-size:36px;opacity:0;color:${LAV}}`;

function intro(p, fonts) {
  const HOLD = [1.6, 1.4, 1.5, 2.8]; // seconds after typing ends, per scene
  const last = p.frames.length - 1;
  let s = 0;
  const scenes = p.frames.map((f, i) => {
    const typeStart = s + 0.2;
    const chars = f.text.replace(/[*\n]/g, "").length;
    const len = 0.2 + chars * CHAR + (HOLD[i] ?? 1.5);
    const scene = { f, i, s, len, typeStart };
    s += len;
    return scene;
  });
  const duration = s;
  const body = scenes
    .map(({ f, i, s, len, typeStart }) => {
      const exit =
        i < last ? `animation:leave .25s ease-in ${(s + len - 0.25).toFixed(2)}s forwards;` : "";
      const { html, end } = typed(f.text, typeStart, s + len);
      return `<section class="seg${i === last ? " last" : ""}" style="${exit}">
  <span class="kicker" style="animation-delay:${s.toFixed(2)}s">${esc(f.kicker)}</span>
  <div class="display">${html}</div>
  ${introVisual(i, s, end)}
</section>`;
    })
    .join("");
  return { duration, html: shell(fonts, duration, INTRO_CSS, body) };
}

/**
 * Still cover for the intro reel (profile grid + reel thumbnail): the
 * opening statement plus the SAME / -ISH comparison, everything at rest.
 * Kept inside the grid's 3:4 centre band.
 */
export function introCover(p, fonts) {
  const f = p.frames[0];
  const text = esc(f.text)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
  const still = `
.bar{display:none}
.pop,.kicker,.stamp{opacity:1!important;animation:none!important}
.pop{transform:none!important}
.stamp{transform:rotate(-6deg)!important}
.brand{top:270px;font-size:46px}.brand svg{width:54px;height:54px}
.seg{top:360px;bottom:300px;justify-content:space-between;gap:36px}
.kicker{font-size:34px}
.seg .display{font-size:184px;line-height:.98;margin-top:-20px}
.vis{margin:0;gap:34px}
.vis{gap:28px}
.cmp{grid-template-areas:"cl tag" "pair pair";padding:40px 46px 46px;gap:10px 24px;border-radius:56px}
.cl{font-size:30px}
.pair{flex-wrap:nowrap}
.pair b{font-size:60px;padding:22px 42px}
.tag{font-size:112px;margin:-24px 0 -10px}`;
  const body = `<section class="seg">
  <span class="kicker">${esc(f.kicker)}</span>
  <div class="display">${text}</div>
  <div class="vis">
    <div class="cmp pop"><span class="cl">Night in or night out?</span><span class="pair"><b>Night in</b><b class="b">Night in</b></span><span class="tag stamp">Same</span></div>
    <div class="cmp pop"><span class="cl">Beach or mountains?</span><span class="pair"><b>Mountains</b><b class="b">Beach</b></span><span class="tag stamp">-ish</span></div>
  </div>
</section>`;
  return shell(fonts, 1, INTRO_CSS + still, body);
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
.dots i{width:28px;height:28px;border-radius:50%;background:${INK};opacity:.35;animation:blink .9s infinite}
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

// ── chat plus ─────────────────────────────────────────────────────────────
// The chat reveal, more dynamic: an optional count-up hook number, the
// question and both answers typed letter by letter, a slow camera push and
// a drifting glow behind everything.
const CHATPLUS_CSS = `
:root{--caret:${LAV}}
.ch{opacity:0}
.word{white-space:nowrap}
@keyframes caret{from,to{box-shadow:5px 0 0 var(--caret)}}
@keyframes blink{0%{box-shadow:5px 0 0 var(--caret)}50%{box-shadow:none}}
.glow{position:absolute;width:900px;height:900px;border-radius:50%;background:${LAV};opacity:.13;filter:blur(140px);top:120px;right:-380px}
.cam{position:absolute;inset:0;transform-origin:50% 45%}
.kick{font-weight:800;font-size:30px;letter-spacing:.16em;text-transform:uppercase;color:${LAV}}
.count{font-family:Fraunces;font-weight:600;font-size:170px;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;color:${LAV}}
.hookline{font-family:Fraunces;font-weight:600;font-size:120px;line-height:1.04}
.pill{align-self:flex-start;display:inline-block;font-weight:800;font-size:26px;letter-spacing:.16em;text-transform:uppercase;background:rgba(201,195,244,.14);padding:12px 26px;border-radius:999px}
.qt{font-family:Fraunces;font-weight:500;line-height:1.1}
.row{display:flex;flex-direction:column;gap:12px}
.row.b{align-items:flex-end}
.name{font-weight:800;font-size:28px;letter-spacing:.14em;text-transform:uppercase;opacity:.6}
.bubble{font-size:62px;font-weight:700;line-height:1.2;padding:36px 48px;border-radius:50px;max-width:880px;color:${INK};--caret:${INK}}
.row.a .bubble{background:${SNOW};border-bottom-left-radius:12px}
.row.b .bubble{background:${LAV};border-bottom-right-radius:12px}
.cell{display:grid}.cell>*{grid-area:1/1}
.dots{display:flex;gap:16px;align-items:center;padding:14px 0}
.dots i{width:24px;height:24px;border-radius:50%;background:${INK};opacity:.35;animation:dotblink .9s infinite}
.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes dotblink{0%,100%{opacity:.25;transform:none}40%{opacity:.8;transform:translateY(-8px)}}
@keyframes out{to{opacity:0}}
.popin{opacity:0;animation:pop .35s cubic-bezier(.2,1.4,.4,1) forwards}
.stamp{position:absolute;left:50%;top:880px;font-family:Fraunces;font-style:italic;font-weight:600;color:${LAV};white-space:nowrap;
  transform:translate(-50%,-50%) scale(3) rotate(-14deg);opacity:0;animation:stamp .38s cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes stamp{to{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-8deg)}}
.flash{position:absolute;inset:0;background:${LAV};opacity:0}
@keyframes flash{0%{opacity:0}15%{opacity:.35}100%{opacity:0}}
@keyframes dim{to{opacity:.07;filter:blur(5px)}}
@keyframes shake{20%{transform:translate(-14px,8px)}40%{transform:translate(12px,-10px)}60%{transform:translate(-8px,6px)}80%{transform:translate(6px,-4px)}}
.end{top:1170px}`;

function chatplus(p, fonts) {
  const QCH = 0.032; // question typing speed
  const ACH = 0.038; // answer typing speed
  const hasCount = Boolean(p.count);
  const hookEnd = hasCount ? 2.6 : 2.1;
  const q = typed(p.question, hookEnd + 0.35, hookEnd + 4, QCH);
  const aRow = q.end + 0.2;
  const aType = aRow + 0.75;
  const a = typed(p.a.text, aType, aType + 3, ACH);
  const bRow = a.end - 0.4;
  const bType = Math.max(a.end + 0.25, bRow + 0.75);
  const b = typed(p.b.text, bType, bType + 3, ACH);
  const stampAt = b.end + 1.1; // time to read the second answer
  const endAt = stampAt + 1.0;
  const duration = endAt + 2.8;

  const hook = hasCount
    ? `<div style="position:absolute;left:90px;right:90px;top:680px;display:flex;flex-direction:column;gap:34px;animation:leave .3s ease-in ${hookEnd - 0.3}s forwards">
  <span class="kick popin" style="animation-delay:0s">${esc(p.count.kicker ?? "Hypothetically")}</span>
  <span class="count" id="count">${esc(p.count.prefix ?? "")}0</span>
  <div class="hookline">${typed(p.hook, 1.15, hookEnd, 0.04).html}</div>
</div>`
    : `<div class="hookline" style="position:absolute;left:90px;right:90px;top:620px;font-size:140px;animation:leave .3s ease-in ${hookEnd - 0.3}s forwards">${typed(p.hook, 0.1, hookEnd, 0.045).html}</div>`;
  const qSize = p.question.length > 80 ? 80 : 92;
  const row = (side, who, rowAt, typeAt, txt) =>
    `<div class="row ${side} popin" style="animation-delay:${rowAt.toFixed(2)}s"><span class="name">${esc(who.name)}</span>
<div class="bubble"><div class="cell"><div class="dots" style="animation:out .01s linear ${typeAt.toFixed(2)}s forwards"><i></i><i></i><i></i></div><div>${txt.html}</div></div></div></div>`;
  const body = `<div class="glow" style="animation:drift ${duration}s ease-in-out forwards"></div>
<div class="cam" style="animation:push ${duration}s linear forwards">
${hook}
<div style="position:absolute;inset:0;animation:dim .4s ease ${(stampAt - 0.2).toFixed(2)}s forwards">
  <div style="position:absolute;left:90px;right:90px;top:420px;display:flex;flex-direction:column;gap:30px">
    <span class="pill popin" style="animation-delay:${(hookEnd + 0.1).toFixed(2)}s">${esc(p.mood)}</span>
    <div class="qt" style="font-size:${qSize}px">${q.html}</div>
  </div>
  <div style="position:absolute;left:90px;right:90px;top:${p.question.length > 80 ? 1040 : 1000}px;display:flex;flex-direction:column;gap:36px">
    ${row("a", p.a, aRow, aType, a)}
    ${row("b", p.b, bRow, bType, b)}
  </div>
</div>
</div>
<div class="flash" style="animation:flash .45s ${stampAt.toFixed(2)}s forwards"></div>
<div class="stamp" style="animation-delay:${stampAt.toFixed(2)}s;font-size:${p.verdict.length > 4 ? 280 : 340}px">${esc(p.verdict)}</div>
<div class="end"><p style="animation-delay:${endAt.toFixed(2)}s">${esc(p.endLine ?? "Same… or -ish? Comment yours 👇")}</p><span class="cta" style="animation-delay:${(endAt + 0.35).toFixed(2)}s">Play free → link in bio</span></div>
<style>
@keyframes push{from{transform:scale(1)}to{transform:scale(1.045)}}
@keyframes drift{0%{transform:translate(0,0)}50%{transform:translate(-260px,420px)}100%{transform:translate(-80px,820px)}}
body{animation:shake .35s ${(stampAt + 0.25).toFixed(2)}s}
</style>
${
  hasCount
    ? `<script>
window.__tick = (ms) => {
  const t = ms / 1000, el = document.getElementById("count");
  const k = Math.min(1, Math.max(0, (t - 0.15) / 1.0));
  const e = 1 - Math.pow(1 - k, 3);
  el.textContent = ${JSON.stringify(p.count.prefix ?? "")} + Math.round(${p.count.to} * e).toLocaleString("en-US");
};
</script>`
    : ""
}`;
  return { duration, html: shell(fonts, duration, CHATPLUS_CSS, body) };
}

/** Still cover for a chatplus reel: big question with both answers, at rest, inside the grid crop. */
export function chatplusCover(p, fonts, { minimal = false } = {}) {
  if (minimal) return chatplusCoverMinimal(p, fonts);
  const qHtml = esc(p.coverTitle ?? p.question)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
  const still = `.bar{display:none}.brand{top:270px}
.wrap{position:absolute;left:90px;right:90px;top:350px;bottom:330px;display:flex;flex-direction:column;justify-content:space-between;gap:36px}
.big{font-family:Fraunces;font-weight:600;font-size:128px;line-height:1;letter-spacing:-.02em}
.wrap .bubble{font-size:52px;padding:28px 40px}
.cover-stamp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-8deg);white-space:nowrap;
  font-family:Fraunces;font-style:italic;font-weight:600;font-size:176px;line-height:1;color:${LAV}}
.wrap:has(.cover-stamp) .row{opacity:.14;filter:blur(4px)}`;
  const bubble = (side, who) =>
    `<div class="row ${side}"><span class="name">${esc(who.name)}</span><div class="bubble">${esc(who.text)}</div></div>`;
  const body = `<div class="glow"></div><div class="wrap">
  <span class="pill" style="align-self:flex-start">${esc(p.mood)}</span>
  <div class="big">${qHtml}</div>
  <div style="position:relative;display:flex;flex-direction:column;gap:30px">${bubble("a", p.a)}${bubble("b", p.b)}${
    p.coverStamp ? `<span class="cover-stamp">${esc(p.coverStamp)}</span>` : ""
  }</div>
</div>`;
  return shell(fonts, 1, CHATPLUS_CSS + still, body);
}

/** Minimal cover: just the question and the stamp, nothing else. */
function chatplusCoverMinimal(p, fonts) {
  const qHtml = esc(p.coverTitle ?? p.question)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
  const css = `.bar{display:none}.brand{top:270px}
.wrap{position:absolute;left:90px;right:90px;top:340px;bottom:330px;display:flex;flex-direction:column;justify-content:center;gap:90px}
.big{font-family:Fraunces;font-weight:600;font-size:168px;line-height:.98;letter-spacing:-.025em}
.mstamp{align-self:flex-end;font-family:Fraunces;font-style:italic;font-weight:600;font-size:150px;line-height:1;color:${LAV};transform:rotate(-8deg);margin-right:10px}`;
  return shell(
    fonts,
    1,
    css,
    `<div class="wrap"><div class="big">${qHtml}</div>${p.coverStamp ? `<span class="mstamp">${esc(p.coverStamp)}</span>` : ""}</div>`,
  );
}

const STYLES = { intro, chat, rapid, chatplus };

/** Renders the post's motion reel to `file` (H.264, 30 fps, silent). */
export async function renderMotion(page, p, fonts, file, tmpDir) {
  const { html, duration } = STYLES[p.motion](p, fonts);
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
  await page.setViewportSize({ width: 1080, height: 1920 });
  // setContent keeps the window: drop a previous reel's frame hook first.
  await page.evaluate(() => delete window.__tick);
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
        window.__tick?.(t);
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
