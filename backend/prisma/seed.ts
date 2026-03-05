import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Limpar dados existentes
    console.log('Cleaning database...')
    await prisma.transaction.deleteMany()
    await prisma.doctor.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.stockItem.deleteMany()
    await prisma.financialGoal.deleteMany()

    // 1. Criar Médicos
    console.log('Creating doctors...')
    const doctors = [
        { name: 'Dr. Marcelo Silva', specialty: 'Dermatologia', commission: 0.15 },
        { name: 'Dra. Ana Oliveira', specialty: 'Estética Avançada', commission: 0.20 },
        { name: 'Dr. Ricardo Santos', specialty: 'Cirurgia Plástica', commission: 0.25 },
        { name: 'Dra. Juliana Lima', specialty: 'Harmonização Facial', commission: 0.18 },
    ]
    const createdDoctors = []
    for (const d of doctors) {
        createdDoctors.push(await prisma.doctor.create({ data: d }))
    }

    // 2. Criar Clientes (Pacientes)
    console.log('Creating customers...')
    const customers = [
        { name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 98888-7777' },
        { name: 'João Pereira', email: 'joao@email.com', phone: '(11) 97777-6666' },
        { name: 'Ana Costa', email: 'ana.c@email.com', phone: '(11) 96666-5555' },
        { name: 'Roberto Lima', email: 'roberto@email.com', phone: '(11) 95555-4444' },
        { name: 'Carla Dias', email: 'carla@email.com', phone: '(11) 94444-3333' },
        { name: 'Bruno Souza', email: 'bruno@email.com', phone: '(11) 93333-2222' },
        { name: 'Fernanda Lima', email: 'fernanda@email.com', phone: '(11) 92222-1111' },
    ]
    const createdCustomers = []
    for (const c of customers) {
        createdCustomers.push(await prisma.customer.create({ data: c }))
    }

    // 3. Gerar Transações Mensais para 2026
    console.log('Generating 2026 transactions...')
    const procedures = [
        { name: 'Botox', price: 1500, cost: 600 },
        { name: 'Preenchimento', price: 2200, cost: 1100 },
        { name: 'Bioestimulador', price: 3500, cost: 1800 },
        { name: 'Peeling', price: 600, cost: 150 },
        { name: 'Lipo de Papada', price: 4500, cost: 1200 },
    ]

    const categories = ['Procedimento', 'Custos Fixos', 'Marketing', 'Suprimentos']

    // Gerar dados do Mês 1 ao Mês 3 (Março) de 2026
    for (let month = 1; month <= 3; month++) {
        // Receitas (Gera cerca de 15 a 25 transações por mês)
        const transCount = Math.floor(Math.random() * 10) + 15
        for (let i = 0; i < transCount; i++) {
            const proc = procedures[Math.floor(Math.random() * procedures.length)]
            const doc = createdDoctors[Math.floor(Math.random() * createdDoctors.length)]
            const cust = createdCustomers[Math.floor(Math.random() * createdCustomers.length)]
            const day = Math.floor(Math.random() * 28) + 1

            await prisma.transaction.create({
                data: {
                    description: `Atendimento ${proc.name} - ${cust.name}`,
                    amount: proc.price,
                    type: 'INCOME',
                    category: 'Procedimento',
                    procedureName: proc.name,
                    cost: proc.cost,
                    doctorId: doc.id,
                    customerId: cust.id,
                    date: new Date(2026, month - 1, day)
                }
            })
        }

        // Despesas Fixas
        await prisma.transaction.create({
            data: { description: 'Aluguel Unidade Central', amount: 8000, type: 'EXPENSE', category: 'Custos Fixos', date: new Date(2026, month - 1, 5) }
        })
        await prisma.transaction.create({
            data: { description: 'Salários Equipe', amount: 12000, type: 'EXPENSE', category: 'Custos Fixos', date: new Date(2026, month - 1, 20) }
        })
        await prisma.transaction.create({
            data: { description: 'Marketing Digital', amount: 2500, type: 'EXPENSE', category: 'Marketing', date: new Date(2026, month - 1, 10) }
        })
        await prisma.transaction.create({
            data: { description: 'Insumos de Clínica', amount: Math.floor(Math.random() * 3000) + 1500, type: 'EXPENSE', category: 'Suprimentos', date: new Date(2026, month - 1, 15) }
        })
    }

    // 4. Criar Leads (Análise de Funil)
    console.log('Creating leads...')
    const leadsData = [
        { name: 'Juliana P.', source: 'Instagram', status: 'Novo' },
        { name: 'Marcos R.', source: 'Google', status: 'Contatado' },
        { name: 'Beatriz F.', source: 'Instagram', status: 'Convertido' },
        { name: 'Thiago A.', source: 'Indicação', status: 'Novo' },
        { name: 'Leticia G.', source: 'Google', status: 'Convertido' },
        { name: 'Sandro M.', source: 'Instagram', status: 'Agendado' },
        { name: 'Rafaela C.', source: 'Indicação', status: 'Convertido' },
    ]

    for (const l of leadsData) {
        await prisma.lead.create({ data: l })
    }

    // 5. Itens de Estoque
    console.log('Creating stock items...')
    const stockItems = [
        { name: 'Toxina Botulínica 100U', category: 'Injetáveis', quantity: 15, minQuantity: 5, price: 1200 },
        { name: 'Ácido Hialurônico 1ml', category: 'Injetáveis', quantity: 25, minQuantity: 10, price: 850 },
        { name: 'Fios de PDO', category: 'Injetáveis', quantity: 45, minQuantity: 20, price: 450 },
        { name: 'Cânulas 22G', category: 'Materiais', quantity: 100, minQuantity: 30, price: 15 },
        { name: 'Clorexidina 2%', category: 'Materiais', quantity: 10, minQuantity: 2, price: 45 },
    ]

    for (const item of stockItems) {
        await prisma.stockItem.create({ data: item })
    }

    // 6. Criar Metas para 2026
    console.log('Creating goals...')
    const goals = [
        { month: 1, year: 2026, target: 120000, achieved: 125000, type: 'PROFIT' },
        { month: 2, year: 2026, target: 120000, achieved: 110000, type: 'PROFIT' },
        { month: 3, year: 2026, target: 150000, achieved: 45000, type: 'PROFIT' },
    ]

    for (const g of goals) {
        await prisma.financialGoal.create({ data: g })
    }

    console.log('Database seeded with rich 2026 data! 🚀')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
