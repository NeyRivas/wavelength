/**
 * FAQ content + category metadata for /faq. Kept as plain data (no "use
 * client") so it can be imported by both the interactive accordion
 * (components/landing/faq-accordion.tsx) and, if needed later, any
 * server-rendered summary — the data itself has no interactivity.
 *
 * Each category gets one of the existing --wl-* tints (never a new
 * color) to color its expanded answers and active tab, matching the
 * reference's per-category highlight colors.
 */

export type FaqTint = "lavender" | "mint" | "blue" | "peach";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  label: string;
  tint: FaqTint;
  questions: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "about",
    label: "About Sameeeish",
    tint: "lavender",
    questions: [
      {
        question: "What is Sameeeish?",
        answer:
          "Sameeeish is a game for two people to discover where their answers line up — and where they don't. You create the questions, answer them yourself, and invite someone else to play.",
      },
      {
        question: "Is this a compatibility test?",
        answer:
          "Not exactly. It's not here to score how compatible you are — it's a way to discover what you already agree on, where your perspectives differ, and what might be fun to talk about.",
      },
      {
        question: "Can we use it if we're dating, getting to know each other, or already a couple?",
        answer:
          "Yes — it works at any stage. It's just as good for a first real conversation with someone new as it is for finding something new to talk about after years together.",
      },
    ],
  },
  {
    id: "how-it-works",
    label: "How it works",
    tint: "mint",
    questions: [
      {
        question: "How many questions do we need?",
        answer:
          "You can create between 5 and 12 questions. Choose the ones that feel interesting to you.",
      },
      {
        question: "Who answers the questions first?",
        answer:
          "The person creating the questionnaire answers first. Once the questions are ready, they can share the link with the other person.",
      },
      {
        question: "Do we answer separately?",
        answer:
          "Yes. You each answer the same questions on your own, without seeing the other person's answers first — that's what keeps the comparison honest.",
      },
      {
        question: "Can I change my questions after sharing?",
        answer:
          "Once you've shared your questionnaire, the questions and your answers are locked so the other person's answers stay genuine.",
      },
      {
        question: "Can more than two people play?",
        answer:
          "Sameeeish is designed for two people — one shared set of questions, two perspectives.",
      },
    ],
  },
  {
    id: "results",
    label: "Results",
    tint: "blue",
    questions: [
      {
        question: "What do the results mean?",
        answer:
          "Your result is based on how closely your answers line up. Some answers match completely, while others are simply different perspectives. The goal isn't a perfect score — it's to see where you're aligned and where you see things differently.",
      },
      {
        question: "What does our percentage mean?",
        answer:
          "Your percentage gives you a quick sense of how closely your answers aligned. The more interesting part is what sits behind the number: the questions you agreed on and the ones worth talking about.",
      },
      {
        question: "Can we see which questions were different?",
        answer:
          "Yes. Your results show where you're aligned and where your answers were different, so you can explore the conversation together.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & sharing",
    tint: "peach",
    questions: [
      {
        question: "Do we need to create an account?",
        answer:
          "No account is required to play. Just create your questions, answer them, and share the link.",
      },
      {
        question: "Is it free?",
        answer: "Yes, completely free — no account, no payment, no catch.",
      },
      {
        question: "How do I share it?",
        answer: "You'll get a private link you can share with the other person.",
      },
      {
        question: "Can someone else see our answers?",
        answer:
          "It's designed to be shared only with the person you invite. Keep your link private and only share it with the person you're playing with.",
      },
    ],
  },
];
