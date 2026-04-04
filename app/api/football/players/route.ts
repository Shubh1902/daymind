import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const VALID_POSITIONS = ["GK", "DEF", "MID", "ATT"]
const VALID_WORK_RATES = ["Low", "Med", "High"]

export async function GET() {
  const players = await prisma.footballPlayer.findMany({
    where: { active: true },
    orderBy: [{ position: "asc" }, { skill: "desc" }, { name: "asc" }],
  })
  return Response.json(players)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, position, skill, workRate, notes } = body

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 })
  }
  if (!VALID_POSITIONS.includes(position)) {
    return Response.json({ error: "Position must be GK, DEF, MID, or ATT" }, { status: 400 })
  }
  const skillNum = Number(skill)
  if (!skillNum || skillNum < 1 || skillNum > 10) {
    return Response.json({ error: "Skill must be 1-10" }, { status: 400 })
  }

  const player = await prisma.footballPlayer.create({
    data: {
      name: name.trim(),
      position,
      skill: skillNum,
      workRate: VALID_WORK_RATES.includes(workRate) ? workRate : "Med",
      notes: notes?.trim() || null,
    },
  })

  return Response.json(player, { status: 201 })
}
