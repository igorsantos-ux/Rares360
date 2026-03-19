import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '../lib/prisma.js';
import { AuthService } from './AuthService.js';
const execAsync = promisify(exec);
export class SeedService {
    static async autoSeedIfEmpty() {
        try {
            // Sincroniza o banco em background TOTAL para não travar o loop de eventos
            console.log('Iniciando sincronização de schema em background...');
            // Se houver DIRECT_URL (Supabase), usamos ela para o push, pois o Pooler (6543) falha com prepared statements
            let dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
            // Se for Supabase (6543) e não tiver pgbouncer=true, adicionamos para o Prisma não reclamar
            if (dbUrl.includes('6543') && !dbUrl.includes('pgbouncer=true')) {
                dbUrl += dbUrl.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
            }
            const command = `DATABASE_URL="${dbUrl}" npx prisma db push --accept-data-loss`;
            execAsync(command)
                .then(({ stdout, stderr }) => {
                if (stdout)
                    console.log('[PRISMA DB PUSH OUT]:', stdout);
                if (stderr)
                    console.warn('[PRISMA DB PUSH ERR]:', stderr);
                console.log('✅ Tentativa de sincronização de schema finalizada.');
            })
                .catch(err => {
                console.error('❌ ERRO CRÍTICO na sincronização do banco:', err.message);
                console.error('Stack:', err.stack);
            });
            console.log('Verificando status do banco de dados...');
            const adminEmail = 'admin@heathfinance.com.br';
            const adminPassword = 'admin123';
            const hashedPassword = await AuthService.hashPassword(adminPassword);
            // Verifica se o admin mestre já existe
            const existingAdmin = await prisma.user.findUnique({
                where: { email: adminEmail }
            });
            if (!existingAdmin) {
                console.log('Admin global não encontrado. Criando...');
                await prisma.user.create({
                    data: {
                        name: 'Igor Admin',
                        email: adminEmail,
                        password: hashedPassword,
                        role: 'ADMIN_GLOBAL'
                    }
                });
            }
            else {
                console.log('Atualizando Admin global para garantir senha padrão...');
                await prisma.user.update({
                    where: { email: adminEmail },
                    data: { password: hashedPassword }
                });
            }
            // Verifica Roberta Alamino
            const robertaEmail = 'roberta@alamino.com';
            const existingRoberta = await prisma.user.findUnique({
                where: { email: robertaEmail }
            });
            if (!existingRoberta) {
                console.log('Usuário Roberta não encontrado. Criando...');
                const clinic = await prisma.clinic.findFirst();
                await prisma.user.create({
                    data: {
                        name: 'Roberta Alamino',
                        email: robertaEmail,
                        password: hashedPassword,
                        role: 'CLINIC_ADMIN',
                        clinicId: clinic?.id
                    }
                });
            }
            else {
                console.log('Sincronizando usuário Roberta (Clínica e Senha)...');
                const clinic = await prisma.clinic.findFirst();
                await prisma.user.update({
                    where: { email: robertaEmail },
                    data: {
                        password: hashedPassword,
                        clinicId: clinic?.id
                    }
                });
            }
            console.log('✅ Sincronização de credenciais de teste concluída.');
            // Se for a primeira vez (sem outras clínicas), roda o seed completo
            // DESABILITADO PARA PRODUÇÃO: Não queremos dados de teste automáticos
            /*
            const clinicCount = await prisma.clinic.count();
            if (clinicCount === 0) {
                console.log('Nenhuma clínica encontrada. Iniciando seed de dados de teste...');
                await this.runSeed();
                console.log('🚀 Seed de teste completado!');
            }
            */
            console.log('ℹ️ Seed automático de teste ignorado (Modo Produção).');
        }
        catch (error) {
            if (error.code === 'P2021') {
                console.error('❌ Database tables do not exist. Please run migrations first (npx prisma migrate deploy).');
            }
            else {
                console.error('Failed to run auto-seed:', error);
            }
        }
    }
    static async runSeed() {
        console.log('--- Iniciando Seed de Dados de Teste ---');
        // Limpeza (Não limpamos usuários aqui para evitar deslogar quem está testando)
        await prisma.transaction.deleteMany();
        await prisma.financialGoal.deleteMany();
        await prisma.lead.deleteMany();
        await prisma.stockItem.deleteMany();
        await prisma.doctor.deleteMany();
        await prisma.patient.deleteMany();
        await prisma.clinic.deleteMany();
        const defaultHashedPassword = await AuthService.hashPassword('admin123');
        // 1. Garantir Admin (Sem sobrescrever senha se já existir)
        const adminEmail = 'admin@heathfinance.com.br';
        const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!existingAdmin) {
            await prisma.user.create({
                data: {
                    name: 'Igor Admin',
                    email: adminEmail,
                    password: defaultHashedPassword,
                    role: 'ADMIN_GLOBAL'
                }
            });
        }
        // 2. Criar Clínica de Teste (Novo Schema)
        const clinic = await prisma.clinic.create({
            data: {
                name: 'Clínica Health Teste',
                razaoSocial: 'Health Finance Teste LTDA',
                cnpj: '12.345.678/0001-99',
                logradouro: 'Av. Paulista, 1000',
                cidade: 'São Paulo',
                estado: 'SP',
                cep: '01310-100',
                regimeTributario: 'SIMPLES',
                pricePerUser: 50.0
            }
        });
        // 3. Criar Roberta Alamino (Sem sobrescrever senha)
        const robertaEmail = 'roberta@alamino.com';
        const existingRoberta = await prisma.user.findUnique({ where: { email: robertaEmail } });
        if (!existingRoberta) {
            await prisma.user.create({
                data: {
                    name: 'Roberta Alamino',
                    email: robertaEmail,
                    password: defaultHashedPassword,
                    role: 'CLINIC_ADMIN',
                    clinicId: clinic.id
                }
            });
        }
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
        // 5. Pacientes
        const patients = [
            { fullName: 'Maria Santos', email: 'maria@email.com', phone: '(11) 98888-7777', clinicId: clinic.id },
            { fullName: 'João Pereira', email: 'joao@email.com', phone: '(11) 97777-6666', clinicId: clinic.id },
            { fullName: 'Ana Costa', email: 'ana.c@email.com', phone: '(11) 96666-5555', clinicId: clinic.id },
            { fullName: 'Roberto Lima', email: 'roberto@email.com', phone: '(11) 95555-4444', clinicId: clinic.id },
            { fullName: 'Carla Dias', email: 'carla@email.com', phone: '(11) 94444-3333', clinicId: clinic.id },
        ];
        const createdPatients = [];
        for (const c of patients) {
            createdPatients.push(await prisma.patient.create({ data: c }));
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
                const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
                const day = Math.floor(Math.random() * 28) + 1;
                await prisma.transaction.create({
                    data: {
                        description: `Atendimento ${proc.name} - ${patient.fullName}`,
                        amount: proc.price,
                        type: 'INCOME',
                        category: 'Procedimento',
                        procedureName: proc.name,
                        cost: proc.cost,
                        doctorId: doc.id,
                        patientId: patient.id,
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
