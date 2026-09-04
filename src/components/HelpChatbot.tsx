"use client";
import { useEffect, useRef, useState } from "react";
import { getContextualSuggestion, getHelpResponse, QUICK_ACTIONS } from "@/lib/help-content";

type Msg = { role: "user" | "assistant"; text: string };

export default function HelpChatbot({ currentStep }: { currentStep: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi — I can help you use this intake. Ask about a question, or try a suggestion below. I can’t give medical advice." },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const contextual = getContextualSuggestion(currentStep);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [open, messages]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { role: "user", text: trimmed };
    const reply = getHelpResponse(trimmed, currentStep);
    const assistantMsg: Msg = { role: "assistant", text: reply };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
  }

  function handleQuick(query: string) {
    send(query);
  }

  return (
    <>
      {/* Floating button — does not cover sticky Continue/Back (bottom-20 on mobile, bottom-6 on desktop) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close help chat" : "Open help chat"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-[#E8E0D6] shadow-lg text-sm font-semibold text-[#1A1A18] hover:bg-[#FFFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
      >
        <span aria-hidden className="w-6 h-6 rounded-full bg-[#1A1A18] text-white grid place-items-center text-[12px]">?</span>
        Need help?
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
          className="fixed z-40 bg-white rounded-[24px] border border-[#E8E0D6] shadow-xl flex flex-col overflow-hidden
                     left-4 right-4 bottom-36 sm:bottom-20 sm:left-auto sm:right-6 sm:w-[380px] max-h-[65vh] sm:max-h-[520px]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E8E0D6] bg-[#FFFCF8] flex items-start justify-between gap-3">
            <div>
              <h2 id="help-title" className="text-[15px] font-bold leading-tight">Need help?</h2>
              <p className="text-xs text-[#6B6B68] mt-0.5">I can help you understand this intake.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help panel"
              className="w-9 h-9 grid place-items-center rounded-full border border-[#E8E0D6] bg-white hover:bg-[#FFFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] shrink-0 min-h-[44px] min-w-[44px]"
            >
              ✕
            </button>
          </div>

          {/* Suggested chips */}
          <div className="px-4 py-3 border-b border-[#E8E0D6]/60 bg-white">
            {contextual && (
              <div className="mb-2">
                <div className="text-[11px] font-semibold tracking-wide text-[#C45A2A]">FOR THIS QUESTION</div>
                <button
                  type="button"
                  onClick={() => handleQuick(contextual.query)}
                  className="mt-1 w-full text-left px-3 py-2.5 rounded-xl border border-[#E8D9C8] bg-[#FFF1E8] text-sm font-medium hover:bg-[#FFE9D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] min-h-[44px]"
                >
                  {contextual.label}
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.query}
                  type="button"
                  onClick={() => handleQuick(a.query)}
                  className="px-3 py-2 rounded-full border border-[#E8E0D6] bg-white text-xs font-medium hover:bg-[#FFFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] min-h-[44px]"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} role="log" aria-live="polite" className="flex-1 overflow-auto px-4 py-3 space-y-3 bg-[#FFFCF8]/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-5 break-words ${
                    m.role === "user"
                      ? "bg-[#1A1A18] text-white rounded-br-md"
                      : "bg-white border border-[#E8E0D6] text-[#1A1A18] rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-[#E8E0D6] bg-white flex gap-2"
          >
            <label htmlFor="help-input" className="sr-only">Ask a question about the intake</label>
            <input
              id="help-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this intake…"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-[#E8E0D6] bg-white text-[14px] placeholder:text-[#9A9A98] focus:outline-none focus-visible:border-[#C45A2A] min-h-[44px]"
            />
            <button
              type="submit"
              aria-label="Send question"
              disabled={!input.trim()}
              className={`px-5 py-3 rounded-xl text-sm font-semibold min-h-[44px] min-w-[72px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45A2A] ${input.trim() ? "bg-[#1A1A18] text-white hover:bg-black" : "bg-zinc-200 text-zinc-500 cursor-not-allowed"}`}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
