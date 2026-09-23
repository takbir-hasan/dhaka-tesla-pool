import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://tesla_user:tesla_password@localhost:5432/tesla_pool?schema=public",
  }),
});

export default prisma;