import { generateWeeklyDigest } from "@/app/actions/ai"
import WeeklyDigest from "@/components/WeeklyDigest"

const USER_ID = "user_me"

export default async function DigestSection() {
  const stats = await generateWeeklyDigest(USER_ID)
  return <WeeklyDigest stats={stats} />
}
