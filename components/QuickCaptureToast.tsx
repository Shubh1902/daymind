"use client"

import { useEffect, useState } from "react"

export default function QuickCaptureToast({
  text,
  onDismiss,
}: {
  text: string
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 2500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl max-w-xs mx-auto transition-all duration-300"
      style={{
        background: "var(--surface-3)",
        border: "1px solid rgba(249, 115, 22, 0.25)",
        boxShadow: "0 8px 32px rgba(67, 20, 7, 0.1), 0 0 16px rgba(249, 115, 22, 0.1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(249, 115, 22, 0.15)" }}
      >
        <svg className="w-3.5 h-3.5" style={{ color: "#f97316" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm font-medium truncate" style={{ color: "#431407" }}>
        Added: {text}
      </p>
    </div>
  )
}
