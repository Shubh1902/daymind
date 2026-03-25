"use client"

import { useEffect, useRef, useState, useCallback } from "react"

type OrbState = "idle" | "listening" | "processing" | "error"

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

export default function VoiceOrb({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void
  disabled?: boolean
}) {
  const [state, setState] = useState<OrbState>("idle")
  const [supported, setSupported] = useState(true)
  const [interim, setInterim] = useState("")
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!getSR()) setSupported(false)
  }, [])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const stopListening = useCallback(() => {
    clearSilenceTimer()
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setState("idle")
    setInterim("")
  }, [clearSilenceTimer])

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
      setInterim("")
    }

    recognition.onresult = (event) => {
      clearSilenceTimer()
      let interimText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) {
          finalTranscript += res[0].transcript
        } else {
          interimText += res[0].transcript
        }
      }

      setInterim(finalTranscript + interimText)

      silenceTimerRef.current = setTimeout(() => {
        const text = (finalTranscript + interimText).trim()
        if (text) {
          setState("processing")
          setInterim("")
          onTranscript(text)
          setTimeout(() => setState("idle"), 600)
        }
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
      setInterim("")
    }

    recognition.onend = () => {
      clearSilenceTimer()
      recognitionRef.current = null
      setInterim("")
      setState((prev) => (prev === "error" ? "error" : prev === "processing" ? "processing" : "idle"))
    }

    recognition.start()
  }

  if (!supported) return null

  return (
    <div className="voice-orb-container">
      {/* Interim transcript bubble */}
      {interim && (
        <div className="voice-orb-transcript animate-fade-in">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(236, 253, 245, 0.9)" }}>
            {interim}
          </p>
        </div>
      )}

      {/* Listening hint */}
      {state === "listening" && !interim && (
        <p
          className="text-xs text-center mb-3 animate-fade-in"
          style={{ color: "rgba(16, 185, 129, 0.6)" }}
        >
          Listening...
        </p>
      )}

      {state === "error" && (
        <p
          className="text-xs text-center mb-3"
          style={{ color: "#fb7185" }}
        >
          Mic unavailable — check permissions
        </p>
      )}

      {/* The orb */}
      <button
        type="button"
        onClick={startListening}
        disabled={disabled || state === "processing"}
        aria-label={state === "listening" ? "Stop recording" : "Speak to DayMind"}
        className="voice-orb-button"
        data-state={state}
      >
        {/* Pulse rings when listening */}
        {state === "listening" && (
          <>
            <span className="voice-orb-ring voice-orb-ring-1" />
            <span className="voice-orb-ring voice-orb-ring-2" />
          </>
        )}

        {/* Icon */}
        <span className="relative z-10 flex items-center justify-center">
          {state === "processing" ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          )}
        </span>
      </button>

      {/* Label */}
      {state === "idle" && (
        <p
          className="text-xs text-center mt-2 animate-fade-in"
          style={{ color: "rgba(16, 185, 129, 0.45)" }}
        >
          Tap to speak
        </p>
      )}
    </div>
  )
}
