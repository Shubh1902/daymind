"use client"

import { useClosetTheme } from "./ClosetThemeProvider"

export default function ClosetThemeToggle() {
  const { theme, toggle } = useClosetTheme()
  const isDark = theme === "dark"

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="relative w-14 h-7 rounded-full transition-all duration-300 shrink-0"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1e293b, #334155)"
          : "linear-gradient(135deg, #fce7f3, #fdf2f8)",
        border: `1.5px solid ${isDark ? "#475569" : "#f9a8d4"}`,
        boxShadow: isDark
          ? "inset 0 1px 4px rgba(0,0,0,0.3)"
          : "inset 0 1px 4px rgba(236,72,153,0.1)",
      }}
    >
      {/* Track icons */}
      <span
        className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs transition-opacity duration-300"
        style={{ opacity: isDark ? 0.3 : 0 }}
      >
        🌙
      </span>
      <span
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs transition-opacity duration-300"
        style={{ opacity: isDark ? 0 : 0.3 }}
      >
        ☀️
      </span>

      {/* Thumb */}
      <span
        className="absolute top-0.5 w-5.5 h-5.5 rounded-full flex items-center justify-center text-xs transition-all duration-300"
        style={{
          width: "22px",
          height: "22px",
          left: isDark ? "calc(100% - 24px)" : "2px",
          background: isDark
            ? "linear-gradient(135deg, #f97316, #fb923c)"
            : "linear-gradient(135deg, #ec4899, #f472b6)",
          boxShadow: isDark
            ? "0 1px 6px rgba(249,115,22,0.4)"
            : "0 1px 6px rgba(236,72,153,0.4)",
        }}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  )
}
