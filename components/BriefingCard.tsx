"use client"

import { useCallback, useEffect, useState } from "react"
import { speak, stopSpeaking, initVoices } from "@/lib/tts"

type PlayState = "idle" | "playing"

export default function BriefingCard({ briefing }: { briefing: string }) {
  const [playState, setPlayState] = useState<PlayState>("idle")
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false)
      return
    }
    initVoices()
    const handleVoices = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener("voiceschanged", handleVoices)
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoices)
      stopSpeaking()
    }
  }, [])

  const play = useCallback(() => {
    if (playState === "playing") {
      stopSpeaking()
      setPlayState("idle")
      return
    }

    setPlayState("playing")
    speak(briefing).then(() => setPlayState("idle"))
  }, [briefing, playState])

  return (
    <div
      className="rounded-2xl p-4 mb-6 animate-slide-up delay-100"
      style={{
        background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.05))",
        border: "1px solid rgba(249, 115, 22, 0.2)",
        boxShadow: "0 0 24px rgba(249, 115, 22, 0.06)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: "rgba(249, 115, 22, 0.2)" }}
        >
          <svg className="w-3 h-3" style={{ color: "#fb923c" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider flex-1" style={{ color: "#fb923c" }}>
          Today&apos;s Briefing
        </p>

        {supported && (
          <button
            type="button"
            onClick={play}
            aria-label={playState === "playing" ? "Stop reading" : "Read briefing aloud"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: playState === "playing"
                ? "rgba(244, 63, 94, 0.15)"
                : "rgba(249, 115, 22, 0.12)",
              border: playState === "playing"
                ? "1px solid rgba(244, 63, 94, 0.3)"
                : "1px solid rgba(249, 115, 22, 0.2)",
              color: playState === "playing" ? "#fb7185" : "#fb923c",
            }}
          >
            {playState === "playing" ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                Read aloud
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#431407" }}>
        {briefing}
      </p>
    </div>
  )
}
