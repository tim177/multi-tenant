import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seed the two self-signup roles. Super Admin is config-based (env), not a DB role.
const ROLES = ["org_admin", "end_user"];

async function main() {
  for (const name of ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const roles = await prisma.role.findMany();
  console.log("Seeded roles:", roles.map((r) => `${r.id}:${r.name}`).join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
