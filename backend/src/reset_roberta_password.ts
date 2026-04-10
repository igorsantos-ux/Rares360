import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    const email = 'roberta.alamino@rares360.com.br'
    const newPassword = 'Rares@2026'
    
    console.log(`--- Reset de Senha: ${email} ---`)
    
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(newPassword, salt)

    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hash,
        mustChangePassword: true, // Forçar troca no primeiro acesso
        passwordUpdatedAt: new Date()
      }
    })

    console.log('✅ Senha resetada com sucesso!')
    console.log('Nova senha temporária: ', newPassword)
  } catch (err) {
    console.error('❌ Erro no reset:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
