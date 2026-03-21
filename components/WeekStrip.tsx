type Task = {
  deadline: Date | null
  completed: boolean
}

function getWeekDays() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function WeekStrip({ tasks }: { tasks: Task[] }) {
  const days = getWeekDays()
  const today = new Date()
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="flex gap-1.5 mb-6">
      {days.map((day, i) => {
        const isToday = isSameDay(day, today)
        const isPast = day < today && !isToday

        const dayDeadlines = tasks.filter(
          (t) => t.deadline && !t.completed && isSameDay(new Date(t.deadline), day)
        )
        const overdueDeadlines = tasks.filter(
          (t) =>
            t.deadline &&
            !t.completed &&
            new Date(t.deadline) < today &&
            !isSameDay(new Date(t.deadline), today)
        )

        const hasDeadline = dayDeadlines.length > 0
        const hasOverdue = isPast && overdueDeadlines.some((t) =>
          isSameDay(new Date(t.deadline!), day)
        )

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center py-2.5 rounded-xl text-xs transition-all duration-200"
            style={
              isToday
                ? {
                    background: "linear-gradient(135deg, rgba(5, 150, 105, 0.4), rgba(16, 185, 129, 0.25))",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    boxShadow: "0 0 16px rgba(16, 185, 129, 0.2)",
                  }
                : isPast
                ? {
                    background: "rgba(10, 21, 32, 0.5)",
                    border: "1px solid rgba(16, 185, 129, 0.06)",
                  }
                : {
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            <span
              className="font-medium"
              style={{ color: isToday ? "#6ee7b7" : isPast ? "rgba(16, 185, 129, 0.25)" : "rgba(52, 211, 153, 0.6)" }}
            >
              {DAY_LABELS[i]}
            </span>
            <span
              className="mt-0.5 font-semibold"
              style={{ color: isToday ? "#e9d5ff" : isPast ? "rgba(16, 185, 129, 0.2)" : "rgba(52, 211, 153, 0.8)" }}
            >
              {day.getDate()}
            </span>
            {(hasDeadline || hasOverdue) && (
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full"
                style={{
                  background: hasOverdue
                    ? "#f43f5e"
                    : isToday && hasDeadline
                    ? "#6ee7b7"
                    : "#f59e0b",
                  boxShadow: hasOverdue ? "0 0 6px rgba(244, 63, 94, 0.6)" : "none",
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
