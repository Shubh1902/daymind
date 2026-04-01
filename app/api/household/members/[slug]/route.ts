import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await request.json()

  const member = await prisma.householdMember.findUnique({ where: { slug } })
  if (!member) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.color !== undefined) data.color = body.color

  const updated = await prisma.householdMember.update({ where: { slug }, data })
  return Response.json(updated)
}
