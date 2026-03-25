export const dynamic = "force-dynamic"

import { generateWeeklyDigest } from "@/app/actions/ai"
import WeeklyDigest from "@/components/WeeklyDigest"

const USER_ID = "user_me"

export default async function DigestPage() {
  const stats = await generateWeeklyDigest(USER_ID)

  return (
    <div className="pb-24 animate-fade-in">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Weekly Digest</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(16, 185, 129, 0.5)" }}>
          Last 7 days
        </p>
      </div>

      <WeeklyDigest stats={stats} />
    </div>
  )
}
