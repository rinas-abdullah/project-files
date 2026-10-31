import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { __vitalinkPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.__vitalinkPrisma ??
  new PrismaClient({ log: process.env.PRISMA_LOG ? ["query", "warn", "error"] : ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.__vitalinkPrisma = prisma;
