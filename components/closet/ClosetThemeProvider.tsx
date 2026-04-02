"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type ClosetTheme = "light" | "dark"

const ClosetThemeContext = createContext<{
  theme: ClosetTheme
  toggle: () => void
}>({
  theme: "light",
  toggle: () => {},
})

export function useClosetTheme() {
  return useContext(ClosetThemeContext)
}

const STORAGE_KEY = "closet-theme"

export default function ClosetThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ClosetTheme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ClosetTheme | null
    if (stored === "dark" || stored === "light") {
      setTheme(stored)
    }
    setMounted(true)
  }, [])

  function toggle() {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const wrapperStyle: React.CSSProperties = {
    background: "var(--closet-bg)",
    color: "var(--closet-text)",
    minHeight: "100vh",
    padding: "16px",
    transition: "background-color 0.3s ease, color 0.3s ease",
  }

  // Prevent flash of wrong theme on mount
  if (!mounted) {
    return (
      <div data-closet-theme="light" className="md:p-8" style={wrapperStyle}>
        {children}
      </div>
    )
  }

  return (
    <ClosetThemeContext value={{ theme, toggle }}>
      <div data-closet-theme={theme} className="md:p-8" style={wrapperStyle}>
        {children}
      </div>
    </ClosetThemeContext>
  )
}
