const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function run() {
  const secret = process.env.CLEAR_USERS_SECRET;

  if (!secret) {
    console.error("CLEAR_USERS_SECRET is not set. Aborting to avoid accidental data loss.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  console.log("Clearing all users from database (this will cascade to related records)...");

  try {
    const result = await prisma.user.deleteMany({});
    console.log(`Deleted ${result.count} users.`);
  } catch (err) {
    console.error("Failed to delete users:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
