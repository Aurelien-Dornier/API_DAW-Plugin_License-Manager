// src/prisma/seed.ts
import { PrismaClient, UserStatus, TwoFactorStatus, UserRole } from '@prisma/client';
import { hash } from 'argon2';
import 'dotenv/config';

const prisma = new PrismaClient();

async function generateUsers() {
  const users = [
    {
      email: 'admin@example.com',
      password: 'Admin@SuperSecurePassword123!',
      status: 'ACTIVE' as UserStatus,
      role: 'ADMIN' as UserRole,
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        company: 'Admin Corp',
        phone: '+33123456789'
      }
    },
    {
      email: 'user@example.com',
      password: 'User@SuperSecurePassword123!',
      status: 'ACTIVE' as UserStatus,
      role: 'USER' as UserRole,
      profile: {
        firstName: 'Regular',
        lastName: 'User',
        company: 'User Corp',
        phone: '+33987654321'
      }
    },
    {
      email: 'blocked@example.com',
      password: 'Blocked@SuperSecurePassword123!',
      status: 'BLOCKED' as UserStatus,
      role: 'USER' as UserRole,
      profile: {
        firstName: 'Blocked',
        lastName: 'User',
        company: 'Blocked Corp',
        phone: '+33555555555'
      }
    },
    {
      email: '2fa@example.com',
      password: '2FA@SuperSecurePassword123!',
      status: 'ACTIVE' as UserStatus,
      twoFactorStatus: 'ACTIVE' as TwoFactorStatus,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP', 
      role: 'USER' as UserRole,
      profile: {
        firstName: '2FA',
        lastName: 'User',
        company: '2FA Corp',
        phone: '+33666666666'
      }
    }
  ];

  console.log('🌱 Seeding users...');
  
  for (const user of users) {
    const passwordHash = await hash(user.password);
    
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash,
        status: user.status,
        role: user.role,
        twoFactorStatus: user.twoFactorStatus || 'DISABLED',
        twoFactorSecret: user.twoFactorSecret,
        profile: {
          create: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            company: user.profile.company,
            phone: user.profile.phone
          }
        }
      }
    });

    console.log(`✅ Created user: ${user.email}`);
  }
}

async function generateRecoveryCodes() {
  const users = await prisma.user.findMany({
    where: {
      twoFactorStatus: 'ACTIVE'
    }
  });

  console.log('🌱 Seeding recovery codes...');

  for (const user of users) {
    const codes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    await prisma.recoveryCode.createMany({
      data: codes.map(code => ({
        userId: user.id,
        code
      }))
    });

    console.log(`✅ Created recovery codes for user: ${user.email}`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting seed...');
    
    // Reset the database
    await prisma.recoveryCode.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    
    // Generate data
    await generateUsers();
    await generateRecoveryCodes();
    
    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();