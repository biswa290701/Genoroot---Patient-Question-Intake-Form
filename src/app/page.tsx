"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createInitialIntake, toStructuredOutput, IntakeState, PRODUCT_ROWS, PROCEDURE_ROWS } from "@/lib/types";
import { validateIntake } from "@/lib/validation";

type StepId =
  | "welcome" | "gate"
  | "q1" | "q2" | "q3" | "q4"
  | "q5" | "q6" | "q7" | "q8q9"
  | "q10" | "q11" | "q12" | "q13" | "q14" | "q15" | "q16"
  | "review" | "done";

const STORAGE_KEY = "haiku-intake-v1";

const DURATIONS = ["Less than 6 months", "6-12 months", "Over a year"] as const;
const FAMILY = ["Father had hair loss", "Mother had hair loss", "Siblings with thinning or baldness", "No known family history"] as const;
const CONDITIONS = ["PCOS/PCOD", "Thyroid disorder", "Diabetes", "Autoimmune disease", "Anemia", "None"] as const;
const PAST6 = ["Crash dieting or major weight loss", "High stress or emotional trauma", "Fever with illness (COVID, Dengue, Typhoid)", "Recent surgery", "Change in location/water/air quality"] as const;

// Friendly pattern data — schema value stored, friendly label shown
const PATTERNS: { value: string; label: string; desc: string; svg: React.ReactNode }[] = [
  {
    value: "Receding hairline",
    label: "Hairline moving back",
    desc: "Temples or forehead higher than before",
    svg: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <circle cx="20" cy="20" r="16" fill="#FFF1E8" stroke="#E8D9C8" />
        <path d="M8 18 Q20 8 32 18" stroke="#1A1A18" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M12 18 L12 28 M28 18 L28 26" stroke="#1A1A18" strokeWidth="1.2" opacity="0.35" />
      </svg>
    ),
  },
  {
    value: "Thinning at crown",
    label: "Thinning on top",
    desc: "See-through area on crown",
    svg: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <circle cx="20" cy="20" r="16" fill="#FFF1E8" stroke="#E8D9C8" />
        <circle cx="20" cy="18" r="7" fill="white" stroke="#1A1A18" strokeWidth="1.4" />
        <circle cx="20" cy="18" r="2.5" fill="#C45A2A" opacity="0.9" />
      </svg>
    ),
  },
  {
    value: "Widening part line",
    label: "Wider parting",
    desc: "Part line looks broader",
    svg: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <circle cx="20" cy="20" r="16" fill="#FFF1E8" stroke="#E8D9C8" />
        <line x1="20" y1="8" x2="20" y2="32" stroke="#1A1A18" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="16" y1="10" x2="16" y2="30" stroke="#1A1A18" strokeWidth="1" opacity="0.25" />
        <line x1="24" y1="10" x2="24" y2="30" stroke="#1A1A18" strokeWidth="1" opacity="0.25" />
      </svg>
    ),
  },
  {
    value: "Diffuse thinning",
    label: "All-over thinning",
    desc: "Hair feels thinner everywhere",
    svg: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <circle cx="20" cy="20" r="16" fill="#FFF1E8" stroke="#E8D9C8" />
        <g fill="#1A1A18" opacity="0.55">
          <circle cx="14" cy="16" r="1.4" /><circle cx="20" cy="14" r="1.4" /><circle cx="26" cy="16" r="1.4" />
          <circle cx="15" cy="22" r="1.4" /><circle cx="21" cy="21" r="1.4" /><circle cx="26" cy="22" r="1.4" />
          <circle cx="18" cy="27" r="1.2" /><circle cx="23" cy="26" r="1.2" />
        </g>
      </svg>
    ),
  },
  {
    value: "Patchy loss",
    label: "Round patches",
    desc: "Distinct bald spots",
    svg: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <circle cx="20" cy="20" r="16" fill="#FFF1E8" stroke="#E8D9C8" />
        <ellipse cx="18" cy="17" rx="6" ry="5" fill="white" stroke="#1A1A18" strokeWidth="1.3" />
        <ellipse cx="24" cy="22" rx="4" ry="3.2" fill="white" stroke="#1A1A18" strokeWidth="1.1" opacity="0.9" />
      </svg>
    ),
  },
  {
    value: "Sudden excessive shedding",
    label: "Sudden shedding",
    desc: "Lots of hair falling recently",
    svg: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <circle cx="20" cy="20" r="16" fill="#FFF1E8" stroke="#E8D9C8" />
        <path d="M14 12 Q15 18 14 24 M20 10 Q21 18 20 26 M26 12 Q27 19 26 25" stroke="#1A1A18" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="14" cy="28" r="1.2" fill="#C45A2A" /><circle cx="20" cy="30" r="1.2" fill="#C45A2A" /><circle cx="26" cy="29" r="1.2" fill="#C45A2A" />
      </svg>
    ),
  },
];

function Chip({ selected, onClick, children, ariaLabel }: { selected: boolean; onClick: () => void; children: React.ReactNode; ariaLabel?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`w-full text-left px-5 py-4 rounded-2xl border text-[16px] leading-5 font-medium transition-all flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] focus-visible:ring-offset-1 ${
        selected
          ? "bg-[#1A1A18] text-white border-[#1A1A18] shadow-sm"
          : "bg-white border-[#E8E0D6] hover:border-[#C8B8A6] hover:bg-[#FFFCF8] text-[#1A1A18] active:scale-[0.99]"
      }`}
    >
      <span className="flex-1">{children}</span>
      {selected && (
        <span className="w-6 h-6 rounded-full bg-white text-[#1A1A18] grid place-items-center text-[12px] font-bold shrink-0" aria-hidden>
          ✓
        </span>
      )}
    </button>
  );
}

function YesNo({ value, onChange, label }: { value: boolean | null; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3" role="group" aria-label={label}>
      <button
        onClick={() => onChange(true)}
        aria-pressed={value === true}
        className={`py-4 rounded-2xl border font-semibold text-[17px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${
          value === true ? "bg-[#1A1A18] text-white border-[#1A1A18] shadow-sm" : "bg-white border-[#E8E0D6] hover:bg-[#FFFCF8]"
        }`}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        aria-pressed={value === false}
        className={`py-4 rounded-2xl border font-semibold text-[17px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${
          value === false ? "bg-[#1A1A18] text-white border-[#1A1A18] shadow-sm" : "bg-white border-[#E8E0D6] hover:bg-[#FFFCF8]"
        }`}
      >
        No
      </button>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold tracking-[0.12em] text-[#C45A2A]">{children}</div>;
}

function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mt-3 text-sm text-[#C45A2A] bg-[#FFF1E8] border border-[#E8D9C8] rounded-xl px-3 py-2">
      {children}
    </div>
  );
}

function humanProgress(step: StepId, applicability: string | null): string | null {
  if (step === "welcome" || step === "gate") return null;
  if (["q1", "q2", "q3", "q4"].includes(step)) {
    const pos = { q1: 1, q2: 2, q3: 3, q4: 4 }[step as string] ?? 1;
    return `Hair history · ${pos} of 4`;
  }
  if (["q5", "q6", "q7", "q8q9"].includes(step)) {
    const total = applicability === "applies" ? 4 : 2;
    let pos = 1;
    if (step === "q5") pos = 1;
    else if (step === "q6") pos = 2;
    else if (step === "q7") pos = 3;
    else if (step === "q8q9") pos = total;
    return `Health · ${pos} of ${total}`;
  }
  if (["q10", "q11"].includes(step)) return `Lifestyle · ${step === "q10" ? 1 : 2} of 2`;
  if (["q12", "q13", "q14"].includes(step)) {
    const pos = { q12: 1, q13: 2, q14: 3 }[step as string] ?? 1;
    return `Treatments · ${pos} of 3`;
  }
  if (["q15", "q16"].includes(step)) return `Sample & consent · ${step === "q15" ? 1 : 2} of 2`;
  if (step === "review") return "Review";
  if (step === "done") return "Complete";
  return null;
}

export default function Home() {
  const [intake, setIntake] = useState<IntakeState>(() => createInitialIntake());
  const [step, setStep] = useState<StepId>("welcome");
  const [loaded, setLoaded] = useState(false);
  const [showResumed, setShowResumed] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Q14 voice — browser-native Web Speech API only, no external LLM — diagnostic version
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceImpl, setVoiceImpl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceDebug, setVoiceDebug] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");
  const sessionFinalRef = useRef<string>("");
  const lastProcessedIndexRef = useRef<number>(-1);
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.intake && parsed.step && parsed.step !== "welcome") {
          setIntake(parsed.intake);
          setStep(parsed.step);
          setShowResumed(true);
          setTimeout(() => setShowResumed(false), 4000);
        }
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ intake, step }));
  }, [intake, step, loaded]);

  // detect Web Speech API support — log exact implementation for diagnostics
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasStandard = !!(window as any).SpeechRecognition;
      const hasWebkit = !!(window as any).webkitSpeechRecognition;
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const impl = hasStandard ? "SpeechRecognition" : hasWebkit ? "webkitSpeechRecognition" : "none";
      setVoiceSupported(!!SR);
      setVoiceImpl(impl);
      if (isDev) {
        console.log("[VOICE] API availability:", { hasStandard, hasWebkit, impl, supported: !!SR, isSecureContext: (window as any).isSecureContext, protocol: window.location.protocol, userAgent: navigator.userAgent });
        if (!SR) console.warn("[VOICE] No SpeechRecognition API found — this browser cannot do native voice");
      }
    }
  }, []);
  // cleanup on unmount only — do not abort on every render
  useEffect(() => {
    return () => {
      try {
        if (recognitionRef.current) {
          if (isDev) console.log("[VOICE] cleanup abort on unmount");
          recognitionRef.current?.abort?.();
        }
      } catch {}
    };
  }, []);
  useEffect(() => {
    // stop listening if user navigates away from Q14 — avoid orphaned recognition
    if (step !== "q14" && isListening) {
      if (isDev) console.log("[VOICE] leaving q14 while listening — stopping");
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      setIsListening(false);
    }
  }, [step, isListening]);

  function startVoice() {
    if (isDev) console.log("[VOICE] startVoice click — isListening:", isListening, "supported:", voiceSupported, "impl:", voiceImpl, "currentDescribe:", intake.past_treatment_side_effects_describe);
    if (isListening && recognitionRef.current) {
      if (isDev) console.warn("[VOICE] already listening — ignoring duplicate start, stopping previous");
      try { recognitionRef.current.stop(); } catch {}
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setVoiceError(null);
    setVoiceDebug(null);
    const SR = (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) as any;
    if (!SR) {
      const msg = "Voice input unavailable: no SpeechRecognition API in this browser";
      if (isDev) console.warn("[VOICE]", msg);
      setVoiceError("Voice input isn't available in this browser. You can type your answer instead.");
      setVoiceDebug(`DEV: ${msg} (impl=${voiceImpl})`);
      return;
    }
    if (typeof window !== "undefined" && !(window as any).isSecureContext) {
      if (isDev) console.warn("[VOICE] not a secure context — microphone may be blocked");
    }
    try {
      const rec: any = new SR();
      recognitionRef.current = rec;
      rec.lang = "en-IN";
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      // capture base text BEFORE session — ref-based to avoid stale state duplication
      baseTextRef.current = intake.past_treatment_side_effects_describe;
      sessionFinalRef.current = "";
      lastProcessedIndexRef.current = -1;
      if (isDev) console.log("[VOICE] created recognition", { impl: voiceImpl, lang: rec.lang, interimResults: rec.interimResults, continuous: rec.continuous, maxAlternatives: rec.maxAlternatives, baseText: baseTextRef.current });

      rec.onstart = () => {
        if (isDev) console.log("[VOICE] onstart — baseText:", baseTextRef.current);
        // reset session accumulators on every start (handles rapid taps)
        sessionFinalRef.current = "";
        lastProcessedIndexRef.current = -1;
        setIsListening(true);
        setVoiceDebug("DEV: onstart — listening");
      };
      rec.onaudiostart = () => { if (isDev) console.log("[VOICE] onaudiostart"); };
      rec.onsoundstart = () => { if (isDev) console.log("[VOICE] onsoundstart"); };
      rec.onspeechstart = () => { if (isDev) console.log("[VOICE] onspeechstart"); };
      rec.onspeechend = () => { if (isDev) console.log("[VOICE] onspeechend"); };
      rec.onsoundend = () => { if (isDev) console.log("[VOICE] onsoundend"); };
      rec.onaudioend = () => { if (isDev) console.log("[VOICE] onaudioend"); };
      rec.onend = () => {
        if (isDev) console.log("[VOICE] onend — sessionFinal:", sessionFinalRef.current, "baseText:", baseTextRef.current);
        setIsListening(false);
        // do NOT append again on onend — all finals already committed in onresult
      };
      rec.onerror = (e: any) => {
        const code: string = e?.error || "unknown";
        const message: string = e?.message || "";
        if (isDev) console.error("[VOICE] onerror", { code, message, event: e });
        setIsListening(false);
        setVoiceDebug(`DEV: Speech recognition error: ${code}${message ? ` — ${message}` : ""}`);
        if (code === "not-allowed" || code === "service-not-allowed") {
          setVoiceError("Microphone permission denied. Please allow microphone access and try again, or type your answer instead.");
        } else if (code === "audio-capture") {
          setVoiceError("No microphone found or audio input unavailable. You can type your answer instead.");
        } else if (code === "no-speech") {
          setVoiceError(null);
          setVoiceDebug((prev) => `${prev || ""} | no-speech — no speech detected, try again`);
        } else if (code === "network") {
          setVoiceError("Speech service unavailable (network). Please check connection or type your answer instead.");
        } else if (code === "aborted") {
          setVoiceError(null);
        } else if (code === "not-supported" || code === "language-not-supported") {
          setVoiceError("Voice input not supported for this language in this browser. You can type instead.");
        } else {
          setVoiceError("Voice input isn't available right now. You can type your answer instead.");
        }
      };
      rec.onresult = (event: any) => {
        if (isDev) console.log("[VOICE] onresult", { resultIndex: event.resultIndex, resultsLength: event.results.length, results: Array.from(event.results).map((r: any) => ({ transcript: r[0]?.transcript, isFinal: r.isFinal })) });
        // process each new result exactly once, only finals are committed
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (i <= lastProcessedIndexRef.current) {
            if (isDev) console.log("[VOICE] skip already processed index", i);
            continue;
          }
          const result = event.results[i];
          const transcript: string = result[0]?.transcript ?? "";
          const isFinal: boolean = result.isFinal;
          if (!isFinal) {
            if (isDev) console.log("[VOICE] interim", i, transcript);
            setVoiceDebug(`DEV: interim [${i}] "${transcript}"`);
            // NEVER commit interim to permanent state
            continue;
          }
          // final — commit exactly once
          lastProcessedIndexRef.current = i;
          const trimmed = transcript.trim();
          if (!trimmed) continue;
          if (isDev) console.log("[VOICE] final", i, trimmed);
          sessionFinalRef.current = sessionFinalRef.current ? sessionFinalRef.current + " " + trimmed : trimmed;
          const base = baseTextRef.current.trim();
          const combined = base ? base + " " + sessionFinalRef.current : sessionFinalRef.current;
          if (isDev) console.log("[VOICE] commit", { base, sessionFinal: sessionFinalRef.current, combined });
          setIntake((s) => ({ ...s, past_treatment_side_effects_describe: combined }));
          setVoiceDebug(`DEV: final [${i}] "${trimmed}" → committed`);
        }
      };
      rec.onnomatch = () => { if (isDev) console.log("[VOICE] onnomatch — no match"); };
      try {
        rec.start();
        if (isDev) console.log("[VOICE] rec.start() called synchronously from click");
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (isDev) console.error("[VOICE] rec.start() threw", { err, msg });
        if (msg.includes("already started") || err?.name === "InvalidStateError") {
          setVoiceError("Voice is already listening. Tap stop and try again.");
          setVoiceDebug(`DEV: start error — already started: ${msg}`);
        } else {
          setVoiceError("Voice input isn't available right now. You can type your answer instead.");
          setVoiceDebug(`DEV: start threw: ${msg}`);
        }
        setIsListening(false);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (isDev) console.error("[VOICE] constructor/start outer catch", { err, msg });
      setVoiceError("Voice input isn't available right now. You can type your answer instead.");
      setVoiceDebug(`DEV: outer catch — ${msg}`);
      setIsListening(false);
    }
  }
  function stopVoice() {
    if (isDev) console.log("[VOICE] stopVoice click — isListening:", isListening, "sessionFinal:", sessionFinalRef.current);
    try {
      recognitionRef.current?.stop?.();
      if (isDev) console.log("[VOICE] rec.stop() called");
    } catch (err: any) {
      if (isDev) console.error("[VOICE] stop threw", err);
    }
    setIsListening(false);
    // do not commit anything on stop — finals already committed via onresult
  }

  const steps: StepId[] = useMemo(() => {
    const base: StepId[] = ["welcome", "gate", "q1", "q2", "q3", "q4", "q5"];
    if (intake._applicability === "applies") base.push("q6", "q7");
    base.push("q8q9", "q10", "q11", "q12", "q13", "q14", "q15", "q16", "review", "done");
    return base;
  }, [intake._applicability]);

  const idx = steps.indexOf(step);
  const total = steps.length;
  const progressPct = total > 1 ? Math.round((idx / (total - 1)) * 100) : 0;
  const humanLabel = humanProgress(step, intake._applicability);

  function next() {
    if (!canContinue) {
      setAttemptedNext(true);
      return;
    }
    setAttemptedNext(false);
    const i = steps.indexOf(step);
    if (i < steps.length - 1) setStep(steps[i + 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    if (isEditMode) {
      handleEditBack();
      return;
    }
    setAttemptedNext(false);
    const i = steps.indexOf(step);
    if (i > 0) setStep(steps[i - 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function enterEdit(target: StepId) {
    setIsEditMode(true);
    setAttemptedNext(false);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function handleSaveEdit() {
    if (!canContinue) {
      setAttemptedNext(true);
      return;
    }
    setIsEditMode(false);
    setAttemptedNext(false);
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function handleEditBack() {
    setIsEditMode(false);
    setAttemptedNext(false);
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  useEffect(() => setAttemptedNext(false), [step]);

  function toggleExclusive<T extends string>(arr: T[], value: T, exclusive: T, setter: (v: T[]) => void) {
    if (value === exclusive) setter(arr.includes(exclusive) ? [] : [exclusive]);
    else {
      const n = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr.filter((v) => v !== exclusive), value];
      setter(n as T[]);
    }
  }

  const canContinue = useMemo(() => {
    switch (step) {
      case "welcome": return true;
      case "gate": return intake._applicability !== null;
      case "q1": return intake.age_hair_loss_began !== null && intake.age_hair_loss_began >= 1 && intake.age_hair_loss_began <= 80;
      case "q2": return intake.duration !== null;
      case "q3": return intake.family_history.length > 0;
      case "q4": return intake.pattern.length > 0;
      case "q5": return intake.diagnosed_conditions.length > 0;
      case "q6": return intake.menstrual_cycle !== null;
      case "q7": return intake.pregnancy_related !== null;
      case "q8q9": return intake.adult_acne_oily_skin !== null && intake.excess_body_facial_hair !== null;
      case "q10": return true;
      case "q11": return intake.habits.smoking !== null && intake.habits.alcohol !== null && intake.habits.hard_water !== null && intake.habits.hair_wash_frequency !== null && intake.habits.heating_tools_styling_chemicals !== null && intake.habits.salon_treatments !== null && (!intake.habits.smoking || intake.habits.smoking_severity !== null) && (!intake.habits.salon_treatments || intake.habits.salon_treatment_detail.trim().length > 0);
      case "q12": return Object.values(intake.products).every((v) => !v.used || (v.duration && v.helped !== null && v.side_effects !== null));
      case "q13": return Object.values(intake.procedures).every((v) => !v.done || (v.sessions && v.helped !== null));
      case "q14": return intake.past_treatment_side_effects !== null && (!intake.past_treatment_side_effects || intake.past_treatment_side_effects_describe.trim().length > 0);
      case "q15": return intake.sample_type !== null;
      case "q16": return intake.consent !== null;
      default: return true;
    }
  }, [step, intake]);

  const stepError: string | null = useMemo(() => {
    if (canContinue || !attemptedNext) return null;
    switch (step) {
      case "gate": return "Please choose one to continue.";
      case "q1": return "Please enter your age, e.g. 28 (1–80).";
      case "q2": return "Please choose one option.";
      case "q3": return "Please select at least one option.";
      case "q4": return "Please select at least one that looks like you.";
      case "q5": return "Please select at least one option.";
      case "q6": return "Please choose one option.";
      case "q7": return "Please choose one option.";
      case "q8q9": return "Please answer both questions.";
      case "q11": {
        if (intake.habits.smoking === null || intake.habits.alcohol === null || intake.habits.hard_water === null || intake.habits.hair_wash_frequency === null || intake.habits.heating_tools_styling_chemicals === null || intake.habits.salon_treatments === null) return "Please answer each question above.";
        if (intake.habits.smoking && !intake.habits.smoking_severity) return "Please tell us how much you smoke.";
        if (intake.habits.salon_treatments && !intake.habits.salon_treatment_detail.trim()) return "Please tell us which salon treatment.";
        return "Please complete all habit questions.";
      }
      case "q12": return "For each product marked Used, please add duration, whether it helped, and side effects.";
      case "q13": return "For each procedure marked Done, please add sessions and whether it helped.";
      case "q14": return intake.past_treatment_side_effects === null ? "Please choose Yes or No." : "Please tell us briefly what happened...";
      case "q15": return "Please choose a sample type.";
      case "q16": return "Please choose Yes or No to continue.";
      default: return "Please complete this step.";
    }
  }, [step, canContinue, attemptedNext, intake]);

  const structured = toStructuredOutput(intake);
  const validation = validateIntake(structured);
  const isValid = validation.success;

  function fillSample(female: boolean) {
    const base: IntakeState = {
      age_hair_loss_began: 28,
      duration: "Over a year",
      family_history: ["Father had hair loss"],
      pattern: ["Thinning at crown", "Receding hairline"],
      diagnosed_conditions: female ? ["PCOS/PCOD"] : ["None"],
      menstrual_cycle: female ? "Irregular" : "Not applicable",
      pregnancy_related: "Not applicable",
      adult_acne_oily_skin: true,
      excess_body_facial_hair: female ? true : false,
      past_6_months: ["High stress or emotional trauma"],
      habits: {
        smoking: false,
        smoking_severity: null,
        alcohol: false,
        hard_water: true,
        hair_wash_frequency: "Alternate Days",
        heating_tools_styling_chemicals: true,
        salon_treatments: true,
        salon_treatment_detail: "Keratin, 6 months ago",
      },
      products: {
        "OTC/Medicated Shampoos": { used: true, duration: "3-6mo", helped: false, side_effects: false },
        "Hair Oils/Serums": { used: true, duration: ">6mo", helped: true, side_effects: false },
        "Topical Minoxidil": { used: true, duration: "<3mo", helped: false, side_effects: true },
        "Oral Minoxidil": { used: false, duration: null, helped: null, side_effects: null },
        Supplements: { used: true, duration: "3-6mo", helped: true, side_effects: false },
      },
      procedures: {
        "PRP/GFC/iPRF": { done: true, sessions: "1-3", helped: false },
        "Stem Cells/Exosomes": { done: false, sessions: null, helped: null },
        "Hair Transplant": { done: false, sessions: null, helped: null },
        Other: { done: false, sessions: null, helped: null },
      },
      past_treatment_side_effects: true,
      past_treatment_side_effects_describe: "Mild scalp irritation with minoxidil",
      sample_type: "Saliva",
      consent: true,
      _applicability: female ? "applies" : "does_not_apply",
    };
    setIntake(base);
    setStep("review");
    setShowResumed(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-[#FFFCF8]/95 backdrop-blur border-b border-[#E8E0D6]">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#1A1A18] text-white grid place-items-center font-bold text-sm shrink-0">G</div>
            <div className="min-w-0">
              <div className="text-[13px] tracking-widest font-semibold leading-none">GENOROOT</div>
              <div className="text-[11px] text-[#6B6B68]">Hair & Scalp Intake</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {humanLabel && step !== "welcome" && step !== "done" && (
              <div className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-[#6B6B68] bg-white border border-[#E8E0D6] px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C45A2A]" aria-hidden />
                {humanLabel}
              </div>
            )}
            {step !== "welcome" && step !== "done" && (
              <div className="hidden sm:block text-xs text-[#6B6B68] tabular-nums">{progressPct}%</div>
            )}
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setIntake(createInitialIntake());
                setStep("welcome");
                setShowResumed(false);
              }}
              className="text-xs font-medium text-[#6B6B68] hover:text-[#1A1A18] underline underline-offset-2 px-2"
              aria-label="Reset intake"
            >
              Reset
            </button>
          </div>
        </div>
        {step !== "welcome" && (
          <div className="h-1 bg-[#E8E0D6]">
            <div className="h-1 bg-[#C45A2A] transition-all duration-300 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </header>

      {showResumed && step !== "welcome" && step !== "done" && (
        <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-white border border-[#E8D9C8] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="text-sm">
              <span className="font-semibold">Resumed your progress</span>
              <span className="text-[#6B6B68]"> — pick up where you left off</span>
            </div>
            <button onClick={() => setShowResumed(false)} className="text-xs font-medium px-3 py-1 rounded-full border bg-[#FFFCF8]" aria-label="Dismiss">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* mobile human progress — visible only on small screens */}
      {humanLabel && step !== "welcome" && step !== "done" && (
        <div className="sm:hidden max-w-[1040px] w-full mx-auto px-4 pt-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#6B6B68]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C45A2A]" /> {humanLabel}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1040px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.75fr] gap-8 items-start">
          <div className="min-w-0">
            {/* card transition wrapper */}
            <div key={step} className="animate-fadeInUp">
              {step === "welcome" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#C45A2A] bg-[#FFF1E8] px-3 py-1 rounded-full">
                    2 MIN · ONE TAP AT A TIME
                  </div>
                  <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight mt-4 tracking-tight">Hair & scalp check-in</h1>
                  <p className="text-[16px] text-[#6B6B68] mt-3 leading-6 max-w-[50ch]">
                    Simple taps, no long forms. Your doctor gets the full picture before you walk in. English or Hinglish — no account needed.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[14px] leading-5">
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#1A1A18] text-white grid place-items-center text-xs shrink-0">✓</span> One calm question at a time
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#1A1A18] text-white grid place-items-center text-xs shrink-0">✓</span> Big buttons, easy on phone
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#1A1A18] text-white grid place-items-center text-xs shrink-0">✓</span> Go back anytime — nothing is sent until you confirm
                    </li>
                  </ul>
                  <button
                    onClick={next}
                    className="mt-7 w-full py-4 rounded-2xl bg-[#1A1A18] text-white font-semibold text-[17px] hover:bg-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A]"
                  >
                    Start — 2 minutes
                  </button>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button onClick={() => fillSample(false)} className="py-3 rounded-2xl border border-[#E8E0D6] bg-white text-sm font-medium hover:bg-[#FFFCF8]">
                      Fill sample (male)
                    </button>
                    <button onClick={() => fillSample(true)} className="py-3 rounded-2xl border border-[#E8E0D6] bg-white text-sm font-medium hover:bg-[#FFFCF8]">
                      Fill sample (female)
                    </button>
                  </div>
                  <p className="text-xs text-[#6B6B68] mt-4 text-center">Made-up data only. Nothing is saved to a server. Progress stays on this device.</p>
                  {/* subtle resume on welcome if saved */}
                  {loaded && (() => {
                    try {
                      const raw = localStorage.getItem(STORAGE_KEY);
                      if (!raw) return null;
                      const p = JSON.parse(raw);
                      if (p.step && p.step !== "welcome" && p.step !== "done") {
                        return (
                          <div className="mt-4 p-3 rounded-2xl border border-[#E8D9C8] bg-[#FFFCF8] flex items-center justify-between gap-3">
                            <span className="text-sm font-medium">Resume your intake?</span>
                            <button onClick={() => setStep(p.step)} className="text-sm px-4 py-2 rounded-full bg-[#1A1A18] text-white font-medium">
                              Resume
                            </button>
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
                </div>
              )}

              {step === "gate" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>ABOUT YOU</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2 leading-tight">Do questions about periods or pregnancy apply to you?</h2>
                  <p className="text-[15px] text-[#6B6B68] mt-2 leading-6">They can affect hair loss, so we ask respectfully. If not, we will skip them — your form stays complete.</p>
                  <div className="mt-6 space-y-3">
                    <Chip selected={intake._applicability === "applies"} onClick={() => setIntake((s) => ({ ...s, _applicability: "applies" }))}>
                      Yes — show those questions
                    </Chip>
                    <Chip selected={intake._applicability === "does_not_apply"} onClick={() => setIntake((s) => ({ ...s, _applicability: "does_not_apply", menstrual_cycle: "Not applicable", pregnancy_related: "Not applicable" }))}>
                      No — skip them
                    </Chip>
                  </div>
                  <p className="text-xs text-[#6B6B68] mt-4">You can change this on the Review screen.</p>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q1" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Hair history · 1 of 4</SectionEyebrow>
                  <h2 className="text-[24px] sm:text-[26px] font-bold mt-2 leading-tight">When did you first notice hair loss?</h2>
                  <p className="text-[15px] text-[#6B6B68] mt-1.5">Your age at that time. Tap − / + or type directly.</p>
                  <div className="mt-6 flex items-center gap-3 sm:gap-4">
                    <button
                      aria-label="Decrease age"
                      onClick={() => setIntake((s) => ({ ...s, age_hair_loss_began: Math.max(1, (s.age_hair_loss_began ?? 25) - 1) }))}
                      className="w-16 h-16 rounded-2xl border bg-white text-2xl font-medium hover:bg-[#FFFCF8] active:scale-95 transition shrink-0"
                    >
                      −
                    </button>
                    <div className="flex-1 min-w-0">
                      <label htmlFor="age-input" className="sr-only">Age when hair loss began</label>
                      <input
                        id="age-input"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={80}
                        value={intake.age_hair_loss_began ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          if (v !== null && (Number.isNaN(v) || v < 0)) return;
                          setIntake((s) => ({ ...s, age_hair_loss_began: v }));
                        }}
                        placeholder="25"
                        className="w-full text-center text-[40px] font-bold py-4 rounded-2xl border-2 border-[#E8E0D6] bg-[#FFFCF8] focus:outline-none focus-visible:border-[#C45A2A] focus-visible:bg-white transition tabular-nums"
                      />
                      <div className="text-center text-xs font-medium tracking-wide text-[#6B6B68] mt-2">YEARS OLD</div>
                    </div>
                    <button
                      aria-label="Increase age"
                      onClick={() => setIntake((s) => ({ ...s, age_hair_loss_began: Math.min(80, (s.age_hair_loss_began ?? 25) + 1) }))}
                      className="w-16 h-16 rounded-2xl border bg-white text-2xl font-medium hover:bg-[#FFFCF8] active:scale-95 transition shrink-0"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {[18, 25, 30, 35, 45].map((n) => (
                      <button
                        key={n}
                        onClick={() => setIntake((s) => ({ ...s, age_hair_loss_began: n }))}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition min-h-0 ${intake.age_hair_loss_began === n ? "bg-[#1A1A18] text-white border-[#1A1A18]" : "bg-white border-[#E8E0D6] hover:bg-[#FFFCF8]"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q2" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Hair history · 2 of 4</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">How long has it been happening?</h2>
                  <div className="mt-6 space-y-3">
                    {DURATIONS.map((o) => (
                      <Chip key={o} selected={intake.duration === o} onClick={() => setIntake((s) => ({ ...s, duration: o as any }))}>
                        {o}
                      </Chip>
                    ))}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q3" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Hair history · 3 of 4 · Choose all that apply</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">Does hair loss run in your family?</h2>
                  <div className="mt-6 space-y-3">
                    {FAMILY.map((o) => (
                      <Chip
                        key={o}
                        selected={intake.family_history.includes(o as any)}
                        onClick={() => toggleExclusive(intake.family_history as any, o as any, "No known family history" as any, (v) => setIntake((s) => ({ ...s, family_history: v as any })))}
                      >
                        {o}
                      </Chip>
                    ))}
                  </div>
                  <p className="text-xs text-[#6B6B68] mt-3">Choosing “No known family history” clears the others — no need to explain.</p>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q4" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Hair history · 4 of 4 · Tap all that look like you</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">How would you describe your hair loss?</h2>
                  <p className="text-sm text-[#6B6B68] mt-1">No medical words needed — pick what you see.</p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PATTERNS.map((p) => {
                      const sel = intake.pattern.includes(p.value as any);
                      return (
                        <button
                          key={p.value}
                          onClick={() => setIntake((s) => ({ ...s, pattern: sel ? (s.pattern.filter((x) => x !== p.value) as any) : [...s.pattern, p.value] as any }))}
                          aria-pressed={sel}
                          className={`text-left p-4 rounded-2xl border flex gap-3 items-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${sel ? "bg-[#1A1A18] text-white border-[#1A1A18] shadow-sm" : "bg-white border-[#E8E0D6] hover:border-[#C8B8A6] hover:bg-[#FFFCF8]"}`}
                        >
                          <span className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 border ${sel ? "bg-white border-white" : "bg-white border-[#E8E0D6]"}`}>{p.svg}</span>
                          <span className="min-w-0">
                            <div className="font-semibold text-[15px] leading-tight">{p.label}</div>
                            <div className={`text-xs mt-1 leading-4 ${sel ? "text-white/80" : "text-[#6B6B68]"}`}>{p.desc}</div>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q5" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Health · 1 of {intake._applicability === "applies" ? 4 : 2}</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">Have you been diagnosed with any of these?</h2>
                  <div className="mt-6 space-y-3">
                    {CONDITIONS.map((o) => (
                      <Chip
                        key={o}
                        selected={intake.diagnosed_conditions.includes(o as any)}
                        onClick={() => toggleExclusive(intake.diagnosed_conditions as any, o as any, "None" as any, (v) => setIntake((s) => ({ ...s, diagnosed_conditions: v as any })))}
                      >
                        {o}
                      </Chip>
                    ))}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q6" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Health · 2 of 4</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">How is your menstrual cycle?</h2>
                  <div className="mt-6 space-y-3">
                    {(["Regular", "Irregular", "Menopausal", "Not applicable"] as const).map((o) => (
                      <Chip key={o} selected={intake.menstrual_cycle === o} onClick={() => setIntake((s) => ({ ...s, menstrual_cycle: o }))}>
                        {o}
                      </Chip>
                    ))}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q7" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Health · 3 of 4</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">Any pregnancy-related hair changes?</h2>
                  <div className="mt-6 space-y-3">
                    {(["Currently pregnant", "Postpartum <1 year", "Not applicable"] as const).map((o) => (
                      <Chip key={o} selected={intake.pregnancy_related === o} onClick={() => setIntake((s) => ({ ...s, pregnancy_related: o }))}>
                        {o}
                      </Chip>
                    ))}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q8q9" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Health · {intake._applicability === "applies" ? "4 of 4" : "2 of 2"}</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2 leading-tight">A couple of quick checks</h2>
                  <div className="mt-6 space-y-7">
                    <div>
                      <div className="font-semibold text-[15px]">Do you have acne or very oily skin as an adult?</div>
                      <div className="mt-3">
                        <YesNo value={intake.adult_acne_oily_skin} onChange={(v) => setIntake((s) => ({ ...s, adult_acne_oily_skin: v }))} label="Acne or oily skin" />
                      </div>
                    </div>
                    <div className="pt-5 border-t border-[#E8E0D6]">
                      <div className="font-semibold text-[15px]">Do you have excess body or facial hair growth?</div>
                      <div className="mt-3">
                        <YesNo value={intake.excess_body_facial_hair} onChange={(v) => setIntake((s) => ({ ...s, excess_body_facial_hair: v }))} label="Excess body or facial hair" />
                      </div>
                    </div>
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q10" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Lifestyle · 1 of 2 · Choose all that apply</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">In the past 6 months, have you had any of these?</h2>
                  <div className="mt-6 space-y-3">
                    {PAST6.map((o) => {
                      const sel = intake.past_6_months.includes(o as any);
                      return (
                        <Chip key={o} selected={sel} onClick={() => setIntake((s) => ({ ...s, past_6_months: sel ? (s.past_6_months.filter((x) => x !== o) as any) : [...s.past_6_months, o] as any }))}>
                          {o}
                        </Chip>
                      );
                    })}
                    <div className="pt-2">
                      <button
                        onClick={() => setIntake((s) => ({ ...s, past_6_months: [] }))}
                        aria-pressed={intake.past_6_months.length === 0}
                        className={`w-full py-4 rounded-2xl border text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${intake.past_6_months.length === 0 ? "bg-[#FFF1E8] border-[#C45A2A] text-[#C45A2A]" : "bg-white border-[#E8E0D6] hover:bg-[#FFFCF8]"}`}
                      >
                        None of these
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === "q11" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Lifestyle · 2 of 2</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">A bit about daily habits</h2>
                  <p className="text-sm text-[#6B6B68] mt-1">Short taps — details only appear when relevant.</p>
                  <div className="mt-6 space-y-4">
                    <div className={`p-4 sm:p-5 rounded-2xl border ${intake.habits.smoking !== null ? "bg-white border-[#E8E0D6]" : "bg-[#FFFCF8] border-[#E8E0D6]"}`}>
                      <div className="font-semibold text-[15px]">Do you smoke?</div>
                      <div className="mt-3">
                        <YesNo value={intake.habits.smoking} onChange={(v) => setIntake((s) => ({ ...s, habits: { ...s.habits, smoking: v, smoking_severity: v ? s.habits.smoking_severity : null } }))} label="Smoking" />
                      </div>
                      {intake.habits.smoking && (
                        <div className="mt-4 pt-4 border-t border-[#E8E0D6] animate-fadeInUp">
                          <div className="text-sm font-semibold">How much per day?</div>
                          <div className="mt-3 space-y-2.5">
                            {(["Mild <5/day", "Moderate 5-10/day", "Severe >10/day"] as const).map((o) => (
                              <Chip key={o} selected={intake.habits.smoking_severity === o} onClick={() => setIntake((s) => ({ ...s, habits: { ...s.habits, smoking_severity: o } }))}>
                                {o}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border bg-white border-[#E8E0D6]">
                      <div className="font-semibold text-[15px]">Do you drink alcohol?</div>
                      <div className="mt-3">
                        <YesNo value={intake.habits.alcohol} onChange={(v) => setIntake((s) => ({ ...s, habits: { ...s.habits, alcohol: v } }))} label="Alcohol" />
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border bg-white border-[#E8E0D6]">
                      <div className="font-semibold text-[15px]">Do you use hard water to wash hair?</div>
                      <div className="mt-3">
                        <YesNo value={intake.habits.hard_water} onChange={(v) => setIntake((s) => ({ ...s, habits: { ...s.habits, hard_water: v } }))} label="Hard water" />
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border bg-white border-[#E8E0D6]">
                      <div className="font-semibold text-[15px]">How often do you wash your hair?</div>
                      <div className="mt-3 space-y-2.5">
                        {(["Daily", "Alternate Days", "Weekly"] as const).map((o) => (
                          <Chip key={o} selected={intake.habits.hair_wash_frequency === o} onClick={() => setIntake((s) => ({ ...s, habits: { ...s.habits, hair_wash_frequency: o } }))}>
                            {o}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border bg-white border-[#E8E0D6]">
                      <div className="font-semibold text-[15px]">Do you use heating tools or styling chemicals?</div>
                      <div className="mt-3">
                        <YesNo value={intake.habits.heating_tools_styling_chemicals} onChange={(v) => setIntake((s) => ({ ...s, habits: { ...s.habits, heating_tools_styling_chemicals: v } }))} label="Heating tools" />
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border bg-white border-[#E8E0D6]">
                      <div className="font-semibold text-[15px]">Have you had salon treatments like keratin / rebonding / smoothening?</div>
                      <div className="mt-3">
                        <YesNo value={intake.habits.salon_treatments} onChange={(v) => setIntake((s) => ({ ...s, habits: { ...s.habits, salon_treatments: v, salon_treatment_detail: v ? s.habits.salon_treatment_detail : "" } }))} label="Salon treatments" />
                      </div>
                      {intake.habits.salon_treatments && (
                        <div className="mt-4 animate-fadeInUp">
                          <label htmlFor="salon-detail" className="text-sm font-medium">
                            Which one?
                          </label>
                          <input
                            id="salon-detail"
                            value={intake.habits.salon_treatment_detail}
                            onChange={(e) => setIntake((s) => ({ ...s, habits: { ...s.habits, salon_treatment_detail: e.target.value } }))}
                            placeholder="e.g. Keratin 3 months ago"
                            className="mt-2 w-full px-4 py-3.5 rounded-xl border border-[#E8E0D6] bg-[#FFFCF8] text-[15px] placeholder:text-[#9A9A98] focus:outline-none focus-visible:border-[#C45A2A] focus-visible:bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q12" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Treatments · 1 of 3</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">Which products have you used?</h2>
                  <p className="text-sm text-[#6B6B68] mt-1">Start with a simple Yes / No. We only ask details if you say Yes.</p>
                  <div className="mt-6 space-y-3">
                    {PRODUCT_ROWS.map((row) => {
                      const e = intake.products[row];
                      return (
                        <div key={row} className={`rounded-2xl border overflow-hidden transition ${e.used ? "bg-[#FFFCF8] border-[#C45A2A]/25" : "bg-white border-[#E8E0D6]"}`}>
                          <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                            <div className="font-semibold text-[15px] leading-tight pr-2">{row}</div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => setIntake((s) => ({ ...s, products: { ...s.products, [row]: { used: true, duration: s.products[row].duration, helped: s.products[row].helped, side_effects: s.products[row].side_effects } } }))}
                                aria-pressed={e.used}
                                className={`px-5 py-2 rounded-full border text-sm font-semibold min-h-0 transition focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${e.used ? "bg-[#1A1A18] text-white border-[#1A1A18]" : "bg-white border-[#E8E0D6]"}`}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setIntake((s) => ({ ...s, products: { ...s.products, [row]: { used: false, duration: null, helped: null, side_effects: null } } }))}
                                aria-pressed={!e.used}
                                className={`px-5 py-2 rounded-full border text-sm font-semibold min-h-0 transition focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${!e.used ? "bg-[#1A1A18] text-white border-[#1A1A18]" : "bg-white border-[#E8E0D6]"}`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {e.used && (
                            <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4 animate-fadeInUp border-t border-[#E8E0D6]/60 bg-[#FFFCF8]">
                              <div className="pt-4">
                                <div className="text-xs font-semibold tracking-wide text-[#6B6B68]">FOR HOW LONG?</div>
                                <div className="mt-2.5 grid grid-cols-3 gap-2">
                                  {(["<3mo", "3-6mo", ">6mo"] as const).map((o) => (
                                    <button
                                      key={o}
                                      onClick={() => setIntake((s) => ({ ...s, products: { ...s.products, [row]: { ...s.products[row], duration: o } } }))}
                                      aria-pressed={e.duration === o}
                                      className={`py-3 rounded-xl border text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${e.duration === o ? "bg-[#1A1A18] text-white border-[#1A1A18]" : "bg-white border-[#E8E0D6] hover:bg-white"}`}
                                    >
                                      {o}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs font-semibold tracking-wide text-[#6B6B68] mb-2">DID IT HELP?</div>
                                  <YesNo value={e.helped} onChange={(v) => setIntake((s) => ({ ...s, products: { ...s.products, [row]: { ...s.products[row], helped: v } } }))} label={`Did ${row} help`} />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold tracking-wide text-[#6B6B68] mb-2">SIDE EFFECTS?</div>
                                  <YesNo value={e.side_effects} onChange={(v) => setIntake((s) => ({ ...s, products: { ...s.products, [row]: { ...s.products[row], side_effects: v } } }))} label={`Side effects ${row}`} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q13" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Treatments · 2 of 3</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">Any in-clinic procedures?</h2>
                  <p className="text-sm text-[#6B6B68] mt-1">Again, Yes / No first — details only if needed.</p>
                  <div className="mt-6 space-y-3">
                    {PROCEDURE_ROWS.map((row) => {
                      const e = intake.procedures[row];
                      return (
                        <div key={row} className={`rounded-2xl border overflow-hidden transition ${e.done ? "bg-[#FFFCF8] border-[#C45A2A]/25" : "bg-white border-[#E8E0D6]"}`}>
                          <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                            <div className="font-semibold text-[15px]">{row}</div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => setIntake((s) => ({ ...s, procedures: { ...s.procedures, [row]: { done: true, sessions: s.procedures[row].sessions, helped: s.procedures[row].helped } } }))}
                                aria-pressed={e.done}
                                className={`px-5 py-2 rounded-full border text-sm font-semibold min-h-0 ${e.done ? "bg-[#1A1A18] text-white border-[#1A1A18]" : "bg-white border-[#E8E0D6]"}`}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setIntake((s) => ({ ...s, procedures: { ...s.procedures, [row]: { done: false, sessions: null, helped: null } } }))}
                                aria-pressed={!e.done}
                                className={`px-5 py-2 rounded-full border text-sm font-semibold min-h-0 ${!e.done ? "bg-[#1A1A18] text-white border-[#1A1A18]" : "bg-white border-[#E8E0D6]"}`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {e.done && (
                            <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4 animate-fadeInUp border-t border-[#E8E0D6]/60 bg-[#FFFCF8]">
                              <div className="pt-4">
                                <div className="text-xs font-semibold tracking-wide text-[#6B6B68]">HOW MANY SESSIONS?</div>
                                <div className="mt-2.5 grid grid-cols-3 gap-2">
                                  {(["1-3", "4-6", ">6"] as const).map((o) => (
                                    <button
                                      key={o}
                                      onClick={() => setIntake((s) => ({ ...s, procedures: { ...s.procedures, [row]: { ...s.procedures[row], sessions: o } } }))}
                                      aria-pressed={e.sessions === o}
                                      className={`py-3 rounded-xl border text-sm font-medium ${e.sessions === o ? "bg-[#1A1A18] text-white border-[#1A1A18]" : "bg-white border-[#E8E0D6]"}`}
                                    >
                                      {o}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold tracking-wide text-[#6B6B68] mb-2">DID IT HELP?</div>
                                <YesNo value={e.helped} onChange={(v) => setIntake((s) => ({ ...s, procedures: { ...s.procedures, [row]: { ...s.procedures[row], helped: v } } }))} label={`Did ${row} help`} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q14" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Treatments · 3 of 3</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">Any side effects or poor response to past treatment?</h2>
                  <div className="mt-5">
                    <YesNo value={intake.past_treatment_side_effects} onChange={(v) => { setVoiceError(null); setIsListening(false); try{ recognitionRef.current?.abort?.(); }catch{} setIntake((s) => ({ ...s, past_treatment_side_effects: v, past_treatment_side_effects_describe: v ? s.past_treatment_side_effects_describe : "" })); }} label="Side effects past treatment" />
                  </div>
                  {intake.past_treatment_side_effects && (
                    <div className="mt-5 animate-fadeInUp">
                      <label htmlFor="side-desc" className="text-sm font-semibold">
                        Tell us briefly what happened...
                      </label>
                      <p className="text-xs text-[#6B6B68] mt-1">No need for medical terms — just in your own words. You can type or speak.</p>
                      <textarea
                        id="side-desc"
                        value={intake.past_treatment_side_effects_describe}
                        onChange={(e) => { setVoiceError(null); setIntake((s) => ({ ...s, past_treatment_side_effects_describe: e.target.value })); }}
                        placeholder="Tell us briefly what happened..."
                        rows={3}
                        aria-label="Describe side effects or poor response"
                        className="mt-2 w-full px-4 py-3.5 rounded-xl border border-[#E8E0D6] bg-[#FFFCF8] text-[15px] placeholder:text-[#9A9A98] focus:outline-none focus-visible:border-[#C45A2A] focus-visible:bg-white"
                      />
                      {/* Voice — optional convenience, secondary, never auto-submits */}
                      {voiceSupported ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={isListening ? stopVoice : startVoice}
                            aria-pressed={isListening}
                            aria-label={isListening ? "Stop listening" : "Speak instead — dictation for side effects description"}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] focus-visible:ring-offset-1 ${isListening ? "bg-[#C45A2A] text-white border-[#C45A2A] shadow-sm" : "bg-white border-[#E8E0D6] hover:bg-[#FFFCF8] text-[#1A1A18]"}`}
                          >
                            <span aria-hidden className={isListening ? "animate-pulse" : ""}>{isListening ? "🔴" : "🎙"}</span>
                            {isListening ? "Listening... Tap to stop" : intake.past_treatment_side_effects_describe ? "🎙 Speak again" : "🎙 Speak instead"}
                          </button>
                          {isListening && (
                            <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#C45A2A]" aria-live="polite">
                              <span className="w-2 h-2 rounded-full bg-[#C45A2A] animate-pulse" aria-hidden />
                              Listening…
                            </span>
                          )}
                          <p className="text-xs text-[#6B6B68] mt-2">After speaking, you can edit the text before continuing. Nothing is submitted automatically.</p>
                        </div>
                      ) : (
                        // gracefully no voice UI — typing remains fully functional
                        <p className="text-xs text-[#6B6B68] mt-2">Tip: you can type freely — voice is optional.</p>
                      )}
                      {voiceError && <InlineError>{voiceError}</InlineError>}
                    </div>
                  )}
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q15" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Sample & consent · 1 of 2</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2">Preferred sample type</h2>
                  <p className="text-sm text-[#6B6B68] mt-1">For the genetic analysis — choose what works for you.</p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["Saliva", "Blood", "Either"] as const).map((o) => (
                      <button
                        key={o}
                        onClick={() => setIntake((s) => ({ ...s, sample_type: o }))}
                        aria-pressed={intake.sample_type === o}
                        className={`p-6 rounded-2xl border text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${intake.sample_type === o ? "bg-[#1A1A18] text-white border-[#1A1A18] shadow-sm" : "bg-white border-[#E8E0D6] hover:bg-[#FFFCF8]"}`}
                      >
                        <div className="text-2xl" aria-hidden>
                          {o === "Saliva" ? "🧪" : o === "Blood" ? "🩸" : "⇄"}
                        </div>
                        <div className="font-semibold mt-2">{o}</div>
                        <div className={`text-xs mt-1 ${intake.sample_type === o ? "text-white/70" : "text-[#6B6B68]"}`}>{o === "Either" ? "No preference" : o === "Saliva" ? "Non-invasive" : "Clinic draw"}</div>
                      </button>
                    ))}
                  </div>
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "q16" && (
                <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                  <SectionEyebrow>Sample & consent · 2 of 2</SectionEyebrow>
                  <h2 className="text-[24px] font-bold mt-2 leading-tight">Consent to sample collection and genetic analysis</h2>
                  <p className="text-[15px] text-[#6B6B68] mt-2 leading-6">We will collect the sample you chose and run the hair-loss genetic analysis. You can say No and still finish — it will be saved as consent: false.</p>
                  <div className="mt-6">
                    <YesNo value={intake.consent} onChange={(v) => setIntake((s) => ({ ...s, consent: v }))} label="Consent" />
                  </div>
                  {intake.consent === false && (
                    <div className="mt-4 p-3.5 rounded-xl bg-[#FFF1E8] border border-[#E8D9C8] text-sm leading-5 animate-fadeInUp">Noted — saved as <b>consent: false</b>. No sample will be collected. You can still submit.</div>
                  )}
                  {stepError && <InlineError>{stepError}</InlineError>}
                </div>
              )}

              {step === "review" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                    <h2 className="text-[24px] sm:text-[26px] font-bold tracking-tight">Review your answers</h2>
                    <p className="text-sm text-[#6B6B68] mt-1">Quick check — tap Edit to change anything.</p>
                    <div className="mt-6 space-y-4">
                      {[
                        {
                          title: "A · Personal & Family Hair Loss History",
                          rows: [
                            { label: "Age when hair loss began", value: intake.age_hair_loss_began ? `${intake.age_hair_loss_began} years` : "—", target: "q1" as StepId, aria: "Change age when hair loss began" },
                            { label: "Duration", value: intake.duration ?? "—", target: "q2" as StepId, aria: "Change duration" },
                            { label: "Family history", value: intake.family_history.join(", ") || "—", target: "q3" as StepId, aria: "Change family history" },
                            { label: "Pattern", value: intake.pattern.join(", ") || "—", target: "q4" as StepId, aria: "Change hair loss pattern" },
                          ],
                        },
                        {
                          title: "B · Hormonal & Health Influences",
                          rows: [
                            { label: "Diagnosed conditions", value: intake.diagnosed_conditions.join(", ") || "—", target: "q5" as StepId, aria: "Change diagnosed conditions" },
                            { label: "Menstrual cycle", value: intake._applicability === "does_not_apply" ? "Not applicable (skipped)" : intake.menstrual_cycle ?? "—", target: (intake._applicability === "does_not_apply" ? "gate" : "q6") as StepId, aria: "Change menstrual cycle" },
                            { label: "Pregnancy-related", value: intake._applicability === "does_not_apply" ? "Not applicable (skipped)" : intake.pregnancy_related ?? "—", target: (intake._applicability === "does_not_apply" ? "gate" : "q7") as StepId, aria: "Change pregnancy-related hair loss" },
                            { label: "Acne or oily skin", value: intake.adult_acne_oily_skin === null ? "—" : intake.adult_acne_oily_skin ? "Yes" : "No", target: "q8q9" as StepId, aria: "Change acne or oily skin" },
                            { label: "Excess body / facial hair", value: intake.excess_body_facial_hair === null ? "—" : intake.excess_body_facial_hair ? "Yes" : "No", target: "q8q9" as StepId, aria: "Change excess hair growth" },
                          ],
                        },
                        {
                          title: "C · Lifestyle & Environmental Triggers",
                          rows: [
                            { label: "Past 6 months", value: intake.past_6_months.join(", ") || "None", target: "q10" as StepId, aria: "Change past 6 months triggers" },
                            { label: "Smoking", value: intake.habits.smoking === null ? "—" : intake.habits.smoking ? `Yes${intake.habits.smoking_severity ? ` · ${intake.habits.smoking_severity}` : ""}` : "No", target: "q11" as StepId, aria: "Change smoking" },
                            { label: "Alcohol", value: intake.habits.alcohol === null ? "—" : intake.habits.alcohol ? "Yes" : "No", target: "q11" as StepId, aria: "Change alcohol" },
                            { label: "Hard water", value: intake.habits.hard_water === null ? "—" : intake.habits.hard_water ? "Yes" : "No", target: "q11" as StepId, aria: "Change hard water" },
                            { label: "Hair wash frequency", value: intake.habits.hair_wash_frequency ?? "—", target: "q11" as StepId, aria: "Change hair wash frequency" },
                            { label: "Heating tools / styling chemicals", value: intake.habits.heating_tools_styling_chemicals === null ? "—" : intake.habits.heating_tools_styling_chemicals ? "Yes" : "No", target: "q11" as StepId, aria: "Change heating tools" },
                            { label: "Salon treatments", value: intake.habits.salon_treatments === null ? "—" : intake.habits.salon_treatments ? `Yes${intake.habits.salon_treatment_detail ? ` · ${intake.habits.salon_treatment_detail}` : ""}` : "No", target: "q11" as StepId, aria: "Change salon treatments" },
                          ],
                        },
                        {
                          title: "D · Current Hair Care & Treatments",
                          rows: [
                            ...PRODUCT_ROWS.map((r) => {
                              const e = intake.products[r];
                              return { label: r, value: e.used ? `Used · ${e.duration ?? "—"} · helped: ${e.helped === null ? "—" : e.helped ? "Yes" : "No"} · side effects: ${e.side_effects === null ? "—" : e.side_effects ? "Yes" : "No"}` : "Not used", target: "q12" as StepId, aria: `Change ${r}` };
                            }),
                            ...PROCEDURE_ROWS.map((r) => {
                              const e = intake.procedures[r];
                              return { label: r, value: e.done ? `Done · ${e.sessions ?? "—"} · helped: ${e.helped === null ? "—" : e.helped ? "Yes" : "No"}` : "Not done", target: "q13" as StepId, aria: `Change ${r}` };
                            }),
                            { label: "Side effects / poor response", value: intake.past_treatment_side_effects === null ? "—" : intake.past_treatment_side_effects ? `Yes · ${intake.past_treatment_side_effects_describe || "—"}` : "No", target: "q14" as StepId, aria: "Change side effects" },
                          ],
                        },
                        {
                          title: "E · Sample Collection & Consent",
                          rows: [
                            { label: "Sample type", value: intake.sample_type ?? "—", target: "q15" as StepId, aria: "Change sample type" },
                            { label: "Consent", value: intake.consent === null ? "—" : intake.consent ? "Yes" : "No", target: "q16" as StepId, aria: "Change consent" },
                          ],
                        },
                      ].map((sec) => (
                        <div key={sec.title} className="rounded-2xl border border-[#E8E0D6] bg-[#FFFCF8] overflow-hidden">
                          <div className="px-4 sm:px-5 py-3 bg-white border-b border-[#E8E0D6]">
                            <div className="font-bold text-sm tracking-wide">{sec.title}</div>
                          </div>
                          <ul className="divide-y divide-[#E8E0D6]/60">
                            {sec.rows.map((row: any) => (
                              <li key={row.label} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-[#6B6B68]">{row.label}</div>
                                  <div className="text-sm font-medium text-[#1A1A18] break-words mt-0.5">{row.value}</div>
                                </div>
                                <button onClick={() => enterEdit(row.target)} aria-label={row.aria} className="shrink-0 text-xs font-semibold px-4 py-2.5 rounded-full border bg-white hover:bg-[#FFFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] min-h-[44px] min-w-[72px]">
                                  Change
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-5 p-3.5 rounded-xl border text-sm leading-5 ${isValid ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                      {isValid ? "✓ All intake information captured" : "Please complete the missing answers above."}
                    </div>

                    <button
                      onClick={() => isValid && setStep("done")}
                      disabled={!isValid}
                      className={`mt-4 w-full py-4 rounded-2xl font-semibold text-[17px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${isValid ? "bg-[#1A1A18] text-white hover:bg-black" : "bg-zinc-200 text-zinc-500 cursor-not-allowed"}`}
                    >
                      {isValid ? "Confirm & view structured output" : "Complete missing answers above"}
                    </button>
                  </div>

                  <details className="mt-6 rounded-2xl border border-[#E8E0D6] bg-[#FFFCF8] p-4">
                    <summary className="text-sm font-medium cursor-pointer list-none flex items-center justify-between">
                      <span>View structured data</span>
                      <span className="text-xs text-[#6B6B68]">▾</span>
                    </summary>
                    <pre className="mt-3 p-3 rounded-xl bg-[#1A1A18] text-white text-[11px] leading-4 overflow-auto max-h-[220px]">{JSON.stringify(structured, null, 2)}</pre>
                    <div className="mt-3 flex gap-3">
                      <button onClick={() => navigator.clipboard.writeText(JSON.stringify(structured, null, 2))} className="flex-1 py-2.5 rounded-xl border bg-white text-sm font-medium min-h-0">
                        Copy JSON
                      </button>
                      <button onClick={() => { const blob = new Blob([JSON.stringify(structured, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "intake.json"; a.click(); URL.revokeObjectURL(url); }} className="flex-1 py-2.5 rounded-xl border bg-white text-sm font-medium min-h-0">
                        Download JSON
                      </button>
                    </div>
                  </details>
                </div>
              )}

              {step === "done" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 sm:p-8 shadow-sm">
                    <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 grid place-items-center text-xl" aria-hidden>
                      ✓
                    </div>
                    <h2 className="text-[26px] sm:text-[28px] font-bold mt-4 tracking-tight">You&apos;re all set.</h2>
                    <p className="text-[15px] text-[#6B6B68] mt-2 leading-6">Your answers are saved for your consultation. The doctor will have the full picture before you walk in. No further action needed.</p>

                    <details className="mt-6 rounded-2xl border border-[#E8E0D6] bg-[#FFFCF8] p-4">
                      <summary className="text-sm font-medium cursor-pointer list-none flex items-center justify-between">
                        <span>View structured data</span>
                        <span className="text-xs text-[#6B6B68]">▾</span>
                      </summary>
                      <pre className="mt-3 p-4 rounded-xl bg-[#1A1A18] text-white text-[11px] sm:text-xs leading-4 overflow-auto max-h-[360px]">{JSON.stringify(structured, null, 2)}</pre>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(structured, null, 2))} className="py-3 rounded-xl border bg-white text-sm font-medium hover:bg-[#FFFCF8]">
                          Copy JSON
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(structured, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "intake.json";
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="py-3 rounded-xl border bg-white text-sm font-medium hover:bg-[#FFFCF8]"
                        >
                          Download JSON
                        </button>
                      </div>
                    </details>
                    <button onClick={() => setStep("review")} className="mt-3 w-full py-3 rounded-xl bg-white border border-[#E8E0D6] text-sm font-medium">
                      Back to review
                    </button>
                  </div>

                  <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-6 shadow-sm">
                    <h3 className="font-bold">What you told us</h3>
                    <div className="mt-3 text-sm leading-6 text-[#6B6B68] space-y-2">
                      <p>
                        <b className="text-[#1A1A18]">A</b> Began at {String(structured.age_hair_loss_began)} · {String(structured.duration)} · Family: {structured.family_history.join(", ")} · Pattern: {structured.pattern.join(", ")}
                      </p>
                      <p>
                        <b className="text-[#1A1A18]">B</b> Conditions: {structured.diagnosed_conditions.join(", ")} · Cycle: {String(structured.menstrual_cycle)} · Pregnancy: {String(structured.pregnancy_related)} · Acne: {String(structured.adult_acne_oily_skin)} · Excess hair: {String(structured.excess_body_facial_hair)}
                      </p>
                      <p>
                        <b className="text-[#1A1A18]">C</b> Past 6 mo: {structured.past_6_months.length ? structured.past_6_months.join(", ") : "None"} · Smoking: {String(structured.habits.smoking)} {structured.habits.smoking_severity ? `(${structured.habits.smoking_severity})` : ""} · Wash: {String(structured.habits.hair_wash_frequency)} · Salon: {String(structured.habits.salon_treatments)} {structured.habits.salon_treatment_detail ? `— ${structured.habits.salon_treatment_detail}` : ""}
                      </p>
                      <p>
                        <b className="text-[#1A1A18]">D</b> Products & procedures captured per your taps · Side effects: {String(structured.past_treatment_side_effects)} {structured.past_treatment_side_effects_describe ? `— ${structured.past_treatment_side_effects_describe}` : ""}
                      </p>
                      <p>
                        <b className="text-[#1A1A18]">E</b> Sample {String(structured.sample_type)} · Consent {String(structured.consent)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem(STORAGE_KEY);
                        setIntake(createInitialIntake());
                        setStep("welcome");
                      }}
                      className="mt-5 text-sm underline underline-offset-2 text-[#6B6B68]"
                    >
                      Start a new intake
                    </button>
                  </div>
                </div>
              )}

              {/* Sticky Continue/Back — edit mode returns directly to Review */}
              {step !== "welcome" && step !== "done" && (
                <>
                  {isEditMode && step !== "review" ? (
                    <div className="mt-6 flex gap-3 sticky bottom-4 z-10 bg-[#FFFCF8]/90 backdrop-blur supports-[backdrop-filter]:bg-[#FFFCF8]/75 p-2 rounded-2xl border border-[#E8E0D6] shadow-sm">
                      <button onClick={handleEditBack} className="flex-1 py-4 rounded-xl border bg-white font-semibold hover:bg-[#FFFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A]">
                        Back to review
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        aria-disabled={!canContinue}
                        className={`flex-1 py-4 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${canContinue ? "bg-[#1A1A18] text-white hover:bg-black shadow-sm" : "bg-zinc-200 text-zinc-500"}`}
                      >
                        Save changes
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 flex gap-3 sticky bottom-4 z-10 bg-[#FFFCF8]/90 backdrop-blur supports-[backdrop-filter]:bg-[#FFFCF8]/75 p-2 rounded-2xl border border-[#E8E0D6] shadow-sm">
                      <button onClick={back} className="flex-1 py-4 rounded-xl border bg-white font-semibold hover:bg-[#FFFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A]">
                        Back
                      </button>
                      {step !== "review" && (
                        <button
                          onClick={next}
                          aria-disabled={!canContinue}
                          className={`flex-1 py-4 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${canContinue ? "bg-[#1A1A18] text-white hover:bg-black shadow-sm" : "bg-zinc-200 text-zinc-500"}`}
                        >
                          Continue
                        </button>
                      )}
                      {step === "review" && isValid && (
                        <button onClick={() => setStep("done")} className="flex-1 py-4 rounded-xl font-semibold bg-[#1A1A18] text-white hover:bg-black">
                          Done
                        </button>
                      )}
                    </div>
                  )}
                  {stepError && <div className="sr-only" role="alert">{stepError}</div>}
                  {isEditMode && stepError && <div role="alert" className="mt-3 text-sm text-[#C45A2A] bg-[#FFF1E8] border border-[#E8D9C8] rounded-xl px-3 py-2">{stepError}</div>}
                </>
              )}
            </div>
          </div>

          {/* Desktop aside */}
          <div className="hidden lg:block">
            <div className="sticky top-[72px] space-y-4">
              <div className="bg-white rounded-[24px] border border-[#E8E0D6] p-5 shadow-sm">
                <div className="text-[11px] font-semibold tracking-[0.12em] text-[#C45A2A]">PROGRESS</div>
                <div className="mt-2 text-sm font-medium">{humanLabel ?? "Getting started"}</div>
                <div className="text-xs text-[#6B6B68] tabular-nums">{idx} of {total - 1} · {progressPct}%</div>
                <div className="mt-3 h-2 bg-[#E8E0D6] rounded-full overflow-hidden">
                  <div className="h-2 bg-[#C45A2A] transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="mt-4 space-y-2.5 text-xs">
                  {[
                    { id: "Hair history", done: intake.age_hair_loss_began !== null && intake.duration !== null && intake.family_history.length > 0 && intake.pattern.length > 0 },
                    { id: "Health", done: intake.diagnosed_conditions.length > 0 && (intake._applicability === "does_not_apply" || (intake.menstrual_cycle !== null && intake.pregnancy_related !== null)) && intake.adult_acne_oily_skin !== null && intake.excess_body_facial_hair !== null },
                    { id: "Lifestyle", done: intake.habits.smoking !== null && intake.habits.alcohol !== null && intake.habits.hard_water !== null && intake.habits.hair_wash_frequency !== null },
                    { id: "Treatments", done: intake.past_treatment_side_effects !== null },
                    { id: "Sample & consent", done: intake.sample_type !== null && intake.consent !== null },
                  ].map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full grid place-items-center text-[11px] font-bold shrink-0 ${s.done ? "bg-green-100 text-green-700 border border-green-200" : "bg-zinc-100 text-zinc-400 border border-zinc-200"}`}>{s.done ? "✓" : "·"}</span>
                      <span className={s.done ? "text-[#1A1A18] font-medium" : "text-[#6B6B68]"}>{s.id}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-[#6B6B68]">You can go back at any time. Progress is saved on this device.</div>
              </div>

              {isDev && (
                <div className="bg-[#1A1A18] text-white rounded-[24px] p-5 shadow-sm">
                  <div className="text-[11px] tracking-[0.12em] opacity-70">VALIDATION (dev)</div>
                  <div className={`mt-2 text-sm font-medium ${isValid ? "text-green-300" : "text-amber-300"}`}>{isValid ? "✓ Schema compliant" : "Incomplete — keep going"}</div>
                  <div className="text-xs opacity-60 mt-1">Source of truth: intake-schema.json</div>
                  {step === "review" || step === "done" ? (
                    <pre className="mt-3 p-3 rounded-xl bg-white/10 text-[10px] leading-3 overflow-auto max-h-[220px] border border-white/10">{JSON.stringify(structured, null, 2)}</pre>
                  ) : (
                    <div className="text-xs opacity-60 mt-2 leading-4">A live JSON preview appears on Review — kept secondary, not the patient experience.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#6B6B68] py-6 px-4">GenoRoot · No login · No data saved · Made-up patients only · progress saved locally</footer>
    </div>
  );
}
