import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      // Use DIRECT_URL for production to bypass IP restrictions
      url: process.env.NODE_ENV === 'production' ? process.env.DIRECT_URL : process.env.DATABASE_URL,
    },
  },
  // Connection pooling optimization
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Performance optimizations
  errorFormat: 'minimal',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
