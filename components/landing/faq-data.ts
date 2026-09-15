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
    label: "About Wavelength",
    tint: "lavender",
    questions: [
      {
        question: "What is Wavelength?",
        answer:
          "Wavelength is a game for two people to discover where their answers line up — and where they don't. You create the questions, answer them yourself, and invite someone else to play.",
      },
      {
        question: "Is Wavelength a compatibility test?",
        answer:
          "Not exactly. Wavelength isn't here to tell you whether you're compatible. It's a way to discover what you already agree on, where your perspectives differ, and what might be fun to talk about.",
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
          "The person creating the wavelength answers first. Once the questions are ready, they can share the link with the other person.",
      },
      {
        question: "Can I change my questions after sharing?",
        answer:
          "Once your wavelength has been shared, the questions and your answers are locked so the other person's answers stay genuine.",
      },
      {
        question: "Can more than two people play?",
        answer:
          "Wavelength is designed for two people — one shared set of questions, two perspectives.",
      },
    ],
  },
  {
    id: "results",
    label: "Results",
    tint: "blue",
    questions: [
      {
        question: "How is our score calculated?",
        answer:
          "Your result is based on how closely your answers line up. Some answers match completely, while others are simply different perspectives. The goal isn't to get a perfect score — it's to see where you're aligned and where you're on different wavelengths.",
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
          "No account is required to play. Just create your questions, answer them, and share your wavelength.",
      },
      {
        question: "How do I share my wavelength?",
        answer: "Wavelength gives you a private link you can share with the other person.",
      },
      {
        question: "Can someone else see our answers?",
        answer:
          "Your wavelength is designed to be shared only with the person you invite. Keep your link private and only share it with the person you're playing with.",
      },
    ],
  },
];
