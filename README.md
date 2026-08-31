# GenoRoot Hair & Scalp Intake

A patient-facing hair and scalp intake experience designed to make a 16-question medical intake feel less like filling out a form and more like having a guided conversation.

**Live Demo:** [Vercel](https://genoroot-omega.vercel.app/)

---

## The Problem

Traditional medical intake forms can feel long, repetitive, and difficult to complete, especially when they contain dense tables or questions that require medical terminology.

The goal of this project was to take the required 16-question hair and scalp intake and turn it into a patient-friendly experience that:

- Works well on mobile and desktop
- Requires minimal explanation
- Uses the right interaction for each type of question
- Reveals follow-up questions only when relevant
- Preserves the exact structured output required by the provided schema
- Allows patients to review and correct their answers easily

The patient experience was treated as the primary product requirement rather than simply building a form around the schema.

---

## Key Product Decisions

### 1. Different questions use different interactions

I did not treat all 16 questions as generic form fields.

Examples:

- Age uses a large number input with +/- controls.
- Single-choice questions use large selectable cards.
- Multi-select questions use chips.
- Hair-loss patterns use visual cards rather than relying only on clinical terminology.
- Yes/No questions use large touch-friendly controls.
- Free-text questions provide a normal textarea with optional voice input.

The goal was to make the correct action obvious without requiring instructions.

---

### 2. Progressive disclosure for complex questions

Questions 11–13 originally contain dense table-like structures.

Instead of showing all possible fields at once, the interface progressively reveals relevant follow-ups.

For example:

**Do you smoke?**

→ Yes

**How much?**

→ Mild / Moderate / Severe

Similarly, treatment and procedure details are only shown when the patient indicates that they have used or undergone them.

This reduces cognitive load and prevents the patient from being overwhelmed by irrelevant fields.

---

### 3. Optional "Why are we asking?" explanations

Some questions may feel personal or unclear to a patient.

For selected questions, the patient can optionally expand:

> **Why are we asking?**

The explanation is short and contextual rather than presenting medical education or making a diagnosis.

The patient can completely ignore these explanations and continue through the normal flow.

---

### 4. Voice input where it actually reduces friction

I intentionally did not build an AI chatbot for the entire intake.

For the open-ended treatment side-effect question, speaking can be easier than typing, so Q14 includes optional browser-native speech recognition.

The flow is:

**Speak → Speech-to-text → Patient reviews/edits → Continue**

The transcription never automatically submits and is never medically interpreted.

I chose the browser-native Web Speech API instead of adding an external speech-to-text or LLM service because this use case only requires transcription. This keeps the implementation lightweight, avoids API keys and external data transfer, and provides a graceful typing fallback on unsupported browsers.

---

### 5. Direct answer editing

On the review screen, patients can change an individual answer without navigating backwards through the entire intake.

The flow is:

**Review → Change answer → Specific question → Save → Review**

This is particularly useful for a long intake because correcting one mistake should not require repeating unrelated questions.

---

## Technical Architecture

### Stack

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Zod**
- **Browser Web Speech API**
- **localStorage**
- **Vercel**

---

## If I Had Another Week

### 1. Make the intake more adaptive

I would make the intake more context-aware, using information the patient has already provided to make later questions feel more connected and less repetitive.

The system would still require the patient to confirm any information rather than making medical inferences.

### 2. Improve the visual hair-loss interaction

I would experiment with a more interactive scalp/head visualization for the hair-loss pattern question.

Instead of selecting from cards alone, patients could tap the areas where they have noticed hair loss, while the interaction continues to map cleanly to the required schema values.

### 3. Add privacy-conscious product analytics

For a production version, I would measure where patients abandon the intake, how long they spend on each question, where validation errors occur, and how often answers are edited.

This would help determine whether the UX decisions actually reduce friction rather than relying only on subjective testing.

---

### Architecture

The application is intentionally lightweight.

```text
Patient
   │
   ▼
Guided Intake UI
   │
   ▼
React Intake State
   │
   ├── Conditional question logic
   ├── Validation
   └── Local persistence
   │
   ▼
Structured Output
   │
   ▼
Schema Validation
   │
   ▼
Review / Completion