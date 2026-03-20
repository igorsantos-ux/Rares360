import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    include: { clinic: true }
  })
  console.log('Users and Clinics:')
  users.forEach(u => console.log(`User: ${u.email}, Clinic: ${u.clinic?.name} (${u.clinicId})`))

  const clinicId = users[0]?.clinicId
  if (clinicId) {
    const goals = await prisma.financialGoal.findMany({ where: { clinicId } })
    console.log('\nGoals for clinic:', clinicId)
    console.log(goals)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const balance = await prisma.transaction.aggregate({
      where: {
        clinicId,
        type: 'INCOME',
        status: 'PAID',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { amount: true }
    })
    console.log('\nReceived Revenue this month:', balance._sum.amount || 0)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
