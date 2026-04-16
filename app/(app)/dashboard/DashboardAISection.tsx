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

export default async function DashboardAISection() {
  const [aiSession, allTasks] = await Promise.all([
    generateDayPlan(USER_ID),
    prisma.task.findMany({
      where: { userId: USER_ID },
      orderBy: [{ completed: "asc" }, { deadline: "asc" }],
    }),
  ])

  const openTasks = allTasks.filter((t) => !t.completed)

  return (
    <>
      {aiSession.briefing && <BriefingCard briefing={aiSession.briefing} />}

      {aiSession.questions.length > 0 && (
        <div className="animate-slide-up delay-150">
          <ContextQuestions questions={aiSession.questions} userId={USER_ID} />
        </div>
      )}

      <RescheduleNudge plan={aiSession.plan as PlanItem[]} tasks={allTasks} />

      <div className="animate-slide-up delay-200">
        <DashboardContent
          openTasks={openTasks}
          allTasks={allTasks}
          plan={aiSession.plan as PlanItem[]}
        />
      </div>

      <ChatInput
        tasks={openTasks}
        currentPlan={aiSession.plan as PlanItem[]}
        sessionId={aiSession.id}
      />

      <MobileVoicePanel
        tasks={openTasks}
        currentPlan={aiSession.plan as PlanItem[]}
        sessionId={aiSession.id}
      />
    </>
  )
}
