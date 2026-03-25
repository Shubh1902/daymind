const PREFERRED_VOICES = [
  "Samantha", // macOS / iOS — warm, natural
  "Karen",    // macOS — friendly Australian
  "Zoe",      // macOS — natural
  "Google UK English Female",
  "Google US English",
  "Microsoft Aria",  // Windows — natural
  "Microsoft Jenny", // Windows — friendly
]

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => PREFERRED_VOICES.some((p) => v.name.includes(p))) ??
    voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ??
    voices.find((v) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("whisper"))
  )
}

export function speak(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Speech synthesis not supported"))
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 1.15
    utterance.lang = "en-US"

    const voice = pickVoice()
    if (voice) utterance.voice = voice

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve() // resolve anyway so flow continues
    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}

export function initVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.getVoices()
}
