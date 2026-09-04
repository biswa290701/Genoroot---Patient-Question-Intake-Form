// Help chatbot — local FAQ/intent matching, no LLM, no medical advice
// Reuses WHY_ASKING copy from intake for contextual help, but kept here to avoid coupling to page.tsx

export const WHY_HELP: Record<string, string> = {
  q3: "Hair loss can sometimes run in families, so this helps us understand your hair loss history.",
  q5: "Some health conditions can be relevant when understanding changes in hair growth or shedding.",
  q6: "This can help the clinic understand hormonal factors that may be relevant to your hair and scalp concerns.",
  q7: "Pregnancy and the period after giving birth can be associated with changes in hair shedding.",
  q8: "This can provide additional context about your skin and scalp.",
  q9: "This helps the clinic understand whether you have noticed other changes that may be relevant to your hair concerns.",
  q10: "Recent changes such as major stress, illness, weight loss, or environmental changes can provide useful context about changes in hair shedding.",
  q11: "These details help the clinic understand your everyday hair and lifestyle habits.",
  q12: "Knowing what you currently use helps the clinic understand your treatment history and what you've already tried.",
  q13: "This helps the clinic understand previous procedures and treatments you've received.",
  q14: "Knowing what happened with previous treatments helps the clinic understand your treatment history.",
  q15: "This tells the clinic which type of sample you would be comfortable providing.",
  q16: "We ask for your consent before collecting a sample for genetic analysis.",
};

export const QUICK_ACTIONS: { label: string; query: string }[] = [
  { label: "What is this intake?", query: "What is this intake?" },
  { label: "Why are you asking this?", query: "Why are you asking this?" },
  { label: "I don't understand a question", query: "I don't understand a question" },
  { label: "Can I change an answer?", query: "Can I change an answer?" },
  { label: "What happens to my answers?", query: "What happens to my answers?" },
];

export function getContextualSuggestion(step: string): { label: string; query: string } | null {
  const map: Record<string, { label: string; query: string }> = {
    q3: { label: "Why are you asking about family history?", query: "Why are you asking about family history?" },
    q5: { label: "Why are you asking about health conditions?", query: "Why are you asking about health conditions?" },
    q6: { label: "Why are you asking about menstrual cycle?", query: "Why are you asking about menstrual cycle?" },
    q7: { label: "Why are you asking about pregnancy?", query: "Why are you asking about pregnancy?" },
    q8q9: { label: "Why are you asking about skin and hair?", query: "Why are you asking about skin and hair?" },
    q10: { label: "Why are you asking about recent changes?", query: "Why are you asking about recent changes?" },
    q11: { label: "Why are you asking about habits?", query: "Why are you asking about habits?" },
    q12: { label: "Why are you asking about products?", query: "Why are you asking about products?" },
    q13: { label: "Why are you asking about procedures?", query: "Why are you asking about procedures?" },
    q14: { label: "Why are you asking about side effects?", query: "Why are you asking about side effects?" },
    q15: { label: "Why are you asking about sample type?", query: "Why are you asking about sample type?" },
    q16: { label: "Why do I need to give consent?", query: "Why do I need to give consent?" },
  };
  return map[step] ?? null;
}

const MEDICAL_BOUNDARY =
  "I can't provide medical diagnosis, treatment recommendations, or interpret your answers. Your clinician will review your intake and discuss next steps with you. If you have a medical concern, please ask the clinic directly.";

const UNKNOWN_FALLBACK =
  "I'm not sure I can answer that. I can help explain the intake and its questions, but I can't provide medical advice.";

function isMedicalQuery(q: string): boolean {
  const medicalKeywords = [
    "alopecia",
    "diagnose",
    "diagnosis",
    "do i have",
    "what condition",
    "what disease",
    "should i take",
    "should i use",
    "minoxidil",
    "finasteride",
    "treatment should",
    "recommend treatment",
    "recommend medication",
    "prescribe",
    "cure",
    "which treatment",
    "interpret my",
    "what does my answer mean",
    "do i need treatment",
  ];
  return medicalKeywords.some((k) => q.includes(k));
}

type Faq = { keywords: string[]; response: string };

const FAQS: Faq[] = [
  {
    keywords: ["what is this intake", "what is intake", "what is this form", "how does intake work", "how intake works", "how does this work"],
    response:
      "This is a short hair and scalp intake. You’ll answer one question at a time — mostly taps, a few short typed answers. Your progress is saved on this device while you complete it, and you can review everything before finishing.",
  },
  {
    keywords: ["why are you asking about family history", "family history why"],
    response: WHY_HELP.q3,
  },
  {
    keywords: ["why are you asking about health conditions", "health conditions why", "diagnosed conditions why"],
    response: WHY_HELP.q5,
  },
  {
    keywords: ["menstrual cycle why", "why menstrual", "periods why"],
    response: WHY_HELP.q6,
  },
  {
    keywords: ["pregnancy why", "pregnant why", "pregnancy-related why"],
    response: WHY_HELP.q7,
  },
  {
    keywords: ["skin and hair why", "acne why", "oily skin why", "excess hair why"],
    response: "For skin and hair questions: " + WHY_HELP.q8 + " " + WHY_HELP.q9,
  },
  {
    keywords: ["why are you asking about acne", "acne oily skin why"],
    response: WHY_HELP.q8,
  },
  {
    keywords: ["why excess hair", "excess body hair why"],
    response: WHY_HELP.q9,
  },
  {
    keywords: ["why are you asking about recent changes", "recent changes why", "stress illness why"],
    response: WHY_HELP.q10,
  },
  {
    keywords: ["why are you asking about habits", "habits why", "smoking why", "hard water why"],
    response: WHY_HELP.q11,
  },
  {
    keywords: ["why are you asking about products", "products why", "minoxidil why products"],
    response: WHY_HELP.q12,
  },
  {
    keywords: ["why are you asking about procedures", "procedures why", "prp why"],
    response: WHY_HELP.q13,
  },
  {
    keywords: ["why are you asking about side effects", "side effects why", "poor response why"],
    response: WHY_HELP.q14,
  },
  {
    keywords: ["why are you asking about sample type", "sample type why", "saliva blood why"],
    response: WHY_HELP.q15,
  },
  {
    keywords: ["why do i need to give consent", "consent why", "why consent"],
    response: WHY_HELP.q16,
  },
  {
    keywords: ["why are you asking this", "why asking this", "why this question", "why ask this"],
    response:
      "Each question helps the clinic understand your hair and scalp history so the doctor has the full picture before you arrive. Where you see “Why are we asking?” you’ll get a one-line explanation for that specific question.",
  },
  {
    keywords: ["don't understand", "dont understand", "confused", "what does this mean", "explain this question", "help understand question"],
    response:
      "You can use the “Why are we asking?” option where available for a short explanation. You can also tell me which question you’re on and I’ll explain what it’s asking.",
  },
  {
    keywords: ["can i change", "change an answer", "change answer", "edit answer", "go back", "correct answer", "change something"],
    response:
      "Yes. You can review your answers before completing the intake. You can also use the Change option next to any answer on the Review screen to return directly to that specific question without going through the entire intake again.",
  },
  {
    keywords: ["what happens to my answers", "what happens to answers", "where do answers go", "what happens after", "what happens at the end", "what happens when i finish"],
    response:
      "Your answers are collected in the structured intake format required by the clinic. This prototype keeps your progress locally in your browser while you complete the intake. You can view the structured data on the Review and completion screens.",
  },
  {
    keywords: ["how to navigate", "how to complete", "how to finish", "how to go next", "how to continue", "stuck"],
    response:
      "Answer the current question, then tap Continue. You can tap Back at any time. On mobile the Continue/Back controls stay at the bottom. When you reach Review you can edit any answer with Change, then Confirm to see the completion screen.",
  },
];

export function getHelpResponse(input: string, currentStep: string): string {
  const q = input.toLowerCase().trim();
  if (!q) return UNKNOWN_FALLBACK;

  if (isMedicalQuery(q)) return MEDICAL_BOUNDARY;

  // direct FAQ match
  for (const faq of FAQS) {
    if (faq.keywords.some((k) => q.includes(k))) {
      return faq.response;
    }
  }

  // generic why on current step
  if (q.includes("why") && (q.includes("asking") || q.includes("ask"))) {
    const ctx = WHY_HELP[currentStep as keyof typeof WHY_HELP];
    if (ctx) return ctx;
    // q8q9 special: map to q8
    if (currentStep === "q8q9") return WHY_HELP.q8 + " " + WHY_HELP.q9;
    return "Each question helps the clinic understand your history. Look for “Why are we asking?” on that question for a one-line explanation.";
  }

  return UNKNOWN_FALLBACK;
}
