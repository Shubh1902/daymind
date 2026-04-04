import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const VALID_POSITIONS = ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST", "CF", "SS", "DEF", "MID", "ATT"]
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
  const { name, position, positions, skill, workRate, notes } = body

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 })
  }

  // Support both single position and positions array
  const posArr: string[] = Array.isArray(positions) && positions.length > 0
    ? positions.filter((p: string) => VALID_POSITIONS.includes(p))
    : VALID_POSITIONS.includes(position) ? [position] : []

  if (posArr.length === 0) {
    return Response.json({ error: "At least one valid position required" }, { status: 400 })
  }

  const primaryPos = posArr[0]
  const skillNum = Number(skill)
  if (!skillNum || skillNum < 1 || skillNum > 10) {
    return Response.json({ error: "Skill must be 1-10" }, { status: 400 })
  }

  const player = await prisma.footballPlayer.create({
    data: {
      name: name.trim(),
      position: primaryPos,
      positions: posArr,
      skill: skillNum,
      workRate: VALID_WORK_RATES.includes(workRate) ? workRate : "Med",
      notes: notes?.trim() || null,
    },
  })

  return Response.json(player, { status: 201 })
}
