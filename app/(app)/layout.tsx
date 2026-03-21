"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  {
    href: "/dashboard",
    label: "Today",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/tasks",
    label: "All Tasks",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/tasks/new",
    label: "Add Task",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: "/ai-flow",
    label: "AI Flow",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "var(--background)" }}>
      {/* Sidebar — desktop */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 p-5 gap-2"
        style={{
          background: "var(--surface-1)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #059669, #10b981)",
                boxShadow: "0 0 16px rgba(16, 185, 129, 0.4)",
              }}
            >
              D
            </div>
            <span className="text-gradient text-lg font-bold">DayMind</span>
          </div>
          <p className="text-xs mt-1.5 px-0.5" style={{ color: "rgba(16, 185, 129, 0.5)" }}>
            Your chief of staff
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  color: isActive ? "#6ee7b7" : "rgba(52, 211, 153, 0.5)",
                  borderLeft: isActive ? "2px solid #10b981" : "2px solid transparent",
                  boxShadow: isActive ? "0 0 12px rgba(16, 185, 129, 0.08)" : "none",
                }}
              >
                <span style={{ color: isActive ? "#10b981" : "rgba(16, 185, 129, 0.4)" }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom decoration */}
        <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs px-2" style={{ color: "rgba(16, 185, 129, 0.3)" }}>
            Powered by Claude AI
          </p>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden px-2 pb-safe"
        style={{
          background: "rgba(6, 13, 18, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-200"
              style={{
                color: isActive ? "#6ee7b7" : "rgba(16, 185, 129, 0.4)",
              }}
            >
              <span
                className="p-1.5 rounded-lg transition-all duration-200"
                style={{
                  background: isActive ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  color: isActive ? "#10b981" : "inherit",
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-3xl w-full">
        {children}
      </main>
    </div>
  )
}
