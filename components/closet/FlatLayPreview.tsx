"use client"

import { useRef, useEffect } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type OutfitItem = {
  id: string
  imageData: string
  category: string
  name: string | null
}

interface Props {
  items: OutfitItem[]
  size?: number
}

// Layout positions for each category on the flat-lay canvas
const LAYOUT: Record<string, { x: number; y: number; w: number; h: number }> = {
  tops:        { x: 0.25, y: 0.05, w: 0.50, h: 0.40 },
  dresses:     { x: 0.20, y: 0.05, w: 0.60, h: 0.70 },
  bottoms:     { x: 0.25, y: 0.42, w: 0.50, h: 0.38 },
  shoes:       { x: 0.30, y: 0.78, w: 0.40, h: 0.20 },
  accessories: { x: 0.02, y: 0.05, w: 0.22, h: 0.22 },
}

export default function FlatLayPreview({ items, size = 400 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    renderFlatLay()
  }, [items])

  async function renderFlatLay() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = size
    canvas.height = size

    // Clean white background
    ctx.fillStyle = "#FAFAFA"
    ctx.fillRect(0, 0, size, size)

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(249, 115, 22, 0.04)"
    ctx.lineWidth = 1
    for (let i = 0; i < size; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke()
    }

    // Sort items by layout order: accessories, tops/dresses, bottoms, shoes
    const order = ["accessories", "tops", "dresses", "bottoms", "shoes"]
    const sorted = [...items].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))

    // If there's a dress, skip tops+bottoms layout slots
    const hasDress = sorted.some((i) => i.category === "dresses")

    for (const item of sorted) {
      // Skip tops/bottoms if a dress is present
      if (hasDress && (item.category === "tops" || item.category === "bottoms")) continue

      const layout = LAYOUT[item.category] ?? LAYOUT.accessories
      const x = layout.x * size
      const y = layout.y * size
      const w = layout.w * size
      const h = layout.h * size

      try {
        const img = await loadImage(item.imageData)
        // Fit image within the layout box maintaining aspect ratio
        const scale = Math.min(w / img.width, h / img.height)
        const iw = img.width * scale
        const ih = img.height * scale
        const ix = x + (w - iw) / 2
        const iy = y + (h - ih) / 2

        // Subtle shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.08)"
        ctx.shadowBlur = 12
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 4

        ctx.drawImage(img, ix, iy, iw, ih)

        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      } catch {
        // Skip items that fail to load
      }
    }

    // Watermark
    ctx.fillStyle = "rgba(249, 115, 22, 0.08)"
    ctx.font = `${size * 0.025}px system-ui`
    ctx.textAlign = "right"
    ctx.fillText("DayMind Closet", size - 10, size - 10)
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-auto"
        style={{ filter: getProductDisplayFilter() }}
      />
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm" style={{ color: "rgba(249, 115, 22, 0.4)" }}>Add items to see flat-lay preview</p>
        </div>
      )}
    </div>
  )
}
