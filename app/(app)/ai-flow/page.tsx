"use client"

import { useState } from "react"

// ─── Shared primitives ────────────────────────────────────────────────────────

function Pill({ children, color = "purple" }: { children: React.ReactNode; color?: "purple" | "green" | "blue" | "orange" | "pink" | "teal" }) {
  const styles: Record<string, React.CSSProperties> = {
    purple: { background: "rgba(5,150,105,0.2)", color: "#6ee7b7", border: "1px solid rgba(5,150,105,0.3)" },
    green:  { background: "rgba(34,197,94,0.12)",  color: "#86efac", border: "1px solid rgba(34,197,94,0.2)" },
    blue:   { background: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" },
    orange: { background: "rgba(249,115,22,0.12)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.2)" },
    pink:   { background: "rgba(236,72,153,0.12)", color: "#f9a8d4", border: "1px solid rgba(236,72,153,0.2)" },
    teal:   { background: "rgba(20,184,166,0.12)", color: "#5eead4", border: "1px solid rgba(20,184,166,0.2)" },
  }
  return (
    <span style={{ ...styles[color], display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, marginRight: 6, marginBottom: 4 }}>
      {children}
    </span>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16, ...style }}>
      {children}
    </div>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, overflowX: "auto", fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.7, marginBottom: 12 }}>
      {children}
    </pre>
  )
}

function Highlight({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: 8, padding: 14, marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#6ee7b7", marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: 13, color: "rgba(236,253,245,0.6)", margin: 0 }}>{children}</p>
    </div>
  )
}

function StatusBar({ dot, children }: { dot: "green" | "orange" | "purple"; children: React.ReactNode }) {
  const dotColors = { green: "#22c55e", orange: "#f97316", purple: "#10b981" }
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.25)", fontSize: 11, color: "rgba(236,253,245,0.5)", marginBottom: 16, fontFamily: "monospace" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColors[dot], boxShadow: `0 0 6px ${dotColors[dot]}`, flexShrink: 0 }} />
      {children}
    </div>
  )
}

// ─── Flow step (collapsible) ──────────────────────────────────────────────────

function FlowStep({ num, color, title, summary, children }: {
  num: number; color: string; title: string; summary: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, position: "relative", cursor: "pointer" }} onClick={() => setOpen(!open)}>
      {/* Connector line */}
      <div style={{ position: "absolute", left: 19, top: 40, width: 2, bottom: -16, background: "rgba(16,185,129,0.2)", zIndex: 0 }} />

      <div style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: color, fontSize: 15, fontWeight: 700, zIndex: 1, color: "white",
        border: open ? "2px solid #10b981" : "2px solid transparent",
        boxShadow: open ? "0 0 20px rgba(16,185,129,0.4)" : "none",
        transition: "all 0.2s",
      }}>
        {num}
      </div>

      <div style={{ flex: 1, paddingBottom: 24, paddingTop: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(236,253,245,0.9)", marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
          {title}
          <span style={{ fontSize: 11, color: "rgba(16,185,129,0.5)", fontWeight: 400 }}>{open ? "▲ collapse" : "▼ expand"}</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(236,253,245,0.5)" }}>{summary}</div>
        {open && (
          <div style={{ marginTop: 12, borderLeft: "2px solid #059669", borderRadius: "0 8px 8px 0", padding: "12px 16px", background: "rgba(0,0,0,0.3)", fontSize: 12, color: "rgba(236,253,245,0.7)" }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inner tab group ──────────────────────────────────────────────────────────

function TabGroup({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0)
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            style={{
              background: active === i ? "linear-gradient(135deg, #059669, #10b981)" : "none",
              border: `1px solid ${active === i ? "transparent" : "rgba(16,185,129,0.2)"}`,
              color: active === i ? "white" : "rgba(236,253,245,0.5)",
              padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ animation: "fadeIn 0.2s ease" }}>
        {tabs[active].content}
      </div>
    </div>
  )
}

// ─── Arch boxes ───────────────────────────────────────────────────────────────

function ArchRow({ left, right }: { left: { icon: string; name: string; sub: string }; right: { icon: string; name: string; sub: string } }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", alignItems: "center", marginBottom: 12 }}>
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>{left.icon}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(236,253,245,0.9)" }}>{left.name}</div>
        <div style={{ fontSize: 11, color: "rgba(236,253,245,0.4)", marginTop: 2, whiteSpace: "pre-line" }}>{left.sub}</div>
      </div>
      <div style={{ textAlign: "center", color: "#10b981", fontSize: 20 }}>→</div>
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>{right.icon}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(236,253,245,0.9)" }}>{right.name}</div>
        <div style={{ fontSize: 11, color: "rgba(236,253,245,0.4)", marginTop: 2, whiteSpace: "pre-line" }}>{right.sub}</div>
      </div>
    </div>
  )
}

// ─── Chat demo ────────────────────────────────────────────────────────────────

type ChatMsg = { role: "user" | "ai" | "system"; text: string }

function ChatDemo() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "ai", text: "Hey! I've got your plan ready. What would you like to change?" }
  ])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)

  const presets = [
    { label: "Defer the report to tomorrow", ai: "Done! I've moved the report to tomorrow morning. More breathing room today.", db: "→ 1 deferred · plan updated · router.refresh()" },
    { label: "Mark the call as done", ai: "Nice, marked it complete! I've tightened up the remaining slots.", db: "✓ 1 completed · plan updated · router.refresh()" },
    { label: "Add: email Sarah by EOD", ai: "Added 'Email Sarah by EOD' and slotted it at 4:30 PM.", db: "+ 1 task created · plan updated · router.refresh()" },
  ]

  function streamIn(text: string, db: string) {
    setStreaming(true)
    let i = 0
    const temp: ChatMsg = { role: "ai", text: "" }
    setMsgs(prev => [...prev, temp])
    const interval = setInterval(() => {
      i += 4
      setMsgs(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: "ai", text: text.slice(0, i) }
        return copy
      })
      if (i >= text.length) {
        clearInterval(interval)
        setMsgs(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: "ai", text }
          return copy
        })
        setTimeout(() => {
          setMsgs(prev => [...prev, { role: "system", text: `⚡ DB: ${db}` }])
          setStreaming(false)
        }, 400)
      }
    }, 30)
  }

  function send(text: string, aiReply: string, db: string) {
    setMsgs(prev => [...prev, { role: "user", text }])
    setTimeout(() => streamIn(aiReply, db), 500)
  }

  function handleCustom() {
    const t = input.trim()
    if (!t || streaming) return
    setInput("")
    send(t, "Got it! I've updated your plan accordingly.", "plan updated · router.refresh()")
  }

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "var(--surface-3)", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "#6ee7b7", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
        DayMind Chat
      </div>

      {/* Messages */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" }}>
        {msgs.map((m, i) => (
          m.role === "system" ? (
            <div key={i} style={{ textAlign: "center", fontSize: 11, color: "rgba(16,185,129,0.5)", fontFamily: "monospace" }}>{m.text}</div>
          ) : (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", borderRadius: 16, padding: "10px 14px", fontSize: 13, lineHeight: 1.5,
                background: m.role === "user" ? "linear-gradient(135deg, #059669, #10b981)" : "var(--surface-3)",
                color: "rgba(236,253,245,0.9)",
                border: m.role === "ai" ? "1px solid var(--border)" : "none",
              }}>
                {m.text}
                {streaming && i === msgs.length - 1 && m.role === "ai" && (
                  <span style={{ display: "inline-block", width: 2, height: 14, background: "#22c55e", marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 1s infinite" }} />
                )}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 10px", flexWrap: "wrap" }}>
        {presets.map(p => (
          <button
            key={p.label}
            disabled={streaming}
            onClick={() => send(p.label, p.ai, p.db)}
            style={{ background: "var(--surface-3)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#6ee7b7", cursor: "pointer", opacity: streaming ? 0.4 : 1 }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCustom()}
          disabled={streaming}
          placeholder="Type your own message..."
          style={{ flex: 1, background: "var(--surface-3)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 20, padding: "8px 14px", fontSize: 13, color: "rgba(236,253,245,0.9)", outline: "none" }}
        />
        <button
          onClick={handleCustom}
          disabled={streaming || !input.trim()}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #059669, #10b981)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: streaming || !input.trim() ? 0.4 : 1 }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Prompt simulator ─────────────────────────────────────────────────────────

function PromptSimulator() {
  const [tasks, setTasks] = useState(`Write Q1 report | due:2026-03-25 | priority:high | est:90\nReview product roadmap | est:45\nCall Alex re: partnership | due:2026-03-22\nUpdate landing page copy | priority:low`)
  const [context, setContext] = useState(`Best focus time: mornings before noon\nWriting reports: takes 2+ hours due to revisions`)
  const [output, setOutput] = useState("")

  function build() {
    const now = new Date()
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    const dayName = days[now.getDay()]
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
    const h = now.getHours(); const m = now.getMinutes()
    const timeStr = `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`

    const taskLines = tasks.split("\n").filter(Boolean).map((line, i) => {
      const parts = line.split("|").map(p => p.trim())
      let result = `- ID: sim_${i + 1} | "${parts[0]}"`
      parts.slice(1).forEach(p => {
        if (p.startsWith("due:")) result += ` | Due: ${p.replace("due:", "")}`
        else if (p.startsWith("priority:") && !p.includes("medium")) result += ` | Priority: ${p.replace("priority:", "")}`
        else if (p.startsWith("est:")) result += ` | Est: ${p.replace("est:", "")}min`
      })
      return result
    }).join("\n") || "(no tasks entered)"

    const contextLines = context.split("\n").filter(Boolean).map(l => `- ${l.trim()}`).join("\n") || "None recorded yet."

    setOutput(`Today is ${dayName}, ${dateStr} at ${timeStr}.

MY TASKS:
${taskLines}

MY CONTEXT:
${contextLines}

Produce a day plan. Return ONLY valid JSON in this exact shape:
{
  "briefing": "2-3 sentences: why these tasks matter today",
  "plan": [
    {
      "taskId": "exact task ID from the list above",
      "scheduledTime": "9:00 AM",
      "estimatedMinutes": 30,
      "reason": "one sentence why this slot"
    }
  ],
  "questions": ["any context you need to schedule better"]
}`)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(236,253,245,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Tasks (one per line: "text | due:YYYY-MM-DD | priority:high | est:30")
        </div>
        <textarea
          value={tasks}
          onChange={e => setTasks(e.target.value)}
          rows={5}
          style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, padding: "10px 12px", color: "rgba(236,253,245,0.85)", fontFamily: "monospace", fontSize: 12, resize: "vertical", outline: "none" }}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(236,253,245,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          User Context (one per line)
        </div>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          rows={3}
          style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, padding: "10px 12px", color: "rgba(236,253,245,0.85)", fontFamily: "monospace", fontSize: 12, resize: "vertical", outline: "none" }}
        />
      </div>
      <button
        onClick={build}
        style={{ alignSelf: "flex-start", background: "linear-gradient(135deg, #059669, #10b981)", border: "none", borderRadius: 8, color: "white", padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
      >
        ⚡ Build Prompt
      </button>
      {output && (
        <pre style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, padding: 16, fontSize: 12, fontFamily: "monospace", overflowX: "auto", color: "#86efac", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
          {output}
        </pre>
      )}
    </div>
  )
}

// ─── Response decoder ─────────────────────────────────────────────────────────

const EXAMPLE_RESPONSE = `Got it! I've pushed the investor report to Sunday and added a quick email task for Sarah. Your morning is now yours for deep work.

<plan_update>
{"plan":[{"taskId":"clx2def","scheduledTime":"9:30 AM","estimatedMinutes":45,"reason":"Freed-up morning slot."},{"taskId":"clx3ghi","scheduledTime":"11:00 AM","estimatedMinutes":30,"reason":"Partnership call prep before lunch."}],"briefing":"Report deferred to Sunday — focus on roadmap review today.","newTasks":[{"text":"Email Sarah re: Q1 update","priority":"medium","deadline":"2026-03-21"}],"completedTaskIds":[],"deferredTaskIds":["clx1abc"]}
</plan_update>`

function ResponseDecoder() {
  const [raw, setRaw] = useState(EXAMPLE_RESPONSE)
  const [result, setResult] = useState("")

  function decode() {
    const planMatch = raw.match(/<plan_update>\s*([\s\S]*?)\s*<\/plan_update>/)
    const visible = raw.replace(/<plan_update>[\s\S]*?<\/plan_update>/g, "").trim()
    let out = "=== WHAT USER SEES IN CHAT BUBBLE ===\n"
    out += visible + "\n\n"

    if (planMatch) {
      out += "=== HIDDEN <plan_update> JSON PARSED ===\n"
      try {
        const parsed = JSON.parse(planMatch[1])
        out += JSON.stringify(parsed, null, 2) + "\n\n"
        out += "=== DB MUTATIONS (onFinish callback) ===\n"
        if (parsed.newTasks?.length) {
          out += `✅ prisma.task.create() × ${parsed.newTasks.length}\n`
          parsed.newTasks.forEach((t: { text: string; priority?: string }) => out += `   "${t.text}" (${t.priority || "medium"})\n`)
        }
        if (parsed.completedTaskIds?.length) out += `✅ prisma.task.updateMany({ completed: true }) — ${parsed.completedTaskIds.join(", ")}\n`
        if (parsed.deferredTaskIds?.length) out += `✅ prisma.task.update({ deferCount: increment(1) }) — ${parsed.deferredTaskIds.join(", ")}\n`
        if (parsed.plan?.length) out += `✅ prisma.dailySession.update({ plan: [...${parsed.plan.length} items] })\n`
        if (parsed.briefing) out += `✅ prisma.dailySession.update({ briefing: "..." })\n`
        out += "\n✅ router.refresh() — Next.js re-fetches server components"
      } catch {
        out += "ERROR: Invalid JSON in <plan_update> block"
      }
    } else {
      out += "⚠️  No <plan_update> block found — no DB changes triggered."
    }
    setResult(out)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(236,253,245,0.4)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Raw Claude response
      </div>
      <textarea
        value={raw}
        onChange={e => setRaw(e.target.value)}
        rows={10}
        style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, padding: "10px 12px", color: "rgba(236,253,245,0.85)", fontFamily: "monospace", fontSize: 12, resize: "vertical", outline: "none" }}
      />
      <button
        onClick={decode}
        style={{ alignSelf: "flex-start", background: "linear-gradient(135deg, #059669, #10b981)", border: "none", borderRadius: 8, color: "white", padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
      >
        🔍 Decode Response
      </button>
      {result && (
        <pre style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, padding: 16, fontSize: 12, fontFamily: "monospace", overflowX: "auto", color: "#86efac", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
          {result}
        </pre>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Plan Generation", "Chat Flow", "Prompts", "Simulator"] as const
type Tab = typeof TABS[number]

export default function AIFlowPage() {
  const [tab, setTab] = useState<Tab>("Overview")

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800 }}>AI Integration</h1>
        <p style={{ fontSize: 14, color: "rgba(16,185,129,0.6)", marginTop: 4 }}>
          How Claude powers DayMind — a deep dive for devs
        </p>
      </div>

      {/* Tab bar */}
      <div className="animate-slide-up" style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? "linear-gradient(135deg, #059669, #10b981)" : "var(--surface-2)",
              border: `1px solid ${tab === t ? "transparent" : "var(--border)"}`,
              color: tab === t ? "white" : "rgba(236,253,245,0.5)",
              padding: "7px 16px", borderRadius: 10, cursor: "pointer",
              fontSize: 13, fontWeight: 500, transition: "all 0.2s",
              boxShadow: tab === t ? "0 0 16px rgba(16,185,129,0.3)" : "none",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "Overview" && (
        <div className="animate-fade-in">
          {/* Tech stack */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { icon: "🤖", name: "Claude Sonnet 4.6", sub: "AI model" },
              { icon: "⚡", name: "Vercel AI SDK", sub: "ai@6.0.116" },
              { icon: "🔗", name: "@ai-sdk/anthropic", sub: "v3.0.58" },
              { icon: "🌊", name: "Streaming", sub: "streamText + useChat" },
              { icon: "💭", name: "Extended Thinking", sub: "adaptive mode" },
              { icon: "🗄️", name: "Prisma + Postgres", sub: "plan persistence" },
            ].map(item => (
              <div
                key={item.name}
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, textAlign: "center", transition: "all 0.2s" }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(236,253,245,0.9)" }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "rgba(236,253,245,0.4)", marginTop: 2 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Two flows */}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>Two AI Flows</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <Card style={{ cursor: "pointer" }} >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🗓️</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Plan Generation</div>
              <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", marginBottom: 10 }}>
                Claude analyses your tasks + context with extended thinking and returns a structured JSON schedule.
              </p>
              <Pill color="orange">Server Action</Pill>
              <Pill color="purple">Streaming</Pill>
              <Pill color="green">Extended Thinking</Pill>
            </Card>
            <Card style={{ cursor: "pointer" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Chat Adjustments</div>
              <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", marginBottom: 10 }}>
                You type a message; Claude streams a reply + hidden JSON block that mutates your plan and tasks in real time.
              </p>
              <Pill color="blue">API Route</Pill>
              <Pill color="purple">useChat Hook</Pill>
              <Pill color="pink">Plan Updates</Pill>
            </Card>
          </div>

          {/* File map */}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>Where AI Code Lives</h2>
          <Card>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "rgba(236,253,245,0.4)", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "6px 12px 6px 0" }}>File</th>
                  <th style={{ padding: "6px 12px 6px 0" }}>Role</th>
                  <th style={{ padding: "6px 0" }}>Key call</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { file: "app/actions/ai.ts", role: "Core AI logic", key: "anthropic.messages.stream()", color: "orange" as const },
                  { file: "app/api/chat/route.ts", role: "Streaming chat endpoint", key: "streamText()", color: "blue" as const },
                  { file: "components/ChatInput.tsx", role: "Frontend chat UI", key: "useChat()", color: "purple" as const },
                  { file: "app/api/cron/morning-briefing", role: "Daily cron trigger", key: "generateDayPlan()", color: "green" as const },
                  { file: "components/DayPlan.tsx", role: "Schedule visualiser", key: "Renders AI output", color: "teal" as const },
                ].map((row, i) => (
                  <tr key={row.file} style={{ borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <td style={{ padding: "8px 12px 8px 0", fontFamily: "monospace", color: "#6ee7b7" }}>{row.file}</td>
                    <td style={{ padding: "8px 12px 8px 0", color: "rgba(236,253,245,0.5)" }}>{row.role}</td>
                    <td style={{ padding: "8px 0" }}><Pill color={row.color}>{row.key}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── Plan Generation ── */}
      {tab === "Plan Generation" && (
        <div className="animate-fade-in">
          <StatusBar dot="purple">Triggered on dashboard load · Cached per day · Force-regeneratable</StatusBar>

          <div style={{ marginBottom: 24 }}>
            <FlowStep num={1} color="rgba(249,115,22,0.5)" title="User visits /dashboard" summary="Next.js server component calls generateDayPlan(userId)">
              This is a <strong>Server Component</strong> — no client JS needed. The function is imported from <code>app/actions/ai.ts</code>. If a plan already exists in <code>DailySession</code> for today, it returns immediately without calling Claude.
            </FlowStep>
            <FlowStep num={2} color="rgba(59,130,246,0.5)" title="Cache check in Postgres" summary="Query DailySession for today. If plan exists → return immediately, no Claude call.">
              <CodeBlock>
                {`const existing = await prisma.dailySession.findFirst({
  where: { userId, date: { gte: today, lt: tomorrow } }
})
if (existing?.plan) {
  return { id: existing.id, briefing: existing.briefing,
           plan: existing.plan as PlanItem[], questions: [] }
  // ✅ Claude NOT called — cached result returned
}`}
              </CodeBlock>
            </FlowStep>
            <FlowStep num={3} color="rgba(20,184,166,0.5)" title="Fetch tasks + user context" summary="Parallel DB queries — incomplete tasks by deadline, plus stored context answers.">
              <CodeBlock>
                {`const [tasks, contexts] = await Promise.all([
  prisma.task.findMany({
    where: { userId, completed: false },
    orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
  }),
  prisma.userContext.findMany({ where: { userId } }),
])`}
              </CodeBlock>
              <strong>UserContext</strong> stores answers to Claude's previous questions — like "How long does writing a proposal take you?" These shape the schedule each day.
            </FlowStep>
            <FlowStep num={4} color="rgba(16,185,129,0.5)" title="Build the user prompt" summary='Tasks serialised with IDs, deadlines, priorities, defer counts + a strict JSON schema.'>
              Each task becomes a line like:<br />
              <code style={{ color: "#86efac", display: "block", margin: "8px 0" }}>- ID: clx1abc | "Write Q1 report" | Due: Mar 25 | Priority: high | Deferred 1x | Est: 90min</code>
              Then wrapped with the current date/time and user context, with an explicit JSON schema Claude must follow exactly.
            </FlowStep>
            <FlowStep num={5} color="rgba(236,72,153,0.5)" title="Call Claude with extended thinking" summary='Direct Anthropic SDK with thinking: { type: "adaptive" } enabled.'>
              <CodeBlock>
                {`const stream = anthropic.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  thinking: { type: "adaptive" },  // 🧠 Extended thinking on!
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: userPrompt }],
})
const response = await stream.finalMessage()`}
              </CodeBlock>
              <Highlight title="💡 Why extended thinking?">
                With <code>adaptive</code> thinking, Claude decides whether to reason step-by-step before answering. For scheduling this means it can weigh deadline urgency, energy levels, and task dependencies before locking in times. The thinking tokens are invisible in the output — only the final JSON schedule appears.
              </Highlight>
            </FlowStep>
            <FlowStep num={6} color="rgba(34,197,94,0.5)" title="Parse JSON + save to DB" summary="Extract JSON from Claude's text, validate, upsert DailySession.">
              <CodeBlock>
                {`const rawText = response.content.find(b => b.type === "text")?.text ?? ""
const jsonMatch = rawText.match(/\\{[\\s\\S]*\\}/)
const planData = JSON.parse(jsonMatch[0])

await prisma.dailySession.create({
  data: { userId, date: today, briefing: planData.briefing,
          plan: planData.plan as object[], userInputs: [] }
})`}
              </CodeBlock>
              The plan is stored as Postgres JSON — future requests hit the DB, not Claude.
            </FlowStep>
            <FlowStep num={7} color="rgba(249,115,22,0.5)" title="Render on dashboard" summary="DayPlan visualises the schedule; ContextQuestions shows Claude's follow-up questions.">
              The returned <code>DayPlanResult</code> contains: <strong>briefing</strong> (shown at top), <strong>plan[]</strong> (rendered as a timeline), and <strong>questions[]</strong> shown by <code>ContextQuestions</code> — answers are saved back to the <code>UserContext</code> table for future plans.
            </FlowStep>
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "24px 0" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>What Claude Receives &amp; Returns</h2>
          <TabGroup tabs={[
            {
              label: "System Prompt",
              content: (
                <>
                  <CodeBlock>{`"You are a personal chief of staff. You know everything about the user's
tasks and context. Your job is to produce a realistic, time-aware daily
schedule. Be direct and practical. Never pad the schedule — if something
takes 20 minutes, say 20 minutes."`}</CodeBlock>
                  <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)" }}>Short and direct. Claude's role is narrowly defined — no open-ended assistant behaviour, just scheduling.</p>
                </>
              ),
            },
            {
              label: "User Prompt Example",
              content: (
                <CodeBlock>{`Today is Saturday, March 21, 2026 at 09:14 AM.

MY TASKS:
- ID: clx1abc | "Write Q1 investor report" | Due: Mar 25 | Priority: high | Deferred 1x | Est: 90min
- ID: clx2def | "Review product roadmap deck" | Est: 45min
- ID: clx3ghi | "Call Alex re: partnership" | Due: Mar 22

MY CONTEXT:
- Best focus time: mornings before noon
- Writing reports: takes me 2+ hours because I revise a lot

Produce a day plan. Return ONLY valid JSON...`}</CodeBlock>
              ),
            },
            {
              label: "Claude's Response",
              content: (
                <CodeBlock>{`{
  "briefing": "The Q1 investor report is your most urgent deliverable with a Tuesday deadline,
               and your context tells me you revise heavily — blocking morning time is non-negotiable.",
  "plan": [
    { "taskId": "clx1abc", "scheduledTime": "9:30 AM", "estimatedMinutes": 120,
      "reason": "Peak focus window; you've deferred this once, can't slip again." },
    { "taskId": "clx3ghi", "scheduledTime": "12:00 PM", "estimatedMinutes": 30,
      "reason": "Prep notes for tomorrow's call while report is still fresh." },
    { "taskId": "clx2def", "scheduledTime": "2:00 PM", "estimatedMinutes": 45,
      "reason": "Lower-stakes review fits the post-lunch energy dip." }
  ],
  "questions": [
    "Do you have any hard stops today that would block calendar slots?",
    "Would you prefer the landing page copy deferred to Monday?"
  ]
}`}</CodeBlock>
              ),
            },
          ]} />
        </div>
      )}

      {/* ── Chat Flow ── */}
      {tab === "Chat Flow" && (
        <div className="animate-fade-in">
          <StatusBar dot="green">Streaming via Vercel AI SDK · Plan updates in onFinish callback · Dashboard auto-refreshes</StatusBar>

          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>Architecture</h2>
          <ArchRow
            left={{ icon: "💻", name: "ChatInput.tsx", sub: "useChat() hook\nDefaultChatTransport" }}
            right={{ icon: "🌐", name: "POST /api/chat", sub: "streamText()\nonFinish → DB writes" }}
          />
          <ArchRow
            left={{ icon: "🤖", name: "Claude Sonnet 4.6", sub: "Streams text + hidden\n<plan_update> JSON" }}
            right={{ icon: "🗄️", name: "Postgres", sub: "DailySession updated\nTasks created/completed" }}
          />

          <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>Step-by-step</h2>

          <FlowStep num={1} color="rgba(59,130,246,0.5)" title='User types a message' summary='"Push the report to tomorrow and add a task to email Sarah"'>
            <CodeBlock>{`// ChatInput.tsx
sendMessage({ text })  // from useChat hook

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: "/api/chat",
    body: { tasks, currentPlan, sessionId },
    // ↑ Tasks + plan sent on EVERY request for full context
  }),
  onFinish: () => router.refresh(),
})`}</CodeBlock>
          </FlowStep>

          <FlowStep num={2} color="rgba(16,185,129,0.5)" title="API Route builds context" summary="Serialises current tasks and plan into a rich system prompt.">
            The current task list AND day plan are injected on every request — Claude always has ground truth about the current state. No "stale context" bugs.
          </FlowStep>

          <FlowStep num={3} color="rgba(236,72,153,0.5)" title="Claude streams with a hidden payload" summary='Responds in 1-3 conversational sentences + a hidden <plan_update> JSON block.'>
            <CodeBlock>{`// What Claude sends in a single streamed response:

// Visible conversational part ↓
Got it! I've pushed the investor report to Sunday and
added an email task for Sarah. Your afternoon is clearer.

// Hidden machine-readable block ↓
<plan_update>
{"plan":[...],"briefing":"...","newTasks":[{"text":"Email Sarah..."}],
 "completedTaskIds":[],"deferredTaskIds":["clx1abc"]}
</plan_update>`}</CodeBlock>
            <Highlight title="🎭 The dual-output trick">
              The system prompt instructs Claude to always end with a <code>&lt;plan_update&gt;</code> block. The frontend's <code>stripPlanUpdate(text)</code> removes it before rendering the bubble. The user sees only natural conversation — not the JSON machinery.
            </Highlight>
          </FlowStep>

          <FlowStep num={4} color="rgba(34,197,94,0.5)" title="onFinish: apply DB mutations" summary="After streaming completes, the route parses the JSON and applies creates/completions/deferrals.">
            <CodeBlock>{`onFinish: async ({ text }) => {
  const planMatch = text.match(/<plan_update>([\s\S]*?)<\/plan_update>/)
  const update = JSON.parse(planMatch[1])

  if (update.newTasks?.length)        // prisma.task.create() ×N
  if (update.completedTaskIds?.length) // prisma.task.updateMany({ completed: true })
  if (update.deferredTaskIds?.length)  // prisma.task.update({ deferCount: +1 })
  if (update.plan || update.briefing)  // prisma.dailySession.update()
}`}</CodeBlock>
          </FlowStep>

          <FlowStep num={5} color="rgba(249,115,22,0.5)" title="router.refresh() → UI updates" summary="useChat's onFinish triggers a Next.js router refresh, reloading all server components.">
            <code>router.refresh()</code> causes Next.js to re-fetch all server components for the current route without a full page reload. <code>DayPlan</code> and <code>ContextQuestions</code> re-render with fresh Postgres data — reflecting exactly what Claude just changed.
          </FlowStep>

          <div style={{ height: 1, background: "var(--border)", margin: "24px 0" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>Live Demo</h2>
          <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", marginBottom: 12 }}>Click a preset or type your own message to see the streaming and DB operations.</p>
          <ChatDemo />
        </div>
      )}

      {/* ── Prompts ── */}
      {tab === "Prompts" && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>Plan Generation System Prompt</h2>
          <Card>
            <div style={{ marginBottom: 12 }}><Pill color="orange">app/actions/ai.ts</Pill><Pill color="green">generateDayPlan()</Pill></div>
            <CodeBlock>{`"You are a personal chief of staff. You know everything about the user's
tasks and context. Your job is to produce a realistic, time-aware daily
schedule. Be direct and practical. Never pad the schedule — if something
takes 20 minutes, say 20 minutes."`}</CodeBlock>
            <Highlight title="🎯 Why this prompt works">
              Three key constraints: <strong>role</strong> (chief of staff, not generic assistant), <strong>context omniscience</strong> (you know everything — no hedging), and <strong>anti-padding rule</strong> (prevents over-estimating to appear safe). The conciseness keeps JSON tight.
            </Highlight>
          </Card>

          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12, marginTop: 8 }}>Chat System Prompt</h2>
          <Card>
            <div style={{ marginBottom: 12 }}><Pill color="blue">app/api/chat/route.ts</Pill><Pill color="purple">POST /api/chat</Pill></div>
            <CodeBlock>{`You are DayMind, a personal chief of staff AI.

CURRENT TASK LIST:
\${tasksText}

CURRENT DAY PLAN:
\${planText}

When the user sends a message:
- Respond conversationally in 1-3 sentences
- Always end your response with a JSON block on its own line:
<plan_update>
{"plan":[...],"briefing":"...","newTasks":[...],"completedTaskIds":[],"deferredTaskIds":[]}
</plan_update>

Rules:
- "plan": always return the FULL updated plan (all tasks)
- "newTasks": only if user is adding something new
- "completedTaskIds": mark as done
- "deferredTaskIds": defer to tomorrow

Keep your reply ABOVE the <plan_update> block. Do not explain the JSON.`}</CodeBlock>
            <Highlight title="🎭 Dual-output pattern">
              Claude produces two simultaneous outputs in one response: a human-readable reply AND a machine-parseable JSON block. The XML wrapper makes regex extraction reliable. "Do not explain the JSON" prevents Claude from narrating the data structure.
            </Highlight>
          </Card>

          <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>Prompt Engineering Patterns</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: "📐", title: "Strict Output Schema", body: "Both prompts provide an exact JSON shape. This prevents hallucinated field names and makes parsing reliable — Claude's output is effectively typed." },
              { icon: "🏷️", title: "ID Anchoring", body: "Tasks are sent with their real DB IDs (clx1abc). Claude uses these exact strings — no fuzzy matching needed when writing back to the DB." },
              { icon: "🧱", title: "Full Context Per Request", body: "Current tasks AND plan injected on every chat request. Claude always has ground truth — no 'Claude might have the wrong plan' bugs." },
              { icon: "🚫", title: "Negative Instructions", body: '"Never pad the schedule" and "Do not explain the JSON" use negation to suppress common LLM tendencies. More effective than hoping Claude avoids them.' },
            ].map(p => (
              <Card key={p.title}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{p.title}</div>
                <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", margin: 0 }}>{p.body}</p>
              </Card>
            ))}
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>TypeScript Types Claude Must Follow</h2>
          <TabGroup tabs={[
            {
              label: "PlanItem",
              content: <CodeBlock>{`export type PlanItem = {
  taskId: string            // must match a real Task.id in DB
  scheduledTime: string    // e.g. "9:00 AM"
  estimatedMinutes: number // integer minutes
  reason: string           // one sentence — shown in UI
}`}</CodeBlock>,
            },
            {
              label: "DayPlanResult",
              content: <CodeBlock>{`export type DayPlanResult = {
  id: string               // DailySession.id
  briefing: string | null  // shown at top of dashboard
  plan: PlanItem[]         // ordered schedule
  questions: string[]      // Claude's follow-up questions
}`}</CodeBlock>,
            },
            {
              label: "ChatPlanUpdate",
              content: <CodeBlock>{`// Content of <plan_update> block in chat responses
{
  plan?: PlanItem[]          // FULL updated plan (always all items)
  briefing?: string         // updated 1-2 sentence briefing
  newTasks?: Array<{
    text: string
    deadline?: string       // YYYY-MM-DD format
    priority?: string       // "low" | "medium" | "high"
    estimatedMinutes?: number
  }>
  completedTaskIds?: string[]
  deferredTaskIds?: string[]
}`}</CodeBlock>,
            },
          ]} />
        </div>
      )}

      {/* ── Simulator ── */}
      {tab === "Simulator" && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 8 }}>Prompt Builder</h2>
          <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", marginBottom: 16 }}>
            See how the system constructs the user prompt from task data — the same logic as <code>generateDayPlan()</code>.
          </p>
          <Card>
            <PromptSimulator />
          </Card>

          <div style={{ height: 1, background: "var(--border)", margin: "24px 0" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 8 }}>Response Decoder</h2>
          <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", marginBottom: 16 }}>
            Paste a raw Claude chat response to see what the user sees vs. what triggers DB writes.
          </p>
          <Card>
            <ResponseDecoder />
          </Card>

          <div style={{ height: 1, background: "var(--border)", margin: "24px 0" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7", marginBottom: 12 }}>useChat Status States</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Card>
              <StatusBar dot="green"><code>idle</code></StatusBar>
              <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", margin: 0 }}>No request in flight. Input enabled, send button active.</p>
            </Card>
            <Card>
              <StatusBar dot="orange"><code>submitted</code></StatusBar>
              <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", margin: 0 }}>Request sent, waiting for first token. Spinner shows, input disabled.</p>
            </Card>
          </div>
          <Card>
            <StatusBar dot="purple"><code>streaming</code></StatusBar>
            <p style={{ fontSize: 13, color: "rgba(236,253,245,0.5)", margin: 0 }}>Tokens arriving. Text appears incrementally in the message bubble. Input still disabled. After the last token, <code>onFinish</code> fires → DB writes → <code>router.refresh()</code> → status returns to <code>idle</code>.</p>
          </Card>
        </div>
      )}
    </div>
  )
}
