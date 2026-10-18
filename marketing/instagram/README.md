# Instagram de Sameeeish

Calendario y contenido de las primeras 30 publicaciones (20 oct – 23 nov 2026).

- `calendar.mjs` — fuente única: fecha, formato, textos, caption, hashtags, guiones y notas de cada post.
- `render.mjs` — genera las imágenes y Reels en `out/` (Playwright + ffmpeg). `node render.mjs` para todo, `node render.mjs 4 11` para posts concretos.
- `motion.mjs` — los Reels animados: intro, revelación en chat y rapid fire.
- `build-page.mjs` — genera `index.html`, la página del calendario con vistas previas y captions para copiar.
- `fonts/` — Fraunces y Nunito, las tipografías del sitio.

Sistema visual: un fondo plano por formato, texto en tinta y lavanda como único acento.
Carruseles en papel (`#f7f6f2`), Reels en tinta (`#181820`), posts sueltos en lavanda (`#c9c3f4`).

Para cambiar un texto: edita `calendar.mjs`, corre `node render.mjs <n>` y luego `node build-page.mjs`.
