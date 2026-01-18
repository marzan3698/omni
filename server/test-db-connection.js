// Test database connection script for cPanel
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('🔍 Checking DATABASE_URL...');
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set in environment variables!');
  process.exit(1);
}

// Show masked URL for security
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
console.log('DATABASE_URL (masked):', maskedUrl);

// Check if URL is properly formatted
if (!dbUrl.startsWith('mysql://')) {
  console.error('❌ DATABASE_URL must start with mysql://');
  console.error('Current value:', maskedUrl);
  process.exit(1);
}

// Check if password contains unencoded special characters
const passwordMatch = dbUrl.match(/mysql:\/\/[^:]+:([^@]+)@/);
if (passwordMatch) {
  const password = passwordMatch[1];
  if (password.includes('@') && !password.includes('%40')) {
    console.warn('⚠️  WARNING: Password contains @ symbol that is not URL-encoded!');
    console.warn('   The @ symbol should be encoded as %40');
    console.warn('   Example: ADittorahmanm12@#@ should be ADittorahmanm12%40%23%40');
  }
  if (password.includes('#') && !password.includes('%23')) {
    console.warn('⚠️  WARNING: Password contains # symbol that is not URL-encoded!');
    console.warn('   The # symbol should be encoded as %23');
  }
}

console.log('\n🔌 Testing Prisma connection...');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('✅ Prisma connected successfully!');
    return prisma.user.count();
  })
  .then(count => {
    console.log(`✅ Database is accessible! Found ${count} users.`);
    return prisma.$disconnect();
  })
  .then(() => {
    console.log('\n✅ Database connection test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('empty host')) {
      console.error('\n💡 FIX: The password in DATABASE_URL contains special characters (@ or #)');
      console.error('   that need to be URL-encoded. In cPanel Node.js Selector:');
      console.error('   - Change @ to %40');
      console.error('   - Change # to %23');
    } else if (error.message.includes('Authentication failed')) {
      console.error('\n💡 FIX: The password in DATABASE_URL is incorrect.');
      console.error('   Verify the password matches the one in cPanel MySQL Databases.');
    } else if (error.message.includes('mysql://')) {
      console.error('\n💡 FIX: DATABASE_URL must start with mysql://');
      console.error('   Check the format in cPanel Node.js Selector.');
    }
    
    prisma.$disconnect().then(() => process.exit(1));
  });
