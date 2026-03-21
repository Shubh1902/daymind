export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { generateDayPlan } from "@/app/actions/ai"
import type { PlanItem } from "@/app/actions/ai"
import DashboardContent from "@/components/DashboardContent"
import ChatInput from "@/components/ChatInput"
import ContextQuestions from "@/components/ContextQuestions"

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
        <div
          className="rounded-2xl p-4 mb-6 animate-slide-up delay-100"
          style={{
            background: "linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(16, 185, 129, 0.05))",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            boxShadow: "0 0 24px rgba(16, 185, 129, 0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: "rgba(16, 185, 129, 0.2)" }}
            >
              <svg className="w-3 h-3" style={{ color: "#34d399" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#34d399" }}>
              Today's Briefing
            </p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(236, 253, 245, 0.85)" }}>
            {aiSession.briefing}
          </p>
        </div>
      )}

      {/* Context questions from Claude */}
      {aiSession.questions.length > 0 && (
        <div className="animate-slide-up delay-150">
          <ContextQuestions questions={aiSession.questions} userId={USER_ID} />
        </div>
      )}

      {/* Schedule / Focus toggle + content */}
      <div className="animate-slide-up delay-200">
        <DashboardContent
          openTasks={openTasks}
          allTasks={allTasks}
          plan={aiSession.plan as PlanItem[]}
        />
      </div>

      {/* Chat input — fixed at bottom */}
      <ChatInput
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
