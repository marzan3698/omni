import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Syncing users to employee records...');

    // Find all users who are not SuperAdmin or Client
    const users = await prisma.user.findMany({
        include: {
            role: true,
            employee: true
        }
    });

    let createdCount = 0;

    for (const user of users) {
        if (user.role?.name === 'SuperAdmin' || user.role?.name === 'Client') {
            continue;
        }

        if (!user.employee && user.companyId) {
            console.log(`Creating employee record for ${user.email} (${user.role?.name})...`);

            await prisma.employee.create({
                data: {
                    userId: user.id,
                    companyId: user.companyId,
                    department: user.role?.name || 'Operations',
                    designation: user.role?.name || 'Staff',
                    joinDate: new Date()
                }
            });
            createdCount++;
        }
    }

    console.log(`✅ Success! Created ${createdCount} missing employee records.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
