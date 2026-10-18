/**
 * Packs out/ into a ZIP organized by publishing day: one folder per post,
 * named by date, holding exactly what gets uploaded that day plus the
 * caption (caption.txt) and instructions (instrucciones.txt, in Spanish).
 *
 * Usage: node package.mjs <output.zip>
 * Run render.mjs first.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { POSTS } from "./calendar.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const zipPath = resolve(process.argv[2] ?? "sameeeish-instagram-por-fecha.zip");
const stage = join(dirname(zipPath), ".stage-instagram");
const ROOT = "Sameeeish Instagram";

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const FORMAT = { reel: "Reel", carousel: "Carrusel", post: "Post" };
/** Folder-safe title: no characters phones, Windows or zip tools choke on, cut at a word. */
const safe = (s) =>
  s
    .replace(/\*/g, "")
    .replace(/[\\/:?"<>|…“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(.{0,44})\s.*$/, (m, head) => (m.length > 44 ? `${head}…` : m))
    .replace(/[.,!\s]+(…?)$/, "$1");

rmSync(stage, { recursive: true, force: true });
const base = join(stage, ROOT);
mkdirSync(base, { recursive: true });

writeFileSync(
  join(base, "00 Cómo usar.txt"),
  `Sameeeish · Instagram · 30 publicaciones (20 oct – 23 nov 2026)

Cada carpeta es un día de publicación, en orden por fecha.
Dentro de cada carpeta:
  · Las imágenes o el video que se suben ese día.
  · caption.txt: el texto del post con hashtags, listo para copiar y pegar.
  · instrucciones.txt: cómo subirlo, audio sugerido y notas.

Tipos:
  · Post: una sola imagen (post.png).
  · Carrusel: varias imágenes (01.png, 02.png…). Súbelas juntas, en ese orden, como un solo post.
  · Reel: reel.mp4 es el video y portada.png su portada
    (en Instagram: Editar portada → Añadir desde la galería).
    Los videos no tienen audio: añade un audio en tendencia antes de publicar.
  · Reel por grabar: solo trae portada.png y el guion en instrucciones.txt.

Fijar en el perfil: publicaciones #1, #2 y #9.
`,
);

for (const p of POSTS) {
  const nn = String(p.n).padStart(2, "0");
  const d = new Date(`${p.date}T12:00:00`);
  const title =
    p.title ?? p.cover?.title ?? p.question ?? p.statement?.text.replace(/\n/g, " ") ?? "";
  const filmed = p.kind === "filmed";
  const kind = filmed ? "Reel por grabar" : FORMAT[p.format];
  const dir = join(base, `${p.date} ${DAYS[d.getDay()]} · #${nn} ${kind} · ${safe(title)}`);
  mkdirSync(dir);

  const files = [];
  if (p.format === "post") {
    copyFileSync(join(OUT, `${nn}-post.png`), join(dir, "post.png"));
    files.push("post.png");
  } else if (p.format === "carousel") {
    for (const f of readdirSync(join(OUT, `${nn}-carousel`)).sort()) {
      copyFileSync(join(OUT, `${nn}-carousel`, f), join(dir, f));
      files.push(f);
    }
  } else {
    copyFileSync(join(OUT, `${nn}-reel-cover.png`), join(dir, "portada.png"));
    if (existsSync(join(OUT, `${nn}-reel.mp4`))) {
      copyFileSync(join(OUT, `${nn}-reel.mp4`), join(dir, "reel.mp4"));
      files.push("reel.mp4");
    }
    files.push("portada.png");
  }

  writeFileSync(join(dir, "caption.txt"), `${p.caption}\n\n${p.tags}\n`);

  const how =
    p.format === "post"
      ? "Sube post.png como publicación normal."
      : p.format === "carousel"
        ? `Sube las ${files.length} imágenes juntas, en orden (01 a ${String(files.length).padStart(2, "0")}), como un solo carrusel.`
        : filmed
          ? "Graba el video siguiendo el guion de abajo. Usa portada.png como portada."
          : "Sube reel.mp4 como Reel, añade el audio sugerido y usa portada.png como portada.";
  const lines = [
    `#${p.n} · ${kind} · ${p.date} (${DAYS[d.getDay()]})`,
    `Pilar: ${p.pillar}${p.pin ? " · FIJAR EN EL PERFIL" : ""}`,
    "",
    `Cómo subirlo: ${how}`,
    "Caption: copia caption.txt completo.",
    p.audio && `Audio sugerido: ${p.audio}`,
    p.notes && `Nota: ${p.notes}`,
    p.script && ["", "GUION", ...p.script.map((s, i) => `${i + 1}. ${s}`)].join("\n"),
  ].filter(Boolean);
  writeFileSync(join(dir, "instrucciones.txt"), lines.join("\n") + "\n");
}

rmSync(zipPath, { force: true });
execFileSync("zip", ["-qr", zipPath, ROOT], { cwd: stage });
rmSync(stage, { recursive: true, force: true });
console.log(`✓ ${zipPath}`);
