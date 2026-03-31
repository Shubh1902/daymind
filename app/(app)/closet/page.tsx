export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import ClosetGridWithFeatures from "@/components/closet/ClosetGridWithFeatures"
import ClosetSubNav from "@/components/closet/ClosetSubNav"
import Link from "next/link"

const USER_ID = "user_me"

export default async function ClosetPage() {
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
  })

  const totalItems = items.length
  const categories = new Set(items.map((i) => i.category))

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">My Closet</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            {totalItems} items · {categories.size} categories
          </p>
        </div>
        <Link
          href="/closet/capture"
          className="btn-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          Add
        </Link>
      </div>

      <ClosetSubNav />

      {/* Grid with OOTD + What Goes With features */}
      <div className="animate-slide-up delay-100">
        <ClosetGridWithFeatures
          initialItems={items as unknown as Parameters<typeof ClosetGridWithFeatures>[0]["initialItems"]}
        />
      </div>
    </div>
  )
}
