import HouseholdLogForm from "@/components/household/HouseholdLogForm"
import Link from "next/link"

export default function HouseholdLogPage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center gap-3 mb-6 animate-slide-up">
        <Link
          href="/household"
          className="p-2 rounded-lg"
          style={{ background: "#f3f4f6", color: "#374151" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gradient">Log Chore</h1>
          <p className="text-xs" style={{ color: "#9ca3af" }}>Record who did what and for how long</p>
        </div>
      </div>

      <div className="animate-slide-up delay-100">
        <HouseholdLogForm />
      </div>
    </div>
  )
}
