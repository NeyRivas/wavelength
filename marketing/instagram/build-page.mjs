/**
 * Builds index.html — the calendar page (Spanish UI) with every post's
 * rendered preview, caption ready to copy, reel script and notes. Reads
 * calendar.mjs and the files render.mjs wrote to out/, so run render first.
 *
 * Usage: node build-page.mjs
 */

import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { POSTS } from "./calendar.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const FORMAT = {
  reel: { label: "Reel", style: "Tinta" },
  carousel: { label: "Carrusel", style: "Papel" },
  post: { label: "Post", style: "Lavanda" },
};

function media(p) {
  const nn = String(p.n).padStart(2, "0");
  if (p.format === "post")
    return `<div class="frames"><img src="out/${nn}-post.png" alt="" loading="lazy" width="1080" height="1350"></div>`;
  if (p.format === "carousel") {
    const files = readdirSync(join(HERE, "out", `${nn}-carousel`)).sort();
    return `<div class="frames strip" tabindex="0" aria-label="Slides del carrusel">${files
      .map(
        (f) =>
          `<img src="out/${nn}-carousel/${f}" alt="" loading="lazy" width="1080" height="1350">`,
      )
      .join("")}</div>`;
  }
  if (p.kind === "animated" && existsSync(join(HERE, "out", `${nn}-reel.mp4`)))
    return `<div class="frames"><video src="out/${nn}-reel.mp4" poster="out/${nn}-reel-cover.png" controls muted loop playsinline preload="none" width="1080" height="1920"></video></div>`;
  return `<div class="frames"><img src="out/${nn}-reel-cover.png" alt="" loading="lazy" width="1080" height="1920"></div>`;
}

function card(p) {
  const d = new Date(`${p.date}T12:00:00`);
  const f = FORMAT[p.format];
  const status =
    p.format === "reel" && p.kind === "filmed"
      ? `<span class="chip chip--todo">Hay que grabar</span>`
      : `<span class="chip chip--ready">Listo para subir</span>`;
  const full = `${p.caption}\n\n${p.tags}`;
  const script = p.script
    ? `<details open><summary>Guion</summary><ol class="script">${p.script.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></details>`
    : "";
  const meta = [
    p.audio && `<div><dt>Audio</dt><dd>${esc(p.audio)}</dd></div>`,
    p.notes && `<div><dt>Nota</dt><dd>${esc(p.notes)}</dd></div>`,
  ]
    .filter(Boolean)
    .join("");
  return `<article class="post" data-format="${p.format}" id="p${p.n}">
  <div class="when"><span class="n">${p.n}</span><span class="day">${DAYS[d.getDay()]}</span><span class="date">${d.getDate()} ${MONTHS[d.getMonth()]}</span></div>
  <div class="body">
    <header class="head">
      <h3>${esc(p.cover?.title?.replace(/\*/g, "") ?? p.title ?? p.question ?? p.statement?.text.replace(/\*|\n/g, " "))}</h3>
      <div class="chips"><span class="chip chip--${p.format}">${f.label}</span><span class="chip">${esc(p.pillar)}</span>${status}${p.pin ? `<span class="chip chip--pin">Fijar</span>` : ""}</div>
    </header>
    ${media(p)}
    <div class="copy">
      <div class="caption-head"><span class="label">Caption</span><button type="button" class="copy-btn" data-copy="c${p.n}">Copiar caption</button></div>
      <pre class="caption" id="c${p.n}">${esc(full)}</pre>
      ${script}
      ${meta ? `<dl class="meta">${meta}</dl>` : ""}
    </div>
  </div>
</article>`;
}

const weeks = [];
for (const p of POSTS) {
  const d = new Date(`${p.date}T12:00:00`);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const key = monday.toISOString().slice(0, 10);
  let w = weeks.find((x) => x.key === key);
  if (!w) weeks.push((w = { key, monday, posts: [] }));
  w.posts.push(p);
}

const count = (fn) => POSTS.filter(fn).length;
const html = `<title>Calendario Sameeeish</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Nunito:wght@400;600;700;800&display=swap">
<style>
/* Layout: one editorial column of dated posts, grouped by week; previews scroll sideways inside each post. */
:root {
  --bg: #f7f6f2; --surface: #ffffff; --fg: #181820; --muted: #5d5a6e; --line: #e4e1ec;
  --accent: #6c5fd0; --lavender: #c9c3f4; --ink: #181820; --ready: #2f7d5b; --todo: #a35a14;
  --display: "Fraunces", Georgia, serif; --body: "Nunito", system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #121218; --surface: #1b1b23; --fg: #f1effa; --muted: #a9a5bd; --line: #2c2b37;
  --accent: #b3abf2; --lavender: #3a3560; --ink: #f1effa; --ready: #6fd1a4; --todo: #f0b070; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #121218; --surface: #1b1b23; --fg: #f1effa; --muted: #a9a5bd; --line: #2c2b37;
  --accent: #b3abf2; --lavender: #3a3560; --ink: #f1effa; --ready: #6fd1a4; --todo: #f0b070; color-scheme: dark }
body { background: var(--bg); color: var(--fg); font-family: var(--body); font-size: 16px; line-height: 1.55; }
.wrap { max-width: 1120px; margin: 0 auto; padding-block: 48px 96px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1, h2, h3 { font-family: var(--display); font-weight: 600; text-wrap: balance; margin: 0; letter-spacing: -0.01em; }
h1 { font-size: clamp(2.2rem, 5vw, 3.6rem); line-height: 1.05; }
h1 em { font-style: italic; font-weight: 500; color: var(--accent); }
.lede { color: var(--muted); max-width: 62ch; margin: 16px 0 0; font-size: 1.05rem; }
.system { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 32px 0 8px; }
.sys { display: flex; gap: 12px; align-items: center; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); min-width: 0; }
.sw { flex: none; width: 34px; height: 42px; border-radius: 6px; border: 1px solid var(--line); }
.sys b { display: block; font-size: .95rem; }
.sys span { color: var(--muted); font-size: .85rem; }
.toolbar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); padding-block: 14px;
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center; border-bottom: 1px solid var(--line); margin-top: 24px; }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
.toolbar .totals { margin-left: auto; color: var(--muted); font-size: .9rem; font-variant-numeric: tabular-nums; }
.filter { font: inherit; font-weight: 700; font-size: .9rem; padding: 7px 14px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--fg); cursor: pointer; }
.filter[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.filter:focus-visible, .copy-btn:focus-visible, .strip:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.week { margin-top: 48px; }
.week > h2 { font-size: 1.5rem; display: flex; align-items: baseline; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
.week > h2 small { font-family: var(--body); font-size: .9rem; font-weight: 600; color: var(--muted); }
.post { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 20px; padding: 28px 0; border-bottom: 1px solid var(--line); }
.post[hidden] { display: none !important; }
.when { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.when .n { font-family: var(--display); font-style: italic; color: var(--accent); font-size: 1.1rem; }
.when .day { text-transform: uppercase; letter-spacing: .12em; font-weight: 800; font-size: .75rem; color: var(--muted); }
.when .date { font-family: var(--display); font-size: 1.35rem; font-weight: 600; line-height: 1.1; }
.body { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); grid-template-areas: "head head" "frames copy"; gap: 16px 28px; min-width: 0; }
.head { grid-area: head; display: flex; flex-direction: column; gap: 10px; }
.head h3 { font-size: 1.35rem; line-height: 1.2; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-size: .75rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
.chip--reel { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.chip--carousel { background: var(--surface); color: var(--fg); }
.chip--post { background: var(--lavender); color: var(--fg); border-color: transparent; }
.chip--ready { color: var(--ready); border-color: currentColor; }
.chip--todo { color: var(--todo); border-color: currentColor; }
.chip--pin { color: var(--accent); border-color: currentColor; }
.frames { grid-area: frames; min-width: 0; }
.frames img, .frames video { display: block; max-width: 100%; height: auto; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); }
.frames > img, .frames > video { width: min(100%, 340px); }
.strip { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; }
.strip img { flex: none; width: 240px; scroll-snap-align: start; }
.copy { grid-area: copy; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.caption-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.label { text-transform: uppercase; letter-spacing: .12em; font-weight: 800; font-size: .75rem; color: var(--muted); }
.copy-btn { font: inherit; font-weight: 800; font-size: .85rem; padding: 7px 14px; border-radius: 999px; border: 0; background: var(--ink); color: var(--bg); cursor: pointer; }
.caption { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: var(--body); font-size: .95rem; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
details summary { cursor: pointer; font-weight: 800; font-size: .75rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.script { margin: 10px 0 0; padding-left: 20px; display: grid; gap: 6px; font-size: .95rem; }
.meta { margin: 0; display: grid; gap: 8px; font-size: .92rem; }
.meta div { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 8px; }
.meta dt { font-weight: 800; color: var(--muted); }
.meta dd { margin: 0; }
@media (max-width: 760px) {
  .post { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .when { flex-direction: row; align-items: baseline; gap: 10px; }
  .body { grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "frames" "copy"; }
  .strip img { width: 200px; }
}
@media (prefers-reduced-motion: reduce) { .strip { scroll-behavior: auto; } }
</style>
<div class="wrap">
  <h1>Calendario de Instagram, <em>los primeros 30</em></h1>
  <p class="lede">Del 20 de octubre al 23 de noviembre de 2026, 6 publicaciones por semana. Los posts, carruseles y Reels animados están listos para subir; los Reels grabados traen su guion y portada. Los textos de los posts van en inglés porque el producto está en inglés.</p>
  <div class="system" aria-label="Sistema visual">
    <div class="sys"><span class="sw" style="background:#f7f6f2"></span><div><b>Papel</b><span>Carruseles · ${count((p) => p.format === "carousel")}</span></div></div>
    <div class="sys"><span class="sw" style="background:#181820"></span><div><b>Tinta</b><span>Reels · ${count((p) => p.format === "reel")}</span></div></div>
    <div class="sys"><span class="sw" style="background:#c9c3f4"></span><div><b>Lavanda</b><span>Posts · ${count((p) => p.format === "post")}</span></div></div>
  </div>
  <div class="toolbar" role="toolbar" aria-label="Filtrar por formato">
    <button type="button" class="filter" id="f-all" data-f="all" aria-pressed="true">Todos</button>
    <button type="button" class="filter" id="f-reel" data-f="reel" aria-pressed="false">Reels</button>
    <button type="button" class="filter" id="f-carousel" data-f="carousel" aria-pressed="false">Carruseles</button>
    <button type="button" class="filter" id="f-post" data-f="post" aria-pressed="false">Posts</button>
    <button type="button" class="filter" id="f-film" data-f="film" aria-pressed="false">Por grabar</button>
    <span class="totals">${POSTS.length} publicaciones · ${count((p) => p.kind === "filmed")} por grabar</span>
  </div>
  ${weeks
    .map((w, i) => {
      const end = new Date(w.monday);
      end.setDate(end.getDate() + 6);
      return `<section class="week"><h2>Semana ${i + 1} <small>${w.monday.getDate()} ${MONTHS[w.monday.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}</small></h2>${w.posts.map(card).join("")}</section>`;
    })
    .join("")}
</div>
<script>
const KIND = ${JSON.stringify(Object.fromEntries(POSTS.map((p) => [p.n, p.kind ?? ""])))};
document.querySelectorAll(".filter").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  const f = b.dataset.f;
  document.querySelectorAll(".post").forEach((el) => {
    const n = el.id.slice(1);
    el.hidden = !(f === "all" || (f === "film" ? KIND[n] === "filmed" : el.dataset.format === f));
  });
  document.querySelectorAll(".week").forEach((w) => { w.hidden = !w.querySelector(".post:not([hidden])"); });
}));
document.querySelectorAll(".copy-btn").forEach((b) => b.addEventListener("click", async () => {
  const pre = document.getElementById(b.dataset.copy);
  try { await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copiado"; }
  catch { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Seleccionado, copia con Ctrl+C"; }
  setTimeout(() => { b.textContent = "Copiar caption"; }, 2200);
}));
</script>
`;

writeFileSync(join(HERE, "index.html"), html);
console.log("index.html written");
