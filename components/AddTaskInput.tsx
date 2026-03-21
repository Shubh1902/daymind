"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const inputStyle = {
  background: "var(--surface-2)",
  border: "1px solid rgba(16, 185, 129, 0.15)",
  color: "rgba(236, 253, 245, 0.9)",
  borderRadius: "0.75rem",
  padding: "0.625rem 0.75rem",
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
}

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.45)"
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)"
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.15)"
        e.currentTarget.style.boxShadow = "none"
        props.onBlur?.(e)
      }}
    />
  )
}

function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: "none" }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.45)"
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)"
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.15)"
        e.currentTarget.style.boxShadow = "none"
        props.onBlur?.(e)
      }}
    />
  )
}

function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, cursor: "pointer" }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.45)"
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)"
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.15)"
        e.currentTarget.style.boxShadow = "none"
      }}
    />
  )
}

export default function AddTaskInput() {
  const router = useRouter()
  const [text, setText] = useState("")
  const [deadline, setDeadline] = useState("")
  const [estimatedMinutes, setEstimatedMinutes] = useState("")
  const [priority, setPriority] = useState("medium")
  const [category, setCategory] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      setError("Task text is required")
      return
    }

    setLoading(true)
    setError("")

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        deadline: deadline || null,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        priority,
        category: category || null,
        notes: notes || null,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      setError("Failed to create task")
      return
    }

    router.push("/tasks")
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl p-6"
      style={{
        background: "var(--surface-1)",
        border: "1px solid rgba(16, 185, 129, 0.15)",
        boxShadow: "0 0 40px rgba(16, 185, 129, 0.05)",
      }}
    >
      {/* Main text */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(52, 211, 153, 0.8)" }}>
          What needs to be done? <span style={{ color: "#fb7185" }}>*</span>
        </label>
        <DarkInput
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Call accountant about Q1 taxes"
          autoFocus
          style={{ ...inputStyle, fontSize: "1rem", padding: "0.75rem" }}
        />
        {error && (
          <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#fb7185" }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Deadline */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(16, 185, 129, 0.55)" }}>Deadline</label>
          <DarkInput
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* Estimate */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(16, 185, 129, 0.55)" }}>Est. minutes</label>
          <DarkInput
            type="number"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="30"
            min={1}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(16, 185, 129, 0.55)" }}>Priority</label>
          <DarkSelect value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </DarkSelect>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(16, 185, 129, 0.55)" }}>Category</label>
          <DarkInput
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Work, Personal…"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(16, 185, 129, 0.55)" }}>Notes</label>
        <DarkTextarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any extra context…"
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </>
          )}
        </button>
      </div>
    </form>
  )
}
