export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { generateDayPlan } from "@/app/actions/ai"
import type { PlanItem } from "@/app/actions/ai"
import DashboardContent from "@/components/DashboardContent"
import ChatInput from "@/components/ChatInput"
import MobileVoicePanel from "@/components/MobileVoicePanel"
import BriefingCard from "@/components/BriefingCard"
import ContextQuestions from "@/components/ContextQuestions"
import RescheduleNudge from "@/components/RescheduleNudge"

const USER_ID = "user_me"

export default async function DashboardPage() {
  const [aiSession, allTasks] = await Promise.all([
    generateDayPlan(USER_ID),
    prisma.task.findMany({
      where: { userId: USER_ID },
      orderBy: [{ completed: "asc" }, { deadline: "asc" }],
    }),
  ])

  const openTasks = allTasks.filter((t) => !t.completed)
  const greeting = getGreeting()

  return (
    <div className="pb-40 animate-fade-in">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">{greeting}</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(16, 185, 129, 0.5)" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* AI Briefing */}
      {aiSession.briefing && (
        <BriefingCard briefing={aiSession.briefing} />
      )}

      {/* Context questions from Claude */}
      {aiSession.questions.length > 0 && (
        <div className="animate-slide-up delay-150">
          <ContextQuestions questions={aiSession.questions} userId={USER_ID} />
        </div>
      )}

      {/* Proactive reschedule nudge */}
      <RescheduleNudge plan={aiSession.plan as PlanItem[]} tasks={allTasks} />

      {/* Schedule / Focus toggle + content */}
      <div className="animate-slide-up delay-200">
        <DashboardContent
          openTasks={openTasks}
          allTasks={allTasks}
          plan={aiSession.plan as PlanItem[]}
        />
      </div>

      {/* Chat input — desktop (fixed at bottom) */}
      <ChatInput
        tasks={openTasks}
        currentPlan={aiSession.plan as PlanItem[]}
        sessionId={aiSession.id}
      />

      {/* Mobile voice-first panel */}
      <MobileVoicePanel
        tasks={openTasks}
        currentPlan={aiSession.plan as PlanItem[]}
        sessionId={aiSession.id}
      />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}
