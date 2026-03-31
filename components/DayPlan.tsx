import TaskCard from "./TaskCard"
import type { PlanItem } from "@/app/actions/ai"

type Task = {
  id: string
  text: string
  deadline: Date | null
  estimatedMinutes: number | null
  priority: string
  category: string | null
  completed: boolean
  notes: string | null
  capability?: string | null
}

export default function DayPlan({
  plan,
  tasks,
}: {
  plan: PlanItem[]
  tasks: Task[]
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(249, 115, 22, 0.07)", border: "1px solid rgba(249, 115, 22, 0.12)" }}
        >
          <svg className="w-7 h-7" style={{ color: "rgba(249, 115, 22, 0.35)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-base font-semibold" style={{ color: "rgba(249, 115, 22, 0.5)" }}>Nothing on the plan</p>
        <p className="text-sm mt-1" style={{ color: "rgba(249, 115, 22, 0.3)" }}>Add tasks to see them here</p>
      </div>
    )
  }

  // AI-scheduled view
  if (plan.length > 0) {
    const taskMap = new Map(tasks.map((t) => [t.id, t]))
    const scheduledItems = plan
      .map((p) => ({ planItem: p, task: taskMap.get(p.taskId) }))
      .filter((x): x is { planItem: PlanItem; task: Task } => !!x.task)

    const unscheduledTasks = tasks.filter(
      (t) => !plan.some((p) => p.taskId === t.id)
    )

    return (
      <div className="flex flex-col gap-2">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "rgba(249, 115, 22, 0.45)" }}
        >
          Today's Schedule
        </h2>

        {scheduledItems.map(({ planItem, task }) => (
          <div key={task.id} className="flex gap-3 items-start">
            {/* Time column */}
            <div className="flex-shrink-0 w-14 text-right pt-3">
              <span
                className="text-xs font-semibold block leading-tight"
                style={{ color: "#c2410c" }}
              >
                {planItem.scheduledTime}
              </span>
              <p className="text-xs leading-tight mt-0.5" style={{ color: "#9a3412" }}>
                {planItem.estimatedMinutes}m
              </p>
            </div>

            {/* Connector line + card */}
            <div className="flex gap-2 flex-1 min-w-0 items-start">
              <div className="flex flex-col items-center pt-3.5 shrink-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #ea580c, #f97316)",
                    boxShadow: "0 0 8px rgba(249, 115, 22, 0.5)",
                  }}
                />
                <div
                  className="w-px flex-1 min-h-4 mt-1"
                  style={{ background: "rgba(249, 115, 22, 0.12)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <TaskCard task={task} />
                {planItem.reason && (
                  <p
                    className="text-xs mt-1.5 ml-2 italic"
                    style={{ color: "#92400e" }}
                  >
                    {planItem.reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {unscheduledTasks.length > 0 && (
          <div className="mt-5">
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "rgba(249, 115, 22, 0.35)" }}
            >
              Not Scheduled
            </h2>
            <div className="flex flex-col gap-2">
              {unscheduledTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback: priority grouping
  const priorityOrder = ["high", "medium", "low"]
  const grouped: Record<string, Task[]> = { high: [], medium: [], low: [], other: [] }
  tasks.forEach((t) => {
    if (grouped[t.priority]) grouped[t.priority].push(t)
    else grouped.other.push(t)
  })

  const priorityLabels: Record<string, { label: string; color: string }> = {
    high:   { label: "High Priority",   color: "#dc2626" },
    medium: { label: "Medium Priority", color: "#b45309" },
    low:    { label: "Low Priority",    color: "#047857" },
    other:  { label: "Other",           color: "#9a3412" },
  }

  const sections = [...priorityOrder, "other"]
    .filter((key) => grouped[key]?.length > 0)
    .map((key) => ({ key, tasks: grouped[key], ...priorityLabels[key] }))

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.key}>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: section.color, opacity: 0.7 }}
          >
            {section.label}
          </h2>
          <div className="flex flex-col gap-2">
            {section.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
