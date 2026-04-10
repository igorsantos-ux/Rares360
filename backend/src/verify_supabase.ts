import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('--- Teste de Conexão Supabase ---')
    const userCount = await prisma.user.count()
    console.log(`Total de usuários: ${userCount}`)

    const user = await prisma.user.findUnique({
      where: { email: 'roberta.alamino@rares360.com.br' }
    })

    if (user) {
      console.log('✅ Usuário encontrado:', user.email)
      console.log('Status Ativo:', user.isActive)
    } else {
      console.log('❌ Usuário roberta.alamino@rares360.com.br NÃO ENCONTRADO.')
      
      const allUsers = await prisma.user.findMany({ select: { email: true } })
      console.log('Usuários existentes:', allUsers.map(u => u.email).join(', '))
    }
  } catch (err) {
    console.error('❌ Erro na conexão:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
