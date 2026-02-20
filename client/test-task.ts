import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const task = await prisma.task.findFirst({
        where: { companyId: 1 }
    });
    console.log('Using taskId:', task?.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
