import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.upsert({
    where: { id: "user_me" },
    update: {},
    create: {
      id: "user_me",
      email: "me@daymind.local",
      name: "Me",
    },
  })

  console.log("Seeded user:", user)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
