import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const game = await prisma.footballGame.findUnique({
    where: { id },
    include: { selections: { include: { player: true } } },
  })
  if (!game) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(game)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.footballGame.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
