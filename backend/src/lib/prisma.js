require("dotenv").config();

let prisma = null;

try {
  const { PrismaClient } = require("@prisma/client");
  const { PrismaPg } = require("@prisma/adapter-pg");

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  prisma = new PrismaClient({ adapter });
  console.log("✓ Prisma connecté");
} catch (e) {
  console.warn("⚠  Prisma indisponible — routes DB désactivées :", e.message);
}

module.exports = prisma;
