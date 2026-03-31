import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function GET() {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: USER_ID },
    orderBy: [{ purchased: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
  })
  return Response.json(items)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, category, color, description, reason, priority } = body

  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 })
  }

  const item = await prisma.wishlistItem.create({
    data: {
      userId: USER_ID,
      name,
      category: category ?? null,
      color: color ?? null,
      description: description ?? null,
      reason: reason ?? "manual",
      priority: priority ?? "medium",
    },
  })

  return Response.json(item, { status: 201 })
}
