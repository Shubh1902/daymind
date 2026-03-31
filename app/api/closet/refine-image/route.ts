import { NextRequest } from "next/server"
import Replicate from "replicate"

/**
 * AI-powered clothing image refinement.
 *
 * Pipeline:
 * 1. Background removal — isolate the garment
 * 2. Image-to-image refinement — remove wrinkles, enhance fabric detail,
 *    simulate professional studio lighting
 * 3. Return the refined product-shot image
 *
 * Requires REPLICATE_API_TOKEN env var.
 */

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return Response.json({ error: "REPLICATE_API_TOKEN not set" }, { status: 500 })
  }

  const { imageData } = await request.json()
  if (!imageData) {
    return Response.json({ error: "imageData is required" }, { status: 400 })
  }

  const replicate = new Replicate({ auth: token })

  try {
    // ── Step 1: Remove background ──────────────────────
    // Uses BRIA RMBG 2.0 (fast, high quality, free on Replicate)
    const bgRemovedResult = await replicate.run(
      "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900571aeaa54f912b" as `${string}/${string}:${string}`,
      {
        input: {
          image: imageData,
        },
      }
    )

    // Download the bg-removed image as base64
    const bgRemovedUrl = extractUrl(bgRemovedResult)
    const bgRemovedB64 = await urlToDataUri(bgRemovedUrl)

    // ── Step 2: Refine with image-to-image ─────────────
    // Use Stable Diffusion img2img to clean up the garment:
    //   - Remove wrinkles and creases
    //   - Enhance fabric texture
    //   - Add professional studio lighting
    //   - Keep the garment identity intact (low denoising strength)
    const refinedResult = await replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as `${string}/${string}:${string}`,
      {
        input: {
          image: bgRemovedB64,
          prompt:
            "professional fashion e-commerce product photo, clean wrinkle-free garment, " +
            "studio lighting, soft shadow, pure white background, high-end fashion catalog, " +
            "crisp fabric detail, commercial product photography, 4k, sharp focus",
          negative_prompt:
            "wrinkled, creased, messy, dirty, low quality, blurry, distorted, " +
            "deformed, watermark, text, logo, person, mannequin, hanger",
          prompt_strength: 0.35,
          num_inference_steps: 25,
          guidance_scale: 7.5,
          width: 1024,
          height: 1024,
          scheduler: "K_EULER",
        },
      }
    )

    const refinedUrl = extractUrl(refinedResult)
    const refinedB64 = await urlToDataUri(refinedUrl)

    return Response.json({
      refined: refinedB64,
      bgRemoved: bgRemovedB64,
    })
  } catch (error) {
    console.error("Image refinement error:", error)

    // If img2img fails, try returning just the bg-removed version
    try {
      const bgRemovedFallback = await replicate.run(
        "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900571aeaa54f912b" as `${string}/${string}:${string}`,
        { input: { image: imageData } }
      )
      const bgRemovedFallbackUrl = extractUrl(bgRemovedFallback)
      const bgRemovedB64 = await urlToDataUri(bgRemovedFallbackUrl)

      return Response.json({
        refined: bgRemovedB64,
        bgRemoved: bgRemovedB64,
        partial: true,
      })
    } catch {
      return Response.json({ error: "Image refinement failed" }, { status: 500 })
    }
  }
}

/**
 * Extract URL string from various Replicate output formats
 */
function extractUrl(result: unknown): string {
  if (typeof result === "string") return result
  if (Array.isArray(result)) return String(result[0])
  if (result && typeof result === "object" && "output" in result) {
    return String((result as Record<string, unknown>).output)
  }
  return String(result)
}

/**
 * Download an image URL and convert to data URI
 */
async function urlToDataUri(url: string): Promise<string> {
  // If it's already a data URI, return as-is
  if (url.startsWith("data:")) return url

  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  const contentType = response.headers.get("content-type") ?? "image/png"
  return `data:${contentType};base64,${base64}`
}
