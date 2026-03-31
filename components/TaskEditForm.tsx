"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import VoiceButton from "./VoiceButton"

type TaskProp = {
  id: string
  text: string
  deadline: Date | null
  estimatedMinutes: number | null
  priority: string
  category: string | null
  notes: string | null
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid rgba(249, 115, 22, 0.15)",
  color: "#431407",
  borderRadius: "0.75rem",
  padding: "0.625rem 0.75rem",
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
}

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.45)"
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249, 115, 22, 0.1)"
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.15)"
  e.currentTarget.style.boxShadow = "none"
}

export default function TaskEditForm({ task }: { task: TaskProp }) {
  const router = useRouter()
  const [text, setText] = useState(task.text)
  const [deadline, setDeadline] = useState(
    task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ""
  )
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task.estimatedMinutes?.toString() ?? ""
  )
  const [priority, setPriority] = useState(task.priority)
  const [category, setCategory] = useState(task.category ?? "")
  const [notes, setNotes] = useState(task.notes ?? "")
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

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
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
      setError("Failed to save changes")
      return
    }

    router.back()
    router.refresh()
  }

  function handleVoiceForText(transcript: string) {
    // Voice REPLACES the task text (not append) — user is re-dictating the task
    setText(transcript)
  }

  function handleVoiceForNotes(transcript: string) {
    setNotes((prev) => (prev ? prev + " " + transcript : transcript))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl p-6"
      style={{
        background: "var(--surface-1)",
        border: "1px solid rgba(249, 115, 22, 0.15)",
        boxShadow: "0 0 40px rgba(249, 115, 22, 0.05)",
      }}
    >
      {/* Main text + voice */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(234, 88, 12, 0.8)" }}>
          Task <span style={{ color: "#fb7185" }}>*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ ...inputStyle, fontSize: "1rem", padding: "0.75rem", flex: 1 }}
            onFocus={focusStyle}
            onBlur={blurStyle}
            autoFocus
          />
          <VoiceButton onTranscript={handleVoiceForText} />
        </div>
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
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(249, 115, 22, 0.55)" }}>Deadline</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

        {/* Estimate */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(249, 115, 22, 0.55)" }}>Est. minutes</label>
          <input
            type="number"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="30"
            min={1}
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(249, 115, 22, 0.55)" }}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(249, 115, 22, 0.55)" }}>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Work, Personal..."
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>
      </div>

      {/* Notes + voice */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(249, 115, 22, 0.55)" }}>Notes</label>
        <div className="flex gap-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra context..."
            rows={3}
            style={{ ...inputStyle, resize: "none", flex: 1 }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
          <div className="pt-1">
            <VoiceButton onTranscript={handleVoiceForNotes} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200"
          style={{
            color: "rgba(234, 88, 12, 0.6)",
            border: "1px solid rgba(249, 115, 22, 0.15)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
