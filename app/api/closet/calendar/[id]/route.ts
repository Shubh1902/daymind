import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const entry = await prisma.outfitCalendarEntry.findFirst({
    where: { id, userId: USER_ID },
  })

  if (!entry) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.outfitCalendarEntry.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
