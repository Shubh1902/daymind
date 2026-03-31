import ClosetSubNav from "@/components/closet/ClosetSubNav"
import WeatherOutfits from "@/components/closet/WeatherOutfits"

export default function WeatherPage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Weather Outfits</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          AI picks outfits matched to today&apos;s weather
        </p>
      </div>
      <ClosetSubNav />
      <div className="animate-slide-up delay-100">
        <WeatherOutfits />
      </div>
    </div>
  )
}
