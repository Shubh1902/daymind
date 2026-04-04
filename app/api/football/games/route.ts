import { prisma } from "@/lib/prisma"

export async function GET() {
  const games = await prisma.footballGame.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  return Response.json(games)
}
