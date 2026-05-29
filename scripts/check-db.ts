import { prisma } from "../lib/prisma";

async function main() {
  const userCount = await prisma.user.count();

  console.log(`SQLite connection ok. users=${userCount}`);
}

main()
  .catch((error: unknown) => {
    console.error("SQLite connection failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
