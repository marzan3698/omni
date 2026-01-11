require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTasksQuery() {
  try {
    console.log('🔍 Testing tasks query...\n');
    
    const tasks = await prisma.task.findMany({
      where: {
        companyId: 1,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    console.log('✅ Query successful!');
    console.log(`Found ${tasks.length} tasks`);
    console.log(JSON.stringify(tasks, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Full error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testTasksQuery();

