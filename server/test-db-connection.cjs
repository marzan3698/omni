// Test database connection script for cPanel (CommonJS)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('🔍 Checking DATABASE_URL...');
const url = process.env.DATABASE_URL || 'NOT SET';
console.log('DATABASE_URL (masked):', url.replace(/:([^:@]+)@/, ':***@'));

// Check password format
const pwdMatch = url.match(/mysql:\/\/[^:]+:([^@]+)@/);
if (pwdMatch) {
    const pwd = pwdMatch[1];
    console.log('Password length:', pwd.length);
    console.log('Password contains @:', pwd.includes('@'));
    console.log('Password contains %40:', pwd.includes('%40'));

    // Check if it matches new password (first 5 chars)
    if (pwd.startsWith('Paaer') || pwd.startsWith('Paaera')) {
        console.log('✅ Password appears to be the new one (starts with Paaer)');
    } else if (pwd.includes('ADitt') || pwd.includes('ADit')) {
        console.log('⚠️  WARNING: Still using OLD password (starts with ADitt)');
        console.log('   You need to update DATABASE_URL in cPanel Node.js Selector!');
    }
}

console.log('\n🔌 Testing Prisma connection...');
const prisma = new PrismaClient();
prisma.$connect()
    .then(() => prisma.user.count())
    .then(count => {
        console.log('✅ Prisma connected! Users:', count);
        prisma.$disconnect();
        process.exit(0);
    })
    .catch(e => {
        console.error('❌ Error:', e.message);
        if (e.message.includes('Authentication failed')) {
            console.error('\n💡 The DATABASE_URL password doesn\'t match the database password.');
            console.error('   Make sure:');
            console.error('   1. Database password is: PaaeraDB2024SecurePass');
            console.error('   2. DATABASE_URL in cPanel is updated with the same password');
            console.error('   3. App was restarted after updating DATABASE_URL');
        }
        prisma.$disconnect();
        process.exit(1);
    });
