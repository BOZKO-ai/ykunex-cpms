import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const settings = await db.setting.findMany();
  console.log(JSON.stringify(settings, null, 2));
}
main().finally(() => db.$disconnect());
