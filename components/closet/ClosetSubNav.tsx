"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

const NAV_ITEMS = [
  { href: "/closet", label: "Closet", emoji: "👗" },
  { href: "/closet/organize", label: "Wardrobe", emoji: "🪟" },
  { href: "/closet/combos", label: "Combos", emoji: "🔀" },
  { href: "/closet/mix", label: "Mix", emoji: "🎨" },
  { href: "/closet/outfits", label: "Outfits", emoji: "✨" },
  { href: "/closet/weather", label: "Weather", emoji: "🌤️" },
  { href: "/closet/inspiration", label: "Inspo", emoji: "🔮" },
  { href: "/closet/calendar", label: "Calendar", emoji: "📅" },
  { href: "/closet/history", label: "History", emoji: "🔄" },
  { href: "/closet/wishlist", label: "Wishlist", emoji: "🛍️" },
  { href: "/closet/stats", label: "Stats", emoji: "📊" },
  { href: "/closet/profile", label: "Style", emoji: "💎" },
  { href: "/closet/packing", label: "Pack", emoji: "🧳" },
]

export default function ClosetSubNav() {
  const pathname = usePathname()
  const activeRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [pathname])

  return (
    <nav aria-label="Closet sections" className="relative mb-5">
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/closet" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              ref={isActive ? activeRef : undefined}
              href={item.href}
              className="shrink-0 flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: isActive
                  ? "var(--closet-surface-2, rgba(234, 88, 12, 0.12))"
                  : "transparent",
                color: isActive ? "var(--closet-accent, #ea580c)" : "var(--closet-text-3, rgba(249, 115, 22, 0.45))",
                border: isActive ? "1px solid var(--closet-border, rgba(249, 115, 22, 0.2))" : "1px solid transparent",
              }}
            >
              <span>{item.emoji}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
      <div
        className="absolute right-0 top-0 bottom-2 w-8 pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent, var(--closet-bg, var(--background, #fff)))",
        }}
      />
    </nav>
  )
}
