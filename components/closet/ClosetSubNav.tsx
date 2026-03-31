"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/closet", label: "Closet", emoji: "👗" },
  { href: "/closet/mix", label: "Mix", emoji: "🎨" },
  { href: "/closet/outfits", label: "Outfits", emoji: "✨" },
  { href: "/closet/calendar", label: "Calendar", emoji: "📅" },
  { href: "/closet/stats", label: "Stats", emoji: "📊" },
  { href: "/closet/profile", label: "Style", emoji: "💎" },
  { href: "/closet/packing", label: "Pack", emoji: "🧳" },
]

export default function ClosetSubNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: isActive
                ? "linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(249, 115, 22, 0.08))"
                : "transparent",
              color: isActive ? "#ea580c" : "rgba(249, 115, 22, 0.45)",
              border: isActive ? "1px solid rgba(249, 115, 22, 0.2)" : "1px solid transparent",
            }}
          >
            <span>{item.emoji}</span>
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
