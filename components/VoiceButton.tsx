"use client"

import { useEffect, useRef, useState } from "react"

type VoiceState = "idle" | "listening" | "error"

const SILENCE_MS = 2000

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  onstart: (() => void) | null
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition
}

function getSR(): ISpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null
  return (
    (window as unknown as { SpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition ??
    null
  )
}

interface VoiceButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export default function VoiceButton({ onTranscript, disabled }: VoiceButtonProps) {
  const [state, setState] = useState<VoiceState>("idle")
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!getSR()) setSupported(false)
  }, [])

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  function stopListening() {
    clearSilenceTimer()
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setState("idle")
  }

  function startListening() {
    if (state === "listening") {
      stopListening()
      return
    }

    const SR = getSR()
    if (!SR) {
      setState("error")
      return
    }

    const recognition = new SR()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true
    recognitionRef.current = recognition

    let finalTranscript = ""

    recognition.onstart = () => {
      setState("listening")
      finalTranscript = ""
    }

    recognition.onresult = (event) => {
      clearSilenceTimer()
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) {
          finalTranscript += res[0].transcript
        } else {
          interim += res[0].transcript
        }
      }

      silenceTimerRef.current = setTimeout(() => {
        const text = (finalTranscript + interim).trim()
        if (text) onTranscript(text)
        stopListening()
      }, SILENCE_MS)
    }

    recognition.onerror = (e) => {
      clearSilenceTimer()
      recognitionRef.current = null
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setState("error")
      } else {
        setState("idle")
      }
    }

    recognition.onend = () => {
      clearSilenceTimer()
      recognitionRef.current = null
      setState((prev) => (prev === "error" ? "error" : "idle"))
    }

    recognition.start()
  }

  if (!supported) return null

  if (state === "error") {
    return (
      <span className="text-xs px-2 whitespace-nowrap" style={{ color: "#fb7185" }}>
        Mic unavailable
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={disabled}
      aria-label={state === "listening" ? "Stop recording" : "Start voice input"}
      className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40"
      style={
        state === "listening"
          ? {
              background: "rgba(244, 63, 94, 0.2)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              boxShadow: "0 0 16px rgba(244, 63, 94, 0.3)",
            }
          : {
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }
      }
    >
      {state === "listening" ? (
        <span className="relative flex items-center justify-center">
          <span
            className="absolute w-7 h-7 rounded-full opacity-40"
            style={{
              background: "rgba(244, 63, 94, 0.5)",
              animation: "ping-soft 1s ease-out infinite",
            }}
          />
          <MicIcon className="w-4 h-4 relative z-10" style={{ color: "#fb7185" }} />
        </span>
      ) : (
        <MicIcon className="w-4 h-4" style={{ color: "rgba(139, 92, 246, 0.5)" }} />
      )}
    </button>
  )
}

function MicIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  )
}
