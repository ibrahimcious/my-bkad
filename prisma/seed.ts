import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Placeholder password hash. U2 introduces the argon2id helper in
 * src/shared/auth/ and replaces this with real credentials. U1 only
 * needs the three user rows to exist — they cannot log in yet.
 */
const PLACEHOLDER_PASSWORD_HASH = 'PLACEHOLDER_REPLACED_IN_U2'

const seedUsers = [
  {
    email: 'kepala@bkad.pasuruankab.go.id',
    name: 'Kepala BKAD',
    role: UserRole.KEPALA,
  },
  {
    email: 'sekretaris@bkad.pasuruankab.go.id',
    name: 'Sekretaris BKAD',
    role: UserRole.SEKRETARIS,
  },
  {
    email: 'uploader@bkad.pasuruankab.go.id',
    name: 'Data Uploader',
    role: UserRole.UPLOADER,
  },
]

async function main() {
  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: { ...user, passwordHash: PLACEHOLDER_PASSWORD_HASH },
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
