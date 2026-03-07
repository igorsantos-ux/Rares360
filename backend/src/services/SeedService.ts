import prisma from '../lib/prisma.js';
import { AuthService } from './AuthService.js';

export class SeedService {
    static async autoSeedIfEmpty() {
        try {
            // Verifica se o admin mestre já existe para evitar re-seeds acidentais
            const adminExists = await prisma.user.findUnique({
                where: { email: 'admin@heathfinance.com.br' }
            });

            if (!adminExists) {
                console.log('Admin global não encontrado. Iniciando auto-seed para Heath Finance SaaS...');
                await this.runSeed();
                console.log('Auto-seed completado com sucesso! 🚀');
            } else {
                console.log('Admin global já existe. Pulando auto-seed.');
            }
        } catch (error: any) {
            if (error.code === 'P2021') {
                console.error('❌ Database tables do not exist. Please run migrations first (npx prisma migrate deploy).');
            } else {
                console.error('Failed to run auto-seed:', error);
            }
        }
    }

    static async runSeed() {
        // Limpeza
        await prisma.transaction.deleteMany();
        await prisma.financialGoal.deleteMany();
        await prisma.lead.deleteMany();
        await prisma.stockItem.deleteMany();
        await prisma.doctor.deleteMany();
        await prisma.customer.deleteMany();
        await prisma.user.deleteMany();
        await prisma.clinic.deleteMany();

        const hashedPassword = await AuthService.hashPassword('admin123');

        // 1. Criar Global Admin (ADMMM)
        await prisma.user.create({
            data: {
                name: 'Igor Admin',
                email: 'admin@heathfinance.com.br',
                password: hashedPassword,
                role: 'ADMIN_GLOBAL'
            }
        });

        // 2. Criar Clínica de Teste
        const clinic = await prisma.clinic.create({
            data: {
                name: 'Clínica Health Teste',
                cnpj: '12.345.678/0001-99',
                address: 'Av. Paulista, 1000 - São Paulo, SP',
            }
        });

        // 3. Criar Admin da Clínica
        await prisma.user.create({
            data: {
                name: 'Roberta Alamino',
                email: 'roberta@alamino.com.br',
                password: hashedPassword,
                role: 'CLINIC_ADMIN',
                clinicId: clinic.id
            }
        });

        // 4. Médicos
        const doctors = [
            { name: 'Dr. Marcelo Silva', specialty: 'Dermatologia', commission: 0.15, clinicId: clinic.id },
            { name: 'Dra. Ana Oliveira', specialty: 'Estética Avançada', commission: 0.20, clinicId: clinic.id },
            { name: 'Dr. Ricardo Santos', specialty: 'Cirurgia Plástica', commission: 0.25, clinicId: clinic.id },
            { name: 'Dra. Juliana Lima', specialty: 'Harmonização Facial', commission: 0.18, clinicId: clinic.id },
        ];

        const createdDoctors = [];
        for (const d of doctors) {
            createdDoctors.push(await prisma.doctor.create({ data: d }));
        }

        // 5. Clientes
        const customers = [
            { name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 98888-7777', clinicId: clinic.id },
            { name: 'João Pereira', email: 'joao@email.com', phone: '(11) 97777-6666', clinicId: clinic.id },
            { name: 'Ana Costa', email: 'ana.c@email.com', phone: '(11) 96666-5555', clinicId: clinic.id },
            { name: 'Roberto Lima', email: 'roberto@email.com', phone: '(11) 95555-4444', clinicId: clinic.id },
            { name: 'Carla Dias', email: 'carla@email.com', phone: '(11) 94444-3333', clinicId: clinic.id },
        ];

        const createdCustomers = [];
        for (const c of customers) {
            createdCustomers.push(await prisma.customer.create({ data: c }));
        }

        // 6. Transações 2026
        const procedures = [
            { name: 'Botox', price: 1500, cost: 600 },
            { name: 'Preenchimento', price: 2200, cost: 1100 },
            { name: 'Bioestimulador', price: 3500, cost: 1800 },
            { name: 'Peeling', price: 600, cost: 150 },
        ];

        for (let month = 1; month <= 3; month++) {
            const transCount = 20;
            for (let i = 0; i < transCount; i++) {
                const proc = procedures[Math.floor(Math.random() * procedures.length)];
                const doc = createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
                const cust = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
                const day = Math.floor(Math.random() * 28) + 1;

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
                        clinicId: clinic.id,
                        date: new Date(2026, month - 1, day)
                    }
                });
            }

            await prisma.transaction.create({
                data: { description: 'Aluguel', amount: 8000, type: 'EXPENSE', category: 'Custos Fixos', clinicId: clinic.id, date: new Date(2026, month - 1, 5) }
            });
            await prisma.transaction.create({
                data: { description: 'Salários Equipe', amount: 12000, type: 'EXPENSE', category: 'Custos Fixos', clinicId: clinic.id, date: new Date(2026, month - 1, 20) }
            });
        }

        // 7. Metas
        const goals = [
            { month: 1, year: 2026, target: 120000, achieved: 125000, type: 'PROFIT', clinicId: clinic.id },
            { month: 2, year: 2026, target: 120000, achieved: 110000, type: 'PROFIT', clinicId: clinic.id },
            { month: 3, year: 2026, target: 150000, achieved: 45000, type: 'PROFIT', clinicId: clinic.id },
        ];
        for (const g of goals) {
            await prisma.financialGoal.create({ data: g });
        }

        // 8. Leads (Global ou por clínica? No schema não tem clinicId, vou manter global por enquanto ou adicionar depois)
        const leads = [
            { name: 'Juliana P.', source: 'Instagram', status: 'Novo' },
            { name: 'Marcos R.', source: 'Google', status: 'Contatado' },
            { name: 'Beatriz F.', source: 'Instagram', status: 'Convertido' },
        ];
        for (const l of leads) {
            await prisma.lead.create({ data: l });
        }

        // 9. Estoque
        const items = [
            { name: 'Botox 100U', category: 'Injetáveis', quantity: 15, minQuantity: 5, price: 1200, clinicId: clinic.id },
            { name: 'Ácido Hialurônico', category: 'Injetáveis', quantity: 25, minQuantity: 10, price: 850, clinicId: clinic.id },
        ];
        for (const it of items) {
            await prisma.stockItem.create({ data: it });
        }
    }
}
