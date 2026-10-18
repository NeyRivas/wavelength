/**
 * Sameeeish — Instagram content calendar: posts 1–30 (Oct 20 – Nov 23, 2026).
 *
 * Single source of truth for render.cjs (which turns every entry into the
 * PNGs / MP4s under out/) and for the calendar page. Post copy is in
 * English (the product is English-only); `notes` are production notes for
 * the team, in Spanish.
 *
 * Formats:
 *   reel     + kind "animated" → fully rendered here (MP4 + cover), just add audio in IG
 *   reel     + kind "filmed"   → needs to be filmed; `script` is the shot list, cover is rendered
 *   carousel → cover + one slide per item + closing CTA slide
 *   post     → single 4:5 image

 */

const TAGS = {
  couples: "#couplesquestions #questionsforcouples #relationshipquestions #datenightideas",
  dating: "#firstdatequestions #datingtips #conversationstarters #gettingtoknowyou",
  friends: "#bestfriendquiz #howwelldoyouknowme #bestfriends #friendshipgoals",
  deep: "#deepquestions #relationshipquestions #couplesquestions #conversationstarters",
  general: "#questionsforcouples #bestfriendquiz #conversationstarters #twoplayergame",
};

const PLAY = "Play it free (no sign up) → link in bio";

export const POSTS = [
  // ── Semana 1 ─────────────────────────────────────────────────────────────
  {
    n: 1,
    date: "2026-10-20",
    format: "reel",
    kind: "animated",
    pillar: "Producto",
    pin: true,
    title: "What is Sameeeish?",
    frames: [
      { kicker: "Meet Sameeeish", text: "Two people.\nSame *questions.*" },
      { kicker: "Step 1", text: "You each answer.\n*No peeking.*" },
      { kicker: "Step 2", text: "See where you're the same…\nand where you're *-ish.*" },
      { kicker: "Free · No sign up", text: "Not a test.\nA *conversation.*", end: true },
    ],
    caption: `Two people. Same questions. Answered separately — then you see where you're the same… and where you're -ish. 💜

It's not a compatibility score. It's the conversation you haven't had yet.

${PLAY}`,
    tags: TAGS.general,
    audio: "Audio tendencia suave/lo-fi; texto ya está en pantalla",
    notes:
      "Post fijado #1. Es la presentación de la marca: debe ser lo primero que vea quien llega al perfil.",
  },
  {
    n: 2,
    date: "2026-10-21",
    format: "carousel",
    pillar: "Preguntas",
    pin: true,
    mood: "Getting to know you",
    cover: {
      kicker: "Save for your next date",
      title: "10 first-date questions that *aren't* boring",
    },
    items: [
      "What's something you could talk about for way longer than anyone expects?",
      "What's a completely random opinion you feel surprisingly strongly about?",
      "If you could instantly become amazing at one completely random skill, what would you choose?",
      "What's a place you'd go back to tomorrow if you could?",
      "If you could have dinner with any fictional character, who would you pick?",
      "What's something small that can instantly make your day better?",
      "What's something you've always wanted to try just because it looks fun?",
      "What's a totally unnecessary thing you would still hate to live without?",
      "If you had to live in one movie or TV show for a week, which one would you choose?",
      "What's something people tend to notice about you once they get to know you?",
    ],
    caption: `"So… what do you do?" — we can do better. 😅

10 first-date questions that actually start a conversation. Save this for your next date (or send it to the friend who has one tonight).

Want to know how they'd answer before you ask? Play them in Sameeeish — you each answer separately, then compare.
${PLAY}`,
    tags: TAGS.dating,
    notes: "Post fijado #2. Carrusel de guardados: la métrica a mirar son los saves.",
  },
  {
    n: 3,
    date: "2026-10-22",
    format: "reel",
    kind: "filmed",
    pillar: "We played it",
    title: "Which reality show would we fail at?",
    cover: "We asked each other which reality show we'd *fail* at",
    script: [
      "0–2 s · Hook en pantalla: “We answered this separately. Then compared.” Los dos mirando su celular, serios.",
      "2–5 s · Texto: “If we had to compete on a reality show together, which one would we absolutely fail at?”",
      "5–9 s · Él/ella lee su respuesta en voz alta. Corte. La otra persona lee la suya.",
      "9–12 s · Reacción real (risa, “¿¡en serio!?”). Si coinciden: “SAME 💜”. Si no: “…-ish.”",
      "12–14 s · Cierre en pantalla: “What would you two say? 👇”",
    ],
    caption: `We answered separately. We did NOT agree. 😂

"If we had to compete on a reality show together, which one would we absolutely fail at?"

Tell us what you two would say 👇 — then play the full game together. ${PLAY}`,
    tags: TAGS.couples,
    audio: "Audio original (las reacciones son el contenido)",
    notes:
      "Grabar con una pareja real (amigos sirven). Vertical, luz natural, sin guion para las reacciones.",
  },
  {
    n: 4,
    date: "2026-10-23",
    format: "post",
    pillar: "Preguntas",
    mood: "Hypothetical",
    question: "If we won $10 million tomorrow, what's the first thing you think we'd do?",
    caption: `Answer first. Then tag them and see if they say the same thing. 👀

(If one of you said "pay off debt" and the other said "buy a boat"… that's a conversation.)

${PLAY}`,
    tags: TAGS.couples,
    notes: "Post de comentarios: responde a todos en la primera hora.",
  },
  {
    n: 5,
    date: "2026-10-24",
    format: "carousel",
    pillar: "Date night",
    mood: "Date night",
    cover: { kicker: "Saturday plan", title: "A date night in, *sorted.*" },
    steps: [
      { h: "Set the mood", b: "Phones down, snacks out. 20 minutes is enough." },
      {
        h: "Pick a vibe",
        b: "Flirty, funny, romantic, deep or hypothetical — swipe for one of each.",
      },
      {
        h: "Answer, then compare",
        b: "Say your answer before you hear theirs. That's where it gets fun.",
      },
    ],
    items: [
      { mood: "Flirty", q: "What's the first thing you actually noticed about me?" },
      { mood: "Funny", q: "If your personality came with a warning label, what would it say?" },
      {
        mood: "Romantic",
        q: "If we could relive one moment together, which one would you choose?",
      },
      {
        mood: "Deep",
        q: "What's something you understand about yourself now that you didn't a few years ago?",
      },
      {
        mood: "Hypothetical",
        q: "If we could recreate one fictional date from a movie or show, which one would you choose?",
      },
    ],
    caption: `Date night in, no planning required. 🕯️

1. Phones down, snacks out
2. Pick a vibe
3. Say your answer BEFORE you hear theirs

5 questions inside, one for every mood. Want 60 more? Our Date Night deck is free — ${PLAY.toLowerCase()}`,
    tags: TAGS.couples,
    notes: "El link de bio puede apuntar a /play/dating-couples/date-night esta semana.",
  },

  // ── Semana 2 ─────────────────────────────────────────────────────────────
  {
    n: 6,
    date: "2026-10-26",
    format: "reel",
    kind: "filmed",
    pillar: "We played it",
    title: "Best friends: how well do you know me?",
    cover: "Best friends of 10 years take the *how well do you know me* test",
    script: [
      "0–2 s · Hook: “Best friends of [X] years. How well do we actually know each other?”",
      "2–6 s · Pregunta en pantalla: “Which fictional character would I defend with my life?” Ambas escriben en el celular.",
      "6–9 s · Revelan al mismo tiempo (giran los celulares a cámara).",
      "9–13 s · Segunda pregunta rápida: “What's my most irrational opinion?” → reacción.",
      "13–15 s · Texto final: “Score: SAME-ish 💙 Send this to your best friend.”",
    ],
    caption: `10 years of friendship vs. one question: "Which fictional character would I defend with my life?" 💙

Send this to your best friend and make them prove it. ${PLAY}`,
    tags: TAGS.friends,
    audio: "Audio tendencia de amistad o audio original",
    notes:
      "Ideal con dos amigas reales. Mostrar los celulares con la app abierta 1 segundo (product placement natural).",
  },
  {
    n: 7,
    date: "2026-10-27",
    format: "carousel",
    pillar: "Preguntas",
    mood: "Deep",
    cover: { kicker: "Before you sign the lease", title: "Ask these *before* moving in together" },
    items: [
      "How would you describe your approach to money?",
      "How comfortable would you be combining finances with a serious partner?",
      "How much alone time do you need in a relationship?",
      "After an argument, how much space do you usually need before talking things through?",
      "When something is bothering you, what are you most likely to do?",
      "Do you want children someday?",
      "How important is marriage to you?",
      "How open would you be to moving somewhere new for your partner?",
    ],
    caption: `Moving in together? Ask these first. 🏡

Not to "pass a test" — just so you're not finding out about the alone-time thing on day three.

Tip: answer them separately in Sameeeish so neither of you just agrees with the other. ${PLAY}`,
    tags: TAGS.deep,
    notes: "Contenido de alto guardado. Responder comentarios con empatía (tema serio).",
  },
  {
    n: 8,
    date: "2026-10-28",
    format: "post",
    pillar: "Producto",
    statement: {
      kicker: "Our whole thing",
      text: "No score.\nNo sign up.\nJust *two perspectives.*",
    },
    caption: `We're not here to tell you if you're "compatible." 💜

Sameeeish shows you where you think the same — and where you're -ish. The -ish is the good part: that's the conversation.

${PLAY}`,
    tags: TAGS.general,
    notes: "Post manifiesto. Cierra la primera fila del grid con la propuesta de valor.",
  },
  {
    n: 9,
    date: "2026-10-29",
    format: "reel",
    kind: "filmed",
    pillar: "Producto",
    pin: true,
    title: "How it works in 15 seconds",
    cover: "How to play *Sameeeish* in 15 seconds",
    script: [
      "Grabación de pantalla del celular (sin cara). Texto grande arriba en cada paso.",
      "0–3 s · “Pick a game” → tocar Date Night / Friendship Check en sameeeish.com.",
      "3–7 s · “Answer the questions” → responder 2 preguntas rápido.",
      "7–10 s · “Send the link” → compartir por WhatsApp/iMessage.",
      "10–13 s · “See where you're same… or -ish” → pantalla de resultados.",
      "13–15 s · “Free. No account. Link in bio.”",
    ],
    caption: `How it works:
1. Pick a game (or write your own questions)
2. Answer them yourself
3. Send the link to your person
4. See where you're the same… and where you're -ish 💜

No app to download. No account. ${PLAY}`,
    tags: TAGS.general,
    audio: "Audio tendencia upbeat",
    notes:
      "Post fijado #3. Graba la pantalla del celular en el sitio real; acelera a 1.5x si hace falta.",
  },
  {
    n: 10,
    date: "2026-10-30",
    format: "carousel",
    pillar: "Fechas",
    mood: "Halloween",
    cover: { kicker: "Halloween night in 🎃", title: "Spooky-*ish* questions for two" },
    items: [
      "If we were in a horror movie, which one of us dies first?",
      "Who's going to investigate the weird noise downstairs?",
      "If a ghost haunted our place, what would it complain about?",
      "What costume would you secretly love to see me in?",
      "Zombie apocalypse: who's the first person you'd call?",
      "What's the scariest movie you pretend you weren't scared of?",
    ],
    caption: `Halloween plans: blanket, candy, and arguing about who dies first. 🎃👻

Save for tomorrow night. Answer at the same time — the one who hesitates is lying.

${PLAY}`,
    tags: "#halloweendate #couplesquestions #halloweennight #datenightideas",
    notes:
      "Preguntas propias de temporada (no están en la app). Publicar viernes para que lo guarden para el sábado.",
  },
  {
    n: 11,
    date: "2026-10-31",
    format: "reel",
    kind: "animated",
    pillar: "Fechas",
    mood: "Halloween",
    hook: "Say it at the same time. 🎃",
    question: "If we were in a horror movie, which one of us dies first?",
    caption: `Say it at the same time. No hesitating. 🎃

Comment who you both said 👇

${PLAY}`,
    tags: "#halloween #couplesquestions #halloweennight #couplegoals",
    audio: "Audio de suspenso/terror en tendencia",
    notes: "Listo para subir; solo añade un audio de Halloween en Instagram.",
  },

  // ── Semana 3 ─────────────────────────────────────────────────────────────
  {
    n: 12,
    date: "2026-11-02",
    format: "reel",
    kind: "animated",
    pillar: "Preguntas",
    mood: "Funny",
    hook: "Ask your person this. Don't let them hear your answer first.",
    question: "If I got arrested, what would you assume I had done?",
    caption: `Be honest. 😂

Answer at the same time, then comment both answers 👇

${PLAY}`,
    tags: TAGS.couples,
    audio: "Audio cómico en tendencia",
    notes: "Funciona igual para parejas y amigos: la pregunta más compartible del banco.",
  },
  {
    n: 13,
    date: "2026-11-03",
    format: "carousel",
    pillar: "Preguntas",
    mood: "Flirty",
    cover: { kicker: "Past the small talk", title: "7 flirty questions to ask *tonight*" },
    items: [
      "What's the first thing you actually noticed about me?",
      "What's something someone can do that instantly makes them more attractive to you?",
      "What's your favorite kind of flirting?",
      "What's a compliment that would actually make you blush?",
      "What's the most attractive thing someone can do without realizing it?",
      "What's the most obvious sign that you're into someone?",
      "What's something you'd consider dangerously good chemistry?",
    ],
    caption: `For when you're past "what's your favorite color." 😏

Save it, send it, and let them answer first.

${PLAY}`,
    tags: TAGS.dating,
    notes: "",
  },
  {
    n: 14,
    date: "2026-11-04",
    format: "post",
    pillar: "Preguntas",
    mood: "Flirty",
    question: "What's the first thing you actually noticed about me?",
    caption: `Tag them. Make them answer in the comments. 👀

Bonus points if it's not "your eyes."

${PLAY}`,
    tags: TAGS.couples,
    notes: "",
  },
  {
    n: 15,
    date: "2026-11-05",
    format: "reel",
    kind: "filmed",
    pillar: "We played it",
    title: "6 years together, still surprised",
    cover: "Together *6 years.* We still disagreed on this.",
    script: [
      "0–2 s · Hook: “Together 6 years. We thought we'd match on everything.”",
      "2–5 s · Muestran el resultado en la app (“same on 7/10”).",
      "5–10 s · Cuentan la pregunta donde NO coincidieron (p. ej. “How much alone time do you need?”) y qué respondió cada uno.",
      "10–14 s · Momento real: “I had no idea you felt that way.”",
      "14–16 s · Texto: “The -ish is the good part. 💜”",
    ],
    caption: `6 years together and the alone-time question still got us. 😅

The answers where you DON'T match are the best part — that's the conversation you didn't know you needed.

${PLAY}`,
    tags: TAGS.couples,
    audio: "Audio original con subtítulos",
    notes:
      "El testimonio más importante del mes. Pide a la pareja que juegue de verdad antes de grabar.",
  },
  {
    n: 16,
    date: "2026-11-06",
    format: "carousel",
    pillar: "Preguntas",
    mood: "Friends",
    cover: { kicker: "Send to your best friend", title: "How well do you *really* know me?" },
    items: [
      "Which fictional character would I defend with my life?",
      "What's a random thing I'm weirdly passionate about?",
      "What's something I always say when I'm annoyed?",
      "What's my most irrational opinion?",
      "What's something I would absolutely judge someone for?",
      "Which artist or band could I listen to over and over?",
      "What's the kind of person I instantly dislike?",
      "If we made a playlist that represents me, what song would have to be on it?",
    ],
    caption: `8 questions your best friend should ace. Should. 💙

Send this to them. Or better: play it in Sameeeish so they can't see your answers first.

${PLAY}`,
    tags: TAGS.friends,
    notes: "",
  },
  {
    n: 17,
    date: "2026-11-07",
    format: "reel",
    kind: "animated",
    pillar: "Preguntas",
    mood: "Funny",
    hook: "Best friends: answer this for each other.",
    question: "If your personality came with a warning label, what would it say?",
    caption: `Answer for your best friend. Then let them answer for you. ⚠️

Comment yours 👇

${PLAY}`,
    tags: TAGS.friends,
    audio: "Audio cómico en tendencia",
    notes: "",
  },

  // ── Semana 4 ─────────────────────────────────────────────────────────────
  {
    n: 18,
    date: "2026-11-09",
    format: "reel",
    kind: "animated",
    pillar: "Preguntas",
    mood: "Flirty",
    hook: "Ask your person. Answer at the same time.",
    question:
      "What's a trait you find attractive that you have absolutely no business finding attractive?",
    caption: `We need to know. 😭

Answer at the same time and comment both 👇

${PLAY}`,
    tags: TAGS.couples,
    audio: "Audio tendencia coqueto",
    notes: "",
  },
  {
    n: 19,
    date: "2026-11-10",
    format: "carousel",
    pillar: "Preguntas",
    mood: "Romantic",
    cover: {
      kicker: "For couples who've been together a while",
      title: "Better than *“how was your day?”*",
    },
    items: [
      "If we could relive one moment together, which one would you choose?",
      "What's a small gesture that would make you feel really loved?",
      "What's something about you that you wish I'd ask about more?",
      "What's a part of your life that feels really good right now?",
      "What's something you're still figuring out about yourself?",
      "If you could know one thing about our future together, what would you want to know?",
      "What's something you hope your future self never forgets about who you are today?",
    ],
    caption: `You've done "how was your day" 2,000 times. Try one of these tonight. 💜

Save it for the next quiet dinner.

${PLAY}`,
    tags: TAGS.deep,
    notes: "",
  },
  {
    n: 20,
    date: "2026-11-11",
    format: "post",
    pillar: "Producto",
    statement: {
      kicker: "Same vs. -ish",
      text: "Where you're the *same:* easy.\nWhere you're *-ish:* that's the conversation.",
    },
    caption: `Matching answers feel great. The ones that don't are where you actually learn something. 💜

That's the whole idea behind Sameeeish.

${PLAY}`,
    tags: TAGS.general,
    notes: "Post de marca: el concepto “-ish” como idea propia.",
  },
  {
    n: 21,
    date: "2026-11-12",
    format: "reel",
    kind: "filmed",
    pillar: "We played it",
    title: "POV: you were SURE",
    cover: "POV: you were *sure* you knew their answer",
    script: [
      "Formato trend POV, una sola persona a cámara (puede ser quien maneja la cuenta).",
      "0–2 s · Texto: “POV: you were SO sure you knew their answer”. Cara confiada.",
      "2–4 s · Inserto de la pregunta en pantalla (“What's my most irrational opinion?”).",
      "4–7 s · Mira el celular (resultados). Cara de shock lenta.",
      "7–9 s · Texto: “…-ish.” + mirar a cámara.",
    ],
    caption: `Confidence: 100%. Accuracy: -ish. 😐

Tag the person who'd get yours wrong.

${PLAY}`,
    tags: TAGS.general,
    audio: "Audio trend de “shock/reacción” del momento",
    notes:
      "Rápido de grabar (1 persona, 10 min). Buscar el audio de reacción que esté en tendencia esa semana.",
  },
  {
    n: 22,
    date: "2026-11-13",
    format: "carousel",
    pillar: "Preguntas",
    mood: "Hypothetical",
    cover: {
      kicker: "Fun now, revealing later",
      title: "Hypotheticals that start *real* conversations",
    },
    items: [
      "If we had to open a business together tomorrow, what would we sell?",
      "If we could disappear for 24 hours and go anywhere, where would we go?",
      "If we could swap lives for one day, what would you be most curious to experience?",
      "If we could instantly become experts at one thing together, what would you choose?",
      "If we had to spend a month living somewhere completely new, where would you pick?",
      "If tonight could turn into one completely unexpected adventure, what would you want it to be?",
    ],
    caption: `They sound silly. The answers aren't. ✨

Save for your next long drive.

${PLAY}`,
    tags: TAGS.couples,
    notes: "",
  },
  {
    n: 23,
    date: "2026-11-14",
    format: "reel",
    kind: "animated",
    pillar: "Preguntas",
    mood: "Romantic",
    hook: "Send this to your person.",
    question: "If we could disappear for 24 hours and go anywhere, where would we go?",
    caption: `Send this to them and see if you pick the same place. ✈️

${PLAY}`,
    tags: TAGS.couples,
    audio: "Audio romántico/viajes en tendencia",
    notes: "",
  },

  // ── Semana 5 ─────────────────────────────────────────────────────────────
  {
    n: 24,
    date: "2026-11-16",
    format: "reel",
    kind: "animated",
    pillar: "Preguntas",
    mood: "Friends",
    hook: "Best friends: say it at the same time.",
    question: "What's the dumbest thing we've ever laughed about together?",
    caption: `If you both say the same thing, that's a real friendship. 😂

Tag them 👇

${PLAY}`,
    tags: TAGS.friends,
    audio: "Audio de amistad en tendencia",
    notes: "",
  },
  {
    n: 25,
    date: "2026-11-17",
    format: "carousel",
    pillar: "Producto",
    mood: "How it works",
    cover: { kicker: "New here?", title: "How to play *Sameeeish*" },
    steps: [
      {
        h: "Pick your questions",
        b: "Use a ready-made game — Date Night, Friendship Check, How Well Do You Know Me? — or write 5 to 12 of your own.",
      },
      {
        h: "Answer them yourself",
        b: "Your answers lock in once you share, so nothing changes after the fact.",
      },
      { h: "Send the link", b: "Your person answers on their own phone, without seeing yours." },
      {
        h: "See where you land",
        b: "Where you're the same, and where you're -ish. No score — just a better conversation.",
      },
    ],
    caption: `New here? Here's how it works. 💜

Free, two players, no app to download and no account.

${PLAY}`,
    tags: TAGS.general,
    notes: "Para los nuevos seguidores que llegaron con los Reels.",
  },
  {
    n: 26,
    date: "2026-11-18",
    format: "post",
    pillar: "Preguntas",
    mood: "Funny",
    question: "What's a completely normal thing that people do that irrationally annoys you?",
    caption: `Go. Comments are open. 😤

(Then ask your partner — you might find out something about yourself.)

${PLAY}`,
    tags: TAGS.general,
    notes: "Post para generar comentarios. Responde con humor.",
  },
  {
    n: 27,
    date: "2026-11-19",
    format: "reel",
    kind: "filmed",
    pillar: "Date night",
    title: "Friendsgiving game",
    cover: "The *Friendsgiving* game we'll play every year now",
    script: [
      "0–2 s · Hook: “The Friendsgiving game we're doing every year now”. Plano de la mesa.",
      "2–6 s · Alguien lee una pregunta en voz alta (“What's one story about us we'll still be telling years from now?”).",
      "6–11 s · Montaje rápido de 3 reacciones/respuestas.",
      "11–14 s · Primer plano del celular con Sameeeish abierto.",
      "14–16 s · Texto: “Save this for your Friendsgiving 🍂”",
    ],
    caption: `Our new Friendsgiving tradition. 🍂

Pair up, answer separately, then reveal at the table. Save this for yours.

${PLAY}`,
    tags: "#friendsgiving #friendsgivingideas #bestfriends #gamenight",
    audio: "Audio cálido/otoñal",
    notes: "Grabar en una cena real con amigos (puede ser el fin de semana anterior).",
  },
  {
    n: 28,
    date: "2026-11-20",
    format: "carousel",
    pillar: "Fechas",
    mood: "Friendsgiving",
    cover: { kicker: "Friendsgiving 🍂", title: "Questions to ask *around the table*" },
    items: [
      "What's the most “us” thing we've ever done?",
      "What's an inside joke between us that would make absolutely no sense to anyone else?",
      "What's something we've done together that sounded like a good idea at the time?",
      "What's a place, trip, or night out that instantly makes me think of you?",
      "What's one story about us that we'll probably still be telling years from now?",
      "What's something from this year you're grateful we got to do together?",
    ],
    caption: `Skip the small talk this Friendsgiving. 🍂

Go around the table, or pair up and play in Sameeeish before dessert.

${PLAY}`,
    tags: "#friendsgiving #friendsgivingideas #bestfriends #conversationstarters",
    notes: "La última pregunta es propia de temporada; el resto viene de “Friendship Check”.",
  },
  {
    n: 29,
    date: "2026-11-21",
    format: "reel",
    kind: "animated",
    pillar: "Preguntas",
    mood: "Deep",
    hook: "One question. Ask your person tonight.",
    question: "What's something you're proud of that nobody ever asks you about?",
    caption: `Ask someone this tonight. Then actually listen. 💜

${PLAY}`,
    tags: TAGS.deep,
    audio: "Audio suave/emocional",
    notes: "",
  },
  {
    n: 30,
    date: "2026-11-23",
    format: "carousel",
    pillar: "Fechas",
    mood: "Thanksgiving",
    cover: { kicker: "Thanksgiving week", title: "Dinner questions that *won't* start a fight" },
    items: [
      "What's a childhood memory you still think about sometimes?",
      "Who has had a big influence on the person you are today?",
      "What's something you've changed your mind about as you've gotten older?",
      "What's the weirdest thing you believed as a kid?",
      "What's something small that can instantly make your day better?",
      "What's something you're proud of that nobody ever asks you about?",
    ],
    caption: `Thanksgiving dinner, minus the politics. 🦃

6 questions that get everyone talking (and nobody yelling). Save for Thursday.

${PLAY}`,
    tags: "#thanksgiving #thanksgivingdinner #conversationstarters #familytime",
    notes: "Publicar el lunes para que lo guarden antes del jueves 26.",
  },
];
