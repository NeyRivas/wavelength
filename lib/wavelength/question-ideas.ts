/**
 * Extra question ideas shown on three experience pages, for people who want
 * to ask out loud (in person, on a call, in the group chat) rather than play.
 * They are editorial content only: no game uses them, and each game still
 * plays its own 12 questions from ready-made-games.ts, which
 * tests/unit/protected-content.test.ts keeps unchanged. None of them repeats
 * a question from the game on the same page (tests/unit/question-ideas.test.ts).
 */
export interface QuestionIdeaGroup {
  title: string;
  questions: string[];
}

/** /play/friends/how-well-do-you-know-me: about "me", in the first person. */
export const HOW_WELL_DO_YOU_KNOW_ME_IDEAS: QuestionIdeaGroup[] = [
  {
    title: "Favorites & taste",
    questions: [
      "What's my go-to order at a coffee shop?",
      "What's my comfort movie or show?",
      "What food could I eat every day without getting bored?",
      "What's my favorite season, and why?",
      "What's the last thing I'd ever eat, even if I were starving?",
      "What would I pick for a perfect weekend breakfast?",
      "What's my favorite way to spend a rainy day?",
      "Which app do I open first in the morning?",
      "What's a smell I love that most people find weird?",
      "What's my dream travel destination?",
    ],
  },
  {
    title: "Habits & quirks",
    questions: [
      "Am I a morning person or a night owl?",
      "What's the first thing I do when I get home?",
      "How long does it take me to reply to a text, honestly?",
      "What do I always forget when I leave the house?",
      "What's my most-used emoji?",
      "What do I do when I can't fall asleep?",
      "Am I always early, on time, or a little late?",
      "What's my go-to karaoke song?",
      "What do I do when I'm stressed?",
      "What's something I'm weirdly picky about?",
    ],
  },
  {
    title: "My story",
    questions: [
      "What did I want to be when I grew up?",
      "What was my favorite subject in school?",
      "What's the best gift I've ever received?",
      "What's my most-told childhood story?",
      "Where would I live if I could move anywhere?",
      "What's the best concert or event I've ever been to?",
      "Who was my first celebrity crush?",
      "What's a skill I'm secretly proud of?",
      "What's the hardest thing I've ever learned to do?",
      "What's my favorite family tradition?",
    ],
  },
  {
    title: "What would I do if…",
    questions: [
      "What would I do with an unexpected day off?",
      "What would I buy first if I won the lottery?",
      "What superpower would I choose?",
      "Which decade would I time-travel to?",
      "What would I bring to a desert island?",
      "How would I react to a surprise party?",
      "What would my perfect birthday look like?",
      "What would I name a pet?",
      "Which reality show would I be great on?",
      "If I had to eat one cuisine forever, which one would it be?",
    ],
  },
];

/** /play/friends/friendship-test: about "us" and the memories you share. */
export const FRIENDSHIP_TRIVIA_IDEAS: QuestionIdeaGroup[] = [
  {
    title: "Our beginnings",
    questions: [
      "What was the first thing you thought when you met me?",
      "When did we realize we were actually friends?",
      "What was the first photo we ever took together?",
      "What was the first message one of us sent the other?",
      "Who made the first plan to hang out?",
      "What did we have in common right away?",
      "What did we disagree about when we first met?",
      "What was our first “regular” place to meet?",
      "What's the first gift we ever gave each other?",
      "When did we first stay up talking way too late?",
    ],
  },
  {
    title: "Our adventures",
    questions: [
      "What's the best trip we've ever taken together?",
      "What's the longest we've ever gone without talking?",
      "What's a concert, show, or event we went to together?",
      "What's the best meal we've ever shared?",
      "Which plan of ours went completely wrong?",
      "What's the latest we've ever stayed out together?",
      "What's a challenge or bet we made each other?",
      "Where did we get lost together?",
      "What's a game we always end up playing?",
      "Which holiday or birthday together stands out the most?",
    ],
  },
  {
    title: "Our details",
    questions: [
      "What's “our song”?",
      "What's our go-to snack or drink together?",
      "Who's usually late when we meet?",
      "Who's the planner, and who just shows up?",
      "What do we always end up talking about?",
      "Which movie or show did we watch together the most?",
      "What's a nickname we have for each other?",
      "Who gives the better advice?",
      "What's something we've promised to do together one day?",
      "What would we be famous for as a duo?",
    ],
  },
];

/** /play/dating-couples/getting-to-know-each-other-questions: to ask "you". */
export const GETTING_TO_KNOW_YOU_IDEAS: QuestionIdeaGroup[] = [
  {
    title: "Easy first-date questions",
    questions: [
      "What's keeping you busy these days?",
      "What's the best thing that happened to you this week?",
      "How do you usually spend your weekends?",
      "What's a hobby you've picked up recently?",
      "What's the last show you couldn't stop watching?",
      "What's your favorite place in your city?",
      "Are you more of a planner or a go-with-the-flow person?",
      "What's your favorite way to unwind after a long day?",
      "What's the best meal you've had recently?",
      "Do you have any pets, or want one someday?",
    ],
  },
  {
    title: "Fun questions",
    questions: [
      "What's your most unpopular food opinion?",
      "What's a talent most people don't know you have?",
      "What's the most spontaneous thing you've ever done?",
      "Which fictional world would you live in?",
      "What's your go-to fun fact about yourself?",
      "What's a song you know every word to?",
      "What's the weirdest job you've ever had or wanted?",
      "If you had a theme song, what would it be?",
      "What's something you're terrible at but enjoy anyway?",
      "What's your favorite board game or card game?",
    ],
  },
  {
    title: "Would you rather",
    questions: [
      "Would you rather travel to the past or to the future?",
      "Would you rather live by the beach or in the mountains?",
      "Would you rather have a quiet night in or a big night out?",
      "Would you rather be able to speak every language or play every instrument?",
      "Would you rather plan a trip down to the minute or book it the night before?",
      "Would you rather cook dinner or always order in?",
      "Would you rather read the book or watch the movie?",
      "Would you rather have breakfast for dinner or dinner for breakfast?",
      "Would you rather explore a new city or return to a favorite place?",
      "Would you rather spend a day with no phone or no music?",
    ],
  },
  {
    title: "A little deeper",
    questions: [
      "What's something you're proud of that you don't talk about much?",
      "What does a really good day look like for you?",
      "Who do you go to when you need advice?",
      "What's a lesson you learned the hard way?",
      "What's something that always makes you laugh?",
      "What's a small thing someone can do that means a lot to you?",
      "What do you value most in a friendship?",
      "What's something you're looking forward to right now?",
      "What's a book, film, or song that changed how you see things?",
      "When do you feel most like yourself?",
    ],
  },
  {
    title: "Values & the future",
    questions: [
      "What's something you'd like to learn in the next year?",
      "Where do you see yourself living in five years?",
      "What does home mean to you?",
      "What's on your bucket list?",
      "What's a tradition you'd like to start someday?",
      "How do you like to celebrate good news?",
      "What's a cause or idea you care about?",
      "What's the best advice you've ever been given?",
      "What would your ideal weekend look like a few years from now?",
      "What's something you hope never changes about you?",
    ],
  },
];

export function countIdeas(groups: QuestionIdeaGroup[]): number {
  return groups.reduce((total, group) => total + group.questions.length, 0);
}
