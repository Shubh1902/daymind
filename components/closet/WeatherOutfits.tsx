"use client"

import { useState, useEffect } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type WeatherData = {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
  icon: string
}

type OutfitSuggestion = {
  name: string
  itemIds: string[]
  reason: string
  layeringTip?: string
  items: { id: string; name: string; category: string; imageData: string }[]
}

type WeatherResult = {
  outfits: OutfitSuggestion[]
  weatherAdvice: string
}

const WEATHER_ICONS: Record<string, string> = {
  clear: "☀️",
  sunny: "☀️",
  clouds: "☁️",
  cloudy: "☁️",
  rain: "🌧️",
  drizzle: "🌦️",
  thunderstorm: "⛈️",
  snow: "❄️",
  mist: "🌫️",
  fog: "🌫️",
}

function getWeatherIcon(condition: string): string {
  const lower = condition.toLowerCase()
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return "🌡️"
}

export default function WeatherOutfits() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [result, setResult] = useState<WeatherResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Manual override
  const [manualTemp, setManualTemp] = useState("")
  const [manualCondition, setManualCondition] = useState("clear")
  const [useManual, setUseManual] = useState(false)

  useEffect(() => {
    fetchWeather()
  }, [])

  async function fetchWeather() {
    setWeatherLoading(true)
    try {
      // Try browser geolocation
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      })
      const { latitude, longitude } = pos.coords

      // Use Open-Meteo (free, no API key needed)
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
      )
      const data = await res.json()
      const current = data.current

      // WMO weather codes to conditions
      const code = current.weather_code
      let condition = "clear"
      if (code >= 1 && code <= 3) condition = "cloudy"
      else if (code >= 45 && code <= 48) condition = "foggy"
      else if (code >= 51 && code <= 67) condition = "rainy"
      else if (code >= 71 && code <= 77) condition = "snowy"
      else if (code >= 80 && code <= 82) condition = "rainy"
      else if (code >= 95) condition = "thunderstorm"

      // Reverse geocode for city name
      let location = `${latitude.toFixed(1)}°, ${longitude.toFixed(1)}°`
      try {
        const geoRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`
        )
        const geoData = await geoRes.json()
        if (geoData.timezone) {
          location = geoData.timezone.split("/").pop()?.replace(/_/g, " ") ?? location
        }
      } catch { /* use coords */ }

      setWeather({
        temperature: Math.round(current.temperature_2m),
        condition,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        location,
        icon: getWeatherIcon(condition),
      })
    } catch {
      // Fall back to manual
      setUseManual(true)
    }
    setWeatherLoading(false)
  }

  async function getSuggestions() {
    setLoading(true)
    setError(null)
    setResult(null)

    const temp = useManual ? Number(manualTemp) : weather?.temperature
    const cond = useManual ? manualCondition : weather?.condition

    if (temp === undefined || isNaN(temp as number)) {
      setError("Please enter a temperature")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/closet/weather-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: temp,
          condition: cond,
          humidity: weather?.humidity ?? 50,
          windSpeed: weather?.windSpeed ?? 0,
          location: weather?.location,
        }),
      })
      if (!res.ok) throw new Error()
      setResult(await res.json())
    } catch {
      setError("Could not get suggestions. Try again.")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* Weather card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(168, 85, 247, 0.06))",
          border: "1px solid rgba(56, 189, 248, 0.15)",
        }}
      >
        {weatherLoading ? (
          <div className="flex items-center gap-2 py-4">
            <span className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm" style={{ color: "rgba(56, 189, 248, 0.7)" }}>Getting your weather...</span>
          </div>
        ) : weather && !useManual ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{weather.icon}</span>
                <div>
                  <p className="text-3xl font-bold" style={{ color: "#431407" }}>{weather.temperature}°C</p>
                  <p className="text-xs capitalize" style={{ color: "rgba(56, 189, 248, 0.7)" }}>{weather.condition}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: "#431407" }}>{weather.location}</p>
                <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
                  💧 {weather.humidity}% · 💨 {weather.windSpeed} km/h
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={getSuggestions}
                disabled={loading}
                className="flex-1 btn-primary text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>✨</span>
                )}
                What Should I Wear?
              </button>
              <button
                onClick={() => setUseManual(true)}
                className="px-3 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: "var(--surface-2)", color: "rgba(249, 115, 22, 0.5)", border: "1px solid var(--border)" }}
              >
                Manual
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: "#431407" }}>Enter Weather</p>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={manualTemp}
                onChange={(e) => setManualTemp(e.target.value)}
                placeholder="Temp °C"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#431407" }}
              />
              <select
                value={manualCondition}
                onChange={(e) => setManualCondition(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#431407" }}
              >
                <option value="clear">Clear / Sunny</option>
                <option value="cloudy">Cloudy</option>
                <option value="rainy">Rainy</option>
                <option value="snowy">Snowy</option>
                <option value="windy">Windy</option>
                <option value="foggy">Foggy</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={getSuggestions}
                disabled={loading || !manualTemp}
                className="flex-1 btn-primary text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>✨</span>
                )}
                Suggest Outfits
              </button>
              {weather && (
                <button
                  onClick={() => setUseManual(false)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium"
                  style={{ background: "var(--surface-2)", color: "rgba(249, 115, 22, 0.5)", border: "1px solid var(--border)" }}
                >
                  Auto
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: "#fb7185" }}>{error}</p>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Weather advice */}
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(56, 189, 248, 0.06)", border: "1px solid rgba(56, 189, 248, 0.1)" }}>
            <p className="text-sm" style={{ color: "#431407" }}>💡 {result.weatherAdvice}</p>
          </div>

          {/* Outfit suggestions */}
          {result.outfits.map((outfit, i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: "#431407" }}>{outfit.name}</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
                {outfit.items?.map((item) => (
                  <div key={item.id} className="shrink-0 w-20 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <div className="aspect-square" style={{ background: "#FAFAFA" }}>
                      <img
                        src={item.imageData}
                        alt={item.name ?? item.category}
                        className="w-full h-full object-contain"
                        style={{ filter: getProductDisplayFilter() }}
                      />
                    </div>
                    <p className="text-xs truncate px-1 py-0.5" style={{ color: "#431407" }}>{item.name ?? item.category}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.6)" }}>{outfit.reason}</p>
              {outfit.layeringTip && (
                <p className="text-xs mt-1 italic" style={{ color: "rgba(168, 85, 247, 0.6)" }}>
                  🧥 {outfit.layeringTip}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
