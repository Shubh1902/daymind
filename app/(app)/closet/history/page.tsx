import ClosetSubNav from "@/components/closet/ClosetSubNav"
import OutfitHistory from "@/components/closet/OutfitHistory"

export default function HistoryPage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Outfit History</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Track what you wear &mdash; spot repeats &amp; forgotten favorites
        </p>
      </div>
      <ClosetSubNav />
      <div className="animate-slide-up delay-100">
        <OutfitHistory />
      </div>
    </div>
  )
}
