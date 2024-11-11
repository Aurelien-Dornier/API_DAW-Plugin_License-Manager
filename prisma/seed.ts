import { PrismaClient, UserStatus, TwoFactorStatus, UserRole, PluginStatus } from '@prisma/client';
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
        firstName: 'Eikichi',
        lastName: 'Onizuka',
        company: 'Admin Corp',
        phone: '+33123456789'
      },
      plugins: [
        {
          name: 'Admin Plugin 1',
          vendor: 'Admin Vendor',
          category: 'EQ',
          licenseKey: 'ADMIN-XXXX-YYYY',
          purchaseEmail: 'admin@example.com',
          status: 'INSTALLED' as PluginStatus
        }
      ]
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
      },
      plugins: [
        {
          name: 'User Plugin 1',
          vendor: 'User Vendor',
          category: 'Reverb',
          licenseKey: 'USER-XXXX-YYYY',
          purchaseEmail: 'user@example.com',
          status: 'NOT_INSTALLED' as PluginStatus
        }
      ]
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
    
    const createdUser = await prisma.user.upsert({
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
        },
        plugins: user.plugins ? {
          create: user.plugins.map(plugin => ({
            name: plugin.name,
            vendor: plugin.vendor,
            licenseKey: plugin.licenseKey,
            purchaseEmail: plugin.purchaseEmail,
            status: plugin.status,
            category: {
              connect: { name: plugin.category }
            }
          }))        
        } : undefined
      }
    });

    // Créer un log d'audit pour chaque création d'utilisateur
    await prisma.auditLog.create({
      data: {
        userId: createdUser.id,
        action: 'CREATE',
        entityType: 'USER',
        entityId: createdUser.id,
        newValues: {
          email: user.email,
          role: user.role,
          status: user.status
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

    // Log d'audit pour la génération des codes de récupération
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'GENERATE',
        entityType: 'RECOVERY_CODES',
        entityId: user.id,
        newValues: { numberOfCodes: codes.length }
      }
    });

    console.log(`✅ Created recovery codes for user: ${user.email}`);
  }
}

async function generateLoginAttempts() {
  console.log('🌱 Seeding login attempts...');

  const attempts = [
    {
      email: 'admin@example.com',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      success: true
    },
    {
      email: 'wrong@example.com',
      ipAddress: '192.168.1.2',
      userAgent: 'Chrome/91.0',
      success: false
    }
  ];

  await prisma.loginAttempt.createMany({
    data: attempts.map(attempt => ({
      ...attempt,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // expires in 24h
    }))
  });

  console.log('✅ Created login attempts');
}

async function generateCategories() {
  // Assurez-vous que cette fonction est appelée AVANT generateUsers
  console.log('🌱 Seeding categories...');
  const categories = [
    { name: 'EQ' },
    { name: 'Compressor' },
    { name: 'Reverb' },
    { name: 'Delay' },
    { name: 'Chorus' },
    { name: 'Phaser' },
    { name: 'Tuner' },
    { name: 'Mixer' },
    { name: 'Other' },
    { name: 'Security' },
    { name: 'Development' }
  ];

  await prisma.category.createMany({
    data: categories
  });
}

async function main() {
  try {
    console.log('🚀 Starting seed...');
    
    // Reset the database
    await prisma.loginAttempt.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.recoveryCode.deleteMany();
    await prisma.plugin.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    // Generate data
    await generateCategories();
    await generateUsers();
    await generateRecoveryCodes();
    await generateLoginAttempts();
    
    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();