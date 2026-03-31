import ClosetSubNav from "@/components/closet/ClosetSubNav"
import WishlistView from "@/components/closet/WishlistView"

export default function WishlistPage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Wishlist</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Track what you want to buy &mdash; AI can find wardrobe gaps for you
        </p>
      </div>
      <ClosetSubNav />
      <div className="animate-slide-up delay-100">
        <WishlistView />
      </div>
    </div>
  )
}
