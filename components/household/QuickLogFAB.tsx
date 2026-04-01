"use client"

import Link from "next/link"

export default function QuickLogFAB() {
  return (
    <Link
      href="/household/log"
      className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full btn-primary text-white flex items-center justify-center animate-scale-in"
      style={{ boxShadow: "0 4px 16px rgba(249, 115, 22, 0.4)" }}
      aria-label="Log a chore"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </Link>
  )
}
