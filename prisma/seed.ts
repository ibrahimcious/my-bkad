import { PrismaClient, UserRole } from '@prisma/client'

import { hashPassword } from '../src/shared/auth/password'

const prisma = new PrismaClient()

/**
 * Initial accounts for v1. There is no registration flow — these three
 * users are created by the seed and their passwords set here.
 *
 * The fallback passwords below are DEVELOPMENT credentials. Before the
 * production deploy (U6) they MUST be overridden: set the matching
 * SEED_*_PASSWORD variables in the deploy environment and re-run the
 * seed, or rotate the passwords directly in the database.
 */
const seedUsers = [
  {
    email: 'kepala@bkad.pasuruankab.go.id',
    name: 'Kepala BKAD',
    role: UserRole.KEPALA,
    password: process.env.SEED_KEPALA_PASSWORD ?? 'kepala-bkad-dev',
  },
  {
    email: 'sekretaris@bkad.pasuruankab.go.id',
    name: 'Sekretaris BKAD',
    role: UserRole.SEKRETARIS,
    password: process.env.SEED_SEKRETARIS_PASSWORD ?? 'sekretaris-bkad-dev',
  },
  {
    email: 'uploader@bkad.pasuruankab.go.id',
    name: 'Data Uploader',
    role: UserRole.UPLOADER,
    password: process.env.SEED_UPLOADER_PASSWORD ?? 'uploader-bkad-dev',
  },
]

async function main() {
  for (const user of seedUsers) {
    const passwordHash = await hashPassword(user.password)
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, passwordHash },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    })
  }
  console.log(`Seeded ${seedUsers.length} users.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('Seed failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
