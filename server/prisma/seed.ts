import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Roles
    console.log('📝 Creating roles...');

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            permissions: {
                can_delete_users: true,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: true,
                can_view_reports: true,
                can_manage_finance: true,
            },
        },
    });

    const managerRole = await prisma.role.upsert({
        where: { name: 'Manager' },
        update: {},
        create: {
            name: 'Manager',
            permissions: {
                can_delete_users: false,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: false,
            },
        },
    });

    const salesRole = await prisma.role.upsert({
        where: { name: 'Sales' },
        update: {},
        create: {
            name: 'Sales',
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
            },
        },
    });

    const employeeRole = await prisma.role.upsert({
        where: { name: 'Employee' },
        update: {},
        create: {
            name: 'Employee',
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: false,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
            },
        },
    });

    console.log('✅ Roles created');

    // Create Admin User
    console.log('👤 Creating admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@omni.com' },
        update: {},
        create: {
            email: 'admin@omni.com',
            passwordHash: hashedPassword,
            roleId: adminRole.id,
        },
    });

    // Create Manager User
    console.log('👤 Creating manager user...');

    const managerPassword = await bcrypt.hash('manager123', 10);

    const managerUser = await prisma.user.upsert({
        where: { email: 'manager@omni.com' },
        update: {},
        create: {
            email: 'manager@omni.com',
            passwordHash: managerPassword,
            roleId: managerRole.id,
        },
    });

    // Create Sales User
    console.log('👤 Creating sales user...');

    const salesPassword = await bcrypt.hash('sales123', 10);

    const salesUser = await prisma.user.upsert({
        where: { email: 'sales@omni.com' },
        update: {},
        create: {
            email: 'sales@omni.com',
            passwordHash: salesPassword,
            roleId: salesRole.id,
        },
    });

    console.log('✅ Users created');

    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Admin Account:');
    console.log('   Email: admin@omni.com');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Manager Account:');
    console.log('   Email: manager@omni.com');
    console.log('   Password: manager123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Sales Account:');
    console.log('   Email: sales@omni.com');
    console.log('   Password: sales123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Database seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

