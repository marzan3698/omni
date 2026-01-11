const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const task = await prisma.task.findFirst({
      where: { id: 8, companyId: 1 },
      include: {
        project: { select: { id: true, title: true, status: true } },
        assignedEmployee: { include: { user: { select: { id: true, email: true, name: true, profileImage: true } } } },
        group: { include: { members: { include: { employee: { include: { user: { select: { id: true, email: true, name: true, profileImage: true } } } } } } } },
        comments: { include: { user: { select: { id: true, email: true, name: true, profileImage: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    console.log('Task found:', !!task);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
test();
