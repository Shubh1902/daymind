import { NextRequest } from "next/server"
import Replicate from "replicate"

/**
 * AI Virtual Try-On endpoint.
 *
 * Takes clothing item image(s) and generates a photo of an AI model wearing them.
 * Uses Replicate's IDM-VTON (Virtual Try-On Network) model.
 *
 * Requires REPLICATE_API_TOKEN env var.
 */

// Default model image — a full-body neutral pose shot (Unsplash, free license)
const DEFAULT_MODEL_IMAGE =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=768&h=1024&fit=crop&q=80"

// Map app categories to IDM-VTON category enum values
const CATEGORY_MAP: Record<string, "upper_body" | "lower_body" | "dresses"> = {
  tops: "upper_body",
  bottoms: "lower_body",
  dresses: "dresses",
}

// Descriptive garment text for better try-on results
const GARMENT_DESC_MAP: Record<string, string> = {
  tops: "Upper body garment, top or shirt",
  bottoms: "Lower body garment, pants or skirt",
  dresses: "Full body dress",
}

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return Response.json({ error: "REPLICATE_API_TOKEN not set" }, { status: 500 })
  }

  const { garmentImage, garmentItemId, modelImage, category } = await request.json()

  if (!garmentImage && !garmentItemId) {
    return Response.json({ error: "garmentImage or garmentItemId is required" }, { status: 400 })
  }

  // Resolve garment image — always need base64 data URI for Replicate
  let resolvedGarmentImage = garmentImage
  if (garmentItemId && (!garmentImage || !garmentImage.startsWith("data:"))) {
    const { prisma } = await import("@/lib/prisma")
    const item = await prisma.clothingItem.findUnique({
      where: { id: garmentItemId },
      select: { imageData: true },
    })
    if (!item?.imageData) {
      return Response.json({ error: "Item not found" }, { status: 404 })
    }
    resolvedGarmentImage = item.imageData
  }

  // Safety check: Replicate needs an actual image, not a relative URL
  if (resolvedGarmentImage && !resolvedGarmentImage.startsWith("data:") && !resolvedGarmentImage.startsWith("http")) {
    return Response.json({ error: "Invalid garment image format" }, { status: 400 })
  }

  const replicate = new Replicate({ auth: token })

  const idmCategory = CATEGORY_MAP[category] ?? "upper_body"
  const garmentDesc = GARMENT_DESC_MAP[category] ?? "Clothing item"

  try {
    console.log("[try-on] Starting IDM-VTON | category:", idmCategory, "| token:", token.slice(0, 6) + "...")

    const result = await replicate.run(
      "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985" as `${string}/${string}:${string}`,
      {
        input: {
          human_img: modelImage ?? DEFAULT_MODEL_IMAGE,
          garm_img: resolvedGarmentImage,
          garment_des: garmentDesc,
          category: idmCategory,
          crop: true,       // Crop to handle non-3:4 images
          steps: 30,        // Denoising steps (1-40)
          seed: 42,
        },
      }
    )

    console.log("[try-on] IDM-VTON succeeded, result type:", typeof result, Array.isArray(result) ? `array[${(result as unknown[]).length}]` : "")

    const resultUrl = extractUrl(result)
    const resultB64 = await urlToDataUri(resultUrl)

    return Response.json({ tryOnImage: resultB64 })
  } catch (error: any) {
    const errMsg = error?.message ?? String(error)
    console.error("[try-on] IDM-VTON failed:", errMsg)

    // If it's a billing/auth issue, don't bother with fallback — surface it directly
    if (errMsg.includes("402") || errMsg.includes("Payment Required") || errMsg.includes("Insufficient credit")) {
      return Response.json(
        { error: "Replicate account has insufficient credit. Please add a payment method at replicate.com/account/billing." },
        { status: 402 }
      )
    }
    if (errMsg.includes("401") || errMsg.includes("Unauthorized") || errMsg.includes("Invalid token")) {
      return Response.json(
        { error: "Invalid Replicate API token. Please check your REPLICATE_API_TOKEN." },
        { status: 401 }
      )
    }

    // Fallback: Use SDXL to generate a styled image based on the garment
    try {
      console.log("[try-on] Attempting SDXL fallback...")
      const fallbackResult = await replicate.run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as `${string}/${string}:${string}`,
        {
          input: {
            image: resolvedGarmentImage,
            prompt:
              `fashion model wearing this ${garmentDesc.toLowerCase()}, full body shot, ` +
              "professional fashion photography, studio lighting, clean white background, " +
              "model pose, high fashion editorial, sharp focus, 4k",
            negative_prompt:
              "deformed, distorted, disfigured, poorly drawn, bad anatomy, " +
              "wrong anatomy, extra limb, missing limb, floating limbs, " +
              "disconnected limbs, mutation, ugly, disgusting, blurry",
            prompt_strength: 0.55,
            num_inference_steps: 30,
            guidance_scale: 8,
            width: 768,
            height: 1024,
            scheduler: "K_EULER",
          },
        }
      )

      const fallbackUrl = extractUrl(fallbackResult)
      const fallbackB64 = await urlToDataUri(fallbackUrl)

      return Response.json({ tryOnImage: fallbackB64, method: "generated" })
    } catch (fallbackError: any) {
      console.error("[try-on] SDXL fallback also failed:", fallbackError?.message ?? fallbackError)
      return Response.json(
        { error: "Virtual try-on failed. Please try again later." },
        { status: 500 }
      )
    }
  }
}

function extractUrl(result: unknown): string {
  if (typeof result === "string") return result
  if (Array.isArray(result)) return String(result[0])
  if (result && typeof result === "object" && "output" in result) {
    return String((result as Record<string, unknown>).output)
  }
  return String(result)
}

async function urlToDataUri(url: string): Promise<string> {
  if (url.startsWith("data:")) return url
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  const contentType = response.headers.get("content-type") ?? "image/png"
  return `data:${contentType};base64,${base64}`
}
