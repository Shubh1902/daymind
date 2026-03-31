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

// Default model image — a neutral pose studio shot
const DEFAULT_MODEL_IMAGE =
  "https://replicate.delivery/pbxt/KhEMsmSAehDFpzbPOZVJQMgwDnWkfoRbmGpMvMCfF0BGOSZC/model.png"

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return Response.json({ error: "REPLICATE_API_TOKEN not set" }, { status: 500 })
  }

  const { garmentImage, modelImage, category } = await request.json()

  if (!garmentImage) {
    return Response.json({ error: "garmentImage is required" }, { status: 400 })
  }

  const replicate = new Replicate({ auth: token })

  // Determine garment description for the model
  const garmentDesc = category === "dresses"
    ? "full body dress"
    : category === "bottoms"
    ? "lower body pants/skirt"
    : category === "tops"
    ? "upper body top/shirt"
    : "clothing item"

  try {
    // Use IDM-VTON for virtual try-on
    const result = await replicate.run(
      "cuuupid/idm-vton:c871bb9b046c1b1f6e93f6407f2c45be15ba3700f tried07ad413e706e062e611e1" as `${string}/${string}:${string}`,
      {
        input: {
          human_img: modelImage ?? DEFAULT_MODEL_IMAGE,
          garm_img: garmentImage,
          garment_des: garmentDesc,
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42,
        },
      }
    )

    const resultUrl = extractUrl(result)
    const resultB64 = await urlToDataUri(resultUrl)

    return Response.json({ tryOnImage: resultB64 })
  } catch (error) {
    console.error("Try-on error, falling back to composite:", error)

    // Fallback: Use SDXL to generate a model wearing the garment
    try {
      const fallbackResult = await replicate.run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as `${string}/${string}:${string}`,
        {
          input: {
            image: garmentImage,
            prompt:
              `fashion model wearing this ${garmentDesc}, full body shot, ` +
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
    } catch (fallbackError) {
      console.error("Fallback generation also failed:", fallbackError)
      return Response.json({ error: "Virtual try-on failed" }, { status: 500 })
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
