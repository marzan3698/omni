import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function testConnection() {
    try {
        console.log('🔌 Testing database connection...');
        // Test connection
        await prisma.$connect();
        console.log('✅ Database connected successfully!');
        // Test query - count roles
        const roleCount = await prisma.role.count();
        console.log(`📊 Roles table exists. Current count: ${roleCount}`);
        // Test query - list all tables
        const tables = await prisma.$queryRaw `
      SHOW TABLES
    `;
        console.log('\n📋 Database tables:');
        tables.forEach(table => {
            console.log(`   - ${table.Tables_in_omni_db}`);
        });
        await prisma.$disconnect();
        console.log('\n✅ Database connection test completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}
testConnection();
//# sourceMappingURL=test-db.js.map