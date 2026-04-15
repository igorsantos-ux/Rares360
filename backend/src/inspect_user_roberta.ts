import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'roberta.alamino@rares360.com.br' }
    })

    if (user) {
      console.log('--- DADOS DO USUÁRIO ---')
      console.log('ID:', user.id)
      console.log('Email:', user.email)
      console.log('Ativo:', user.isActive)
      console.log('Senha (Hash):', user.password)
      console.log('Must Change Password:', user.mustChangePassword)
      console.log('Password Updated At:', user.passwordUpdatedAt)
    } else {
      console.log('Usuário não encontrado.')
    }
  } catch (err: any) {
    console.error('Erro:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
