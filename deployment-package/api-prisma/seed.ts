import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create default company
    console.log('🏢 Creating default company...');
    const defaultCompany = await prisma.company.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: 'Omni CRM',
            email: 'admin@omni.com',
            isActive: true,
        },
    });
    console.log('✅ Default company created');

    // Create Roles
    console.log('📝 Creating roles...');

    // Create Super Admin role with all permissions
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'SuperAdmin' },
        update: {
            permissions: {
                can_delete_users: true,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: true,
                can_view_reports: true,
                can_manage_finance: true,
                can_manage_companies: true,
                can_manage_employees: true,
                can_manage_tasks: true,
                can_manage_leads: true,
                can_manage_inbox: true,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: true,
                can_view_leads: true,
                can_view_finance: true,
                can_create_leads: true,
                // New permissions
                can_manage_users: true,
                can_view_all_users: true,
                can_manage_integrations: true,
                can_view_integrations: true,
                can_manage_task_config: true,
                can_manage_root_items: true,
                can_manage_lead_config: true,
                can_view_all_tasks: true,
                can_assign_tasks_to_anyone: true,
                can_manage_campaigns: true,
                can_manage_products: true,
                can_manage_payment_settings: true,
            },
        },
        create: {
            name: 'SuperAdmin',
            permissions: {
                can_delete_users: true,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: true,
                can_view_reports: true,
                can_manage_finance: true,
                can_manage_companies: true,
                can_manage_employees: true,
                can_manage_tasks: true,
                can_manage_leads: true,
                can_manage_inbox: true,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: true,
                can_view_leads: true,
                can_view_finance: true,
                can_create_leads: true,
                // New permissions
                can_manage_users: true,
                can_view_all_users: true,
                can_manage_integrations: true,
                can_view_integrations: true,
                can_manage_task_config: true,
                can_manage_root_items: true,
                can_manage_lead_config: true,
                can_view_all_tasks: true,
                can_assign_tasks_to_anyone: true,
                can_manage_campaigns: true,
                can_manage_products: true,
                can_manage_payment_settings: true,
            },
        },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {
            permissions: {
                can_delete_users: true,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: true,
                can_manage_companies: true,
                can_manage_employees: true,
                can_manage_tasks: true,
                can_manage_leads: true,
                can_manage_inbox: true,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: true,
                can_view_leads: true,
                can_view_finance: true,
                can_create_leads: true,
            },
        },
        create: {
            name: 'Admin',
            permissions: {
                can_delete_users: true,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: true,
                can_manage_companies: true,
                can_manage_employees: true,
                can_manage_tasks: true,
                can_manage_leads: true,
                can_manage_inbox: true,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: true,
                can_view_leads: true,
                can_view_finance: true,
                can_create_leads: true,
            },
        },
    });

    const managerRole = await prisma.role.upsert({
        where: { name: 'Manager' },
        update: {
            permissions: {
                can_delete_users: false,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: false,
                can_manage_companies: true,
                can_manage_employees: true,
                can_manage_tasks: true,
                can_manage_leads: true,
                can_manage_inbox: true,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: true,
                can_view_leads: true,
                can_view_finance: true,
                can_create_leads: true,
            },
        },
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
                can_manage_companies: true,
                can_manage_employees: true,
                can_manage_tasks: true,
                can_manage_leads: true,
                can_manage_inbox: true,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: true,
                can_view_leads: true,
                can_view_finance: true,
                can_create_leads: true,
            },
        },
    });

    const salesRole = await prisma.role.upsert({
        where: { name: 'Sales' },
        update: {
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: true,
                can_manage_inbox: false,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: true,
                can_view_finance: false,
                can_create_leads: true,
            },
        },
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
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: true,
                can_manage_inbox: false,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: true,
                can_view_finance: false,
                can_create_leads: true,
            },
        },
    });

    const employeeRole = await prisma.role.upsert({
        where: { name: 'Employee' },
        update: {
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: false,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: true,
                can_manage_leads: false,
                can_manage_inbox: false,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: true,
                can_view_leads: false,
                can_view_finance: false,
                can_create_leads: false,
            },
        },
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
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: true,
                can_manage_leads: false,
                can_manage_inbox: false,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: true,
                can_view_leads: false,
                can_view_finance: false,
                can_create_leads: false,
            },
        },
    });

    // Create Finance Manager role
    const financeManagerRole = await prisma.role.upsert({
        where: { name: 'Finance Manager' },
        update: {
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: true,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: true,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: false,
                can_manage_inbox: false,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: false,
                can_view_leads: false,
                can_view_finance: true,
                can_create_leads: false,
            },
        },
        create: {
            name: 'Finance Manager',
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: true,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: true,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: false,
                can_manage_inbox: false,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: false,
                can_view_leads: false,
                can_view_finance: true,
                can_create_leads: false,
            },
        },
    });

    // Create Customer Care role
    const customerCareRole = await prisma.role.upsert({
        where: { name: 'Customer Care' },
        update: {
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: false,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: false,
                can_manage_inbox: true,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: true,
                can_view_finance: false,
                can_create_leads: true,
            },
        },
        create: {
            name: 'Customer Care',
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: false,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: false,
                can_manage_inbox: true,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: true,
                can_view_finance: false,
                can_create_leads: true,
            },
        },
    });

    // Create Sales Manager role
    const salesManagerRole = await prisma.role.upsert({
        where: { name: 'Sales Manager' },
        update: {
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: true,
                can_manage_inbox: true, // Sales Manager can manage inbox
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: true,
                can_view_finance: false,
                can_create_leads: true,
            },
        },
        create: {
            name: 'Sales Manager',
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: true,
                can_reply_social: true,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: true,
                can_manage_inbox: true, // Sales Manager can manage inbox
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: true,
                can_view_finance: false,
                can_create_leads: true,
            },
        },
    });

    // Create Lead Manager role
    const leadManagerRole = await prisma.role.upsert({
        where: { name: 'Lead Manager' },
        update: {
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: false,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: true,
                can_manage_inbox: false,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: true,
                can_view_finance: false,
                can_create_leads: true,
                can_manage_lead_config: true,
            },
        },
        create: {
            name: 'Lead Manager',
            permissions: {
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: false,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: true,
                can_manage_inbox: false,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: true,
                can_view_finance: false,
                can_create_leads: true,
                can_manage_lead_config: true,
            },
        },
    });

    // Create HR Manager role
    const hrManagerRole = await prisma.role.upsert({
        where: { name: 'HR Manager' },
        update: {
            permissions: {
                can_delete_users: false,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: true,
                can_manage_tasks: true,
                can_manage_leads: false,
                can_manage_inbox: false,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: true,
                can_view_leads: false,
                can_view_finance: false,
                can_create_leads: false,
            },
        },
        create: {
            name: 'HR Manager',
            permissions: {
                can_delete_users: false,
                can_edit_users: true,
                can_view_users: true,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: true,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: true,
                can_manage_tasks: true,
                can_manage_leads: false,
                can_manage_inbox: false,
                can_view_companies: true,
                can_view_employees: true,
                can_view_tasks: true,
                can_view_leads: false,
                can_view_finance: false,
                can_create_leads: false,
            },
        },
    });

    // Create Client role
    const clientRole = await prisma.role.upsert({
        where: { name: 'Client' },
        update: {
            permissions: {
                can_view_own_projects: true,
                can_view_campaign_leads: true,
                can_create_projects: true,
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: false,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: false,
                can_manage_inbox: false,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: false,
                can_view_finance: false,
                can_create_leads: false,
            },
        },
        create: {
            name: 'Client',
            permissions: {
                can_view_own_projects: true,
                can_view_campaign_leads: true,
                can_create_projects: true,
                can_delete_users: false,
                can_edit_users: false,
                can_view_users: false,
                can_reply_social: false,
                can_manage_roles: false,
                can_view_reports: false,
                can_manage_finance: false,
                can_manage_companies: false,
                can_manage_employees: false,
                can_manage_tasks: false,
                can_manage_leads: false,
                can_manage_inbox: false,
                can_view_companies: false,
                can_view_employees: false,
                can_view_tasks: false,
                can_view_leads: false,
                can_view_finance: false,
                can_create_leads: false,
            },
        },
    });

    console.log('✅ Roles created');

    // Create Super Admin User
    console.log('👤 Creating super admin user...');

    const superAdminPassword = await bcrypt.hash('superadmin123', 10);

    const superAdminUser = await prisma.user.upsert({
        where: {
            email_companyId: {
                email: 'superadmin@omni.com',
                companyId: defaultCompany.id,
            },
        },
        update: {
            roleId: superAdminRole.id,
        },
        create: {
            email: 'superadmin@omni.com',
            passwordHash: superAdminPassword,
            roleId: superAdminRole.id,
            companyId: defaultCompany.id,
        },
    });

    // Create Admin User
    console.log('👤 Creating admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
        where: {
            email_companyId: {
                email: 'admin@omni.com',
                companyId: defaultCompany.id,
            },
        },
        update: {},
        create: {
            email: 'admin@omni.com',
            passwordHash: hashedPassword,
            roleId: adminRole.id,
            companyId: defaultCompany.id,
        },
    });

    // Create Manager User
    console.log('👤 Creating manager user...');

    const managerPassword = await bcrypt.hash('manager123', 10);

    const managerUser = await prisma.user.upsert({
        where: {
            email_companyId: {
                email: 'manager@omni.com',
                companyId: defaultCompany.id,
            },
        },
        update: {},
        create: {
            email: 'manager@omni.com',
            passwordHash: managerPassword,
            roleId: managerRole.id,
            companyId: defaultCompany.id,
        },
    });

    // Create Sales User
    console.log('👤 Creating sales user...');

    const salesPassword = await bcrypt.hash('sales123', 10);

    const salesUser = await prisma.user.upsert({
        where: {
            email_companyId: {
                email: 'sales@omni.com',
                companyId: defaultCompany.id,
            },
        },
        update: {},
        create: {
            email: 'sales@omni.com',
            passwordHash: salesPassword,
            roleId: salesRole.id,
            companyId: defaultCompany.id,
        },
    });

    // Create Lead Manager User
    console.log('👤 Creating lead manager user...');

    const leadManagerPassword = await bcrypt.hash('leadmanager123', 10);

    const leadManagerUser = await prisma.user.upsert({
        where: {
            email_companyId: {
                email: 'leadmanager@omni.com',
                companyId: defaultCompany.id,
            },
        },
        update: {},
        create: {
            email: 'leadmanager@omni.com',
            passwordHash: leadManagerPassword,
            roleId: leadManagerRole.id,
            companyId: defaultCompany.id,
        },
    });

    console.log('✅ Users created');

    // Create default Lead Categories
    console.log('📝 Creating default lead categories...');
    const leadCategories = [
        { name: 'Hot Lead', isActive: true },
        { name: 'Warm Lead', isActive: true },
        { name: 'Cold Lead', isActive: true },
        { name: 'Qualified', isActive: true },
        { name: 'Not Qualified', isActive: true },
    ];

    for (const category of leadCategories) {
        const existing = await prisma.leadCategory.findFirst({
            where: {
                companyId: defaultCompany.id,
                name: category.name,
            },
        });
        if (!existing) {
            await prisma.leadCategory.create({
                data: {
                    companyId: defaultCompany.id,
                    name: category.name,
                    isActive: category.isActive,
                },
            });
        }
    }
    console.log('✅ Lead categories created');

    // Create default Lead Interests
    console.log('📝 Creating default lead interests...');
    const leadInterests = [
        { name: 'Very Interested', isActive: true },
        { name: 'Interested', isActive: true },
        { name: 'Somewhat Interested', isActive: true },
        { name: 'Not Interested', isActive: true },
        { name: 'Follow Up Required', isActive: true },
    ];

    for (const interest of leadInterests) {
        const existing = await prisma.leadInterest.findFirst({
            where: {
                companyId: defaultCompany.id,
                name: interest.name,
            },
        });
        if (!existing) {
            await prisma.leadInterest.create({
                data: {
                    companyId: defaultCompany.id,
                    name: interest.name,
                    isActive: interest.isActive,
                },
            });
        }
    }
    console.log('✅ Lead interests created');

    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Super Admin Account (All Permissions):');
    console.log('   Email: superadmin@omni.com');
    console.log('   Password: superadmin123');
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Lead Manager Account:');
    console.log('   Email: leadmanager@omni.com');
    console.log('   Password: leadmanager123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Available Roles:');
    console.log('   1. SuperAdmin - Full system access');
    console.log('   2. Admin - Full access except role management');
    console.log('   3. Manager - Company, Employee, Task, Lead management');
    console.log('   4. Sales - Lead management only');
    console.log('   5. Employee - Task management only');
    console.log('   6. Finance Manager - Finance & Reports');
    console.log('   7. Customer Care - Inbox & Lead creation');
    console.log('   8. Sales Manager - Inbox & Lead management');
    console.log('   9. HR Manager - Employee & Task management');
    console.log('  10. Lead Manager - Lead configuration & management');
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

