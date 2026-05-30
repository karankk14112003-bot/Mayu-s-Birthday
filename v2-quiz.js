/* =========================================================
   V2 QUIZ — "How well do you know us?"
   =========================================================

   Each entry is one question.

   - question:     the question text (handwritten font in UI)
   - options:      array of EXACTLY 4 answer choices
   - correctIndex: which option is correct (0, 1, 2, or 3)

   Rewrite these with REAL shared memories — the more
   specific and personal, the better the quiz feels.
   Save the file and refresh the page to see your changes.
*/

const QUIZ_QUESTIONS = [
  {
    question: "Where did the three of us first hang out together?",
    options: ["A cafe/restaurant", "Random event in school", "Karan/Udaya's House", "Just used to talk in group chat"],
    correctIndex: 2
  },
  {
    question: "What's Karan's go-to coffee/chai order?",
    options: ["Tea", "Black Coffee", "Filter Coffee", "He doesn't drink Coffee"],
    correctIndex: 2
  },
  {
    question: "Which of these is the most Udaya thing to say?",
    options: ["\"Will call you guys tomorrow\"", "\"Trust me, this'll be fun\"", "\"GANNNGEEEEEEYYYYYYY\"", "\"All of the above\""],
    correctIndex: 3
  },
  {
    question: "If we planned a surprise plan, where would we drag you?",
    options: ["Cream & Fudge", "BASK", "MCD", "All of the above"],
    correctIndex: 2
  },
  {
    question: "What's the one thing all three of us are guilty of?",
    options: ["Stalking EX's", "Saying \"we'll meet next week\" for months", "NONE OF THE ABOVE", "Taking 47 photos to pick one"],
    correctIndex: 2
  }
];
