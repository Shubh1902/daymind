import { prisma } from "@/lib/prisma"
import TaskCard from "@/components/TaskCard"
import Link from "next/link"

const USER_ID = "user_me"

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    where: { userId: USER_ID },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
  })

  const open = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">All Tasks</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            {open.length} open · {done.length} completed
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="btn-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Link>
      </div>

      {open.length === 0 && done.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 animate-scale-in">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.15)" }}
          >
            <svg className="w-8 h-8" style={{ color: "rgba(249, 115, 22, 0.4)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-lg font-semibold" style={{ color: "rgba(234, 88, 12, 0.6)" }}>No tasks yet</p>
          <p className="text-sm mt-1" style={{ color: "rgba(249, 115, 22, 0.35)" }}>Add your first task to get started</p>
        </div>
      )}

      {open.length > 0 && (
        <section className="mb-8 animate-slide-up delay-100">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: "rgba(249, 115, 22, 0.5)" }}
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
              style={{ background: "rgba(249, 115, 22, 0.15)", color: "#fb923c" }}
            >
              {open.length}
            </span>
            Open
          </h2>
          <div className="flex flex-col gap-2">
            {open.map((task, i) => (
              <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <TaskCard task={task} />
              </div>
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section className="animate-slide-up delay-200">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: "rgba(249, 115, 22, 0.35)" }}
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
              style={{ background: "rgba(249, 115, 22, 0.08)", color: "rgba(234, 88, 12, 0.5)" }}
            >
              {done.length}
            </span>
            Completed
          </h2>
          <div className="flex flex-col gap-2 opacity-50">
            {done.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
