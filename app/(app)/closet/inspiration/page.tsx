import ClosetSubNav from "@/components/closet/ClosetSubNav"
import InspirationFeed from "@/components/closet/InspirationFeed"

export default function InspirationPage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Style Inspiration</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Trending looks you can recreate with your wardrobe
        </p>
      </div>
      <ClosetSubNav />
      <div className="animate-slide-up delay-100">
        <InspirationFeed />
      </div>
    </div>
  )
}
