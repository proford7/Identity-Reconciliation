/**
 * Singleton Prisma Client instance.
 * Re-uses the same client across the application to avoid
 * opening multiple database connections.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
