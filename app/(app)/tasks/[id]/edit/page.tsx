import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import TaskEditForm from "@/components/TaskEditForm"

const USER_ID = "user_me"

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const task = await prisma.task.findFirst({
    where: { id, userId: USER_ID },
  })

  if (!task) notFound()

  return (
    <div className="animate-fade-in">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Edit Task</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Refine the details
        </p>
      </div>
      <div className="animate-slide-up delay-100">
        <TaskEditForm task={{
          id: task.id,
          text: task.text,
          deadline: task.deadline,
          estimatedMinutes: task.estimatedMinutes,
          priority: task.priority,
          category: task.category,
          notes: task.notes,
        }} />
      </div>
    </div>
  )
}
