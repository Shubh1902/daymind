import { prisma } from "@/lib/prisma"

const DEFAULT_MEMBERS = [
  { name: "Shubhanshu", slug: "shubhanshu", color: "#f97316" },
  { name: "Shanku", slug: "partner", color: "#8b5cf6" },
]

export async function GET() {
  let members = await prisma.householdMember.findMany({
    orderBy: { createdAt: "asc" },
  })

  // Auto-seed on first call
  if (members.length === 0) {
    for (const m of DEFAULT_MEMBERS) {
      await prisma.householdMember.create({ data: m })
    }
    members = await prisma.householdMember.findMany({
      orderBy: { createdAt: "asc" },
    })
  }

  return Response.json(members)
}
