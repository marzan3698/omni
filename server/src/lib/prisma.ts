import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient - use globalThis in BOTH dev and production to prevent
// multiple instances (avoids "timer has gone away" / "library already starting" on cPanel)
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Always persist to global to ensure single instance per process (critical for Passenger/cPanel)
globalForPrisma.prisma = prisma;

