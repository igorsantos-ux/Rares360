import prisma from '../lib/prisma.js';
export class AppointmentController {
    /**
     * Validação de Conflito (O CORAÇÃO)
     * Verifica se há interseção de horários para Médico, Sala ou Equipamento.
     */
    static async checkConflicts(data) {
        const { startTime, endTime, professionalId, roomId, equipmentId, clinicId, excludeId } = data;
        // Regra de Interseção: (Novo_Inicio < Existente_Fim) AND (Novo_Fim > Existente_Inicio)
        const conflictBaseWhere = {
            clinicId,
            id: { not: excludeId },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
            status: { notIn: ['CANCELADO', 'FALTA'] }, // Agendamentos cancelados ou faltas não bloqueiam
            isOverbook: false // Se for um encaixe marcado anteriormente, ele não bloqueia outros?
            // Na verdade, o agendamento EXISTENTE se for overbook, ele ainda ocupa o espaço físico.
        };
        // 1. Validar PROFISSIONAL
        const professionalConflict = await prisma.appointment.findFirst({
            where: {
                ...conflictBaseWhere,
                professionalId
            }
        });
        if (professionalConflict)
            return { type: 'PROFESSIONAL', message: 'O profissional já possui um agendamento neste horário.' };
        // 2. Validar SALA
        if (roomId) {
            const roomConflict = await prisma.appointment.findFirst({
                where: {
                    ...conflictBaseWhere,
                    roomId
                }
            });
            if (roomConflict)
                return { type: 'ROOM', message: 'A sala já está ocupada neste horário.' };
        }
        // 3. Validar EQUIPAMENTO
        if (equipmentId) {
            const equipmentConflict = await prisma.appointment.findFirst({
                where: {
                    ...conflictBaseWhere,
                    equipmentId
                }
            });
            if (equipmentConflict)
                return { type: 'EQUIPMENT', message: 'O equipamento já está alocado neste horário.' };
        }
        return null; // Sem conflitos
    }
    static async list(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const { start, end } = req.query;
            const appointments = await prisma.appointment.findMany({
                where: {
                    clinicId,
                    startTime: {
                        gte: start ? new Date(start) : undefined,
                        lte: end ? new Date(end) : undefined
                    }
                },
                include: {
                    patient: true,
                    professional: true,
                    room: true,
                    equipment: true,
                    procedure: true
                },
                orderBy: { startTime: 'asc' }
            });
            // Agregação de Inteligência Financeira por Paciente
            const patientIds = [...new Set(appointments.map(a => a.patientId))];
            if (patientIds.length > 0) {
                const [transactions, proposals, appCounts] = await Promise.all([
                    prisma.transaction.findMany({
                        where: { patientId: { in: patientIds }, type: 'ENTRADA', status: 'PAID' },
                        select: { patientId: true, amount: true }
                    }),
                    prisma.proposal.findMany({
                        where: { patientId: { in: patientIds }, status: { in: ['PENDENTE', 'APROVADO'] } },
                        select: { patientId: true, totalValue: true }
                    }),
                    prisma.appointment.groupBy({
                        by: ['patientId'],
                        where: { patientId: { in: patientIds } },
                        _count: { id: true }
                    })
                ]);
                // Mapear dados para cada agendamento
                const enrichedAppointments = appointments.map(app => {
                    const pTransactions = transactions.filter(t => t.patientId === app.patientId);
                    const pProposals = proposals.filter(p => p.patientId === app.patientId);
                    const pAppCount = appCounts.find(c => c.patientId === app.patientId)?._count.id || 0;
                    const totalInvested = pTransactions.reduce((acc, t) => acc + t.amount, 0);
                    const avgTicket = pTransactions.length > 0 ? totalInvested / pTransactions.length : 0;
                    const provisionalRevenue = pProposals.reduce((acc, p) => acc + p.totalValue, 0);
                    const lastVisit = app.patient.lastVisit;
                    return {
                        ...app,
                        patientStats: {
                            totalInvested,
                            avgTicket,
                            provisionalRevenue,
                            isRecurring: pAppCount > 1,
                            lastVisit
                        }
                    };
                });
                return res.json(enrichedAppointments);
            }
            res.json(appointments);
        }
        catch (error) {
            console.error('Error listing appointments:', error);
            res.status(500).json({ error: 'Erro ao listar agendamentos' });
        }
    }
    static async create(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const data = req.body;
            const startTime = new Date(data.startTime);
            const endTime = new Date(data.endTime);
            // Validar conflitos apenas se não for "Encaixe"
            if (!data.isOverbook) {
                const conflict = await AppointmentController.checkConflicts({
                    startTime,
                    endTime,
                    professionalId: data.professionalId,
                    roomId: data.roomId,
                    equipmentId: data.equipmentId,
                    clinicId
                });
                if (conflict) {
                    return res.status(409).json(conflict);
                }
            }
            const appointment = await prisma.appointment.create({
                data: {
                    startTime,
                    endTime,
                    status: data.status || 'AGUARDANDO',
                    isOverbook: !!data.isOverbook,
                    isReturn: !!data.isReturn,
                    notes: data.notes,
                    patientId: data.patientId,
                    professionalId: data.professionalId,
                    roomId: data.roomId || null,
                    equipmentId: data.equipmentId || null,
                    procedureId: data.procedureId || null,
                    clinicId
                },
                include: {
                    patient: true,
                    professional: true,
                    room: true,
                    equipment: true
                }
            });
            res.status(201).json(appointment);
        }
        catch (error) {
            console.error('--- ERRO AO CRIAR AGENDAMENTO ---');
            console.error('Payload recebido:', req.body);
            console.error('Mensagem de erro:', error.message);
            if (error.code)
                console.error('Código Prisma:', error.code);
            if (error.meta)
                console.error('Metadados Prisma:', error.meta);
            res.status(500).json({
                error: 'Erro ao criar agendamento',
                details: error.message
            });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const clinicId = req.clinicId || req.user?.clinicId;
            const data = req.body;
            const startTime = data.startTime ? new Date(data.startTime) : undefined;
            const endTime = data.endTime ? new Date(data.endTime) : undefined;
            // Se alterou horário ou recursos, validar conflito
            if ((startTime || endTime || data.professionalId || data.roomId || data.equipmentId) && !data.isOverbook) {
                const current = await prisma.appointment.findUnique({ where: { id } });
                if (!current)
                    return res.status(404).json({ error: 'Agendamento não encontrado' });
                const conflict = await AppointmentController.checkConflicts({
                    startTime: startTime || current.startTime,
                    endTime: endTime || current.endTime,
                    professionalId: data.professionalId || current.professionalId,
                    roomId: data.hasOwnProperty('roomId') ? data.roomId : current.roomId,
                    equipmentId: data.hasOwnProperty('equipmentId') ? data.equipmentId : current.equipmentId,
                    clinicId,
                    excludeId: id
                });
                if (conflict) {
                    return res.status(409).json(conflict);
                }
            }
            const oldAppointment = await prisma.appointment.findUnique({ where: { id } });
            // Sanitizar campos de relação para o update
            const updateData = { ...data };
            if (updateData.hasOwnProperty('roomId') && !updateData.roomId)
                updateData.roomId = null;
            if (updateData.hasOwnProperty('equipmentId') && !updateData.equipmentId)
                updateData.equipmentId = null;
            if (updateData.hasOwnProperty('procedureId') && !updateData.procedureId)
                updateData.procedureId = null;
            const appointment = await prisma.appointment.update({
                where: { id },
                data: {
                    ...updateData,
                    startTime: startTime,
                    endTime: endTime,
                }
            });
            // TRIGGER: Se mudou para ATENDIDO, disparar integrações
            if (appointment.status === 'ATENDIDO' && oldAppointment?.status !== 'ATENDIDO') {
                await AppointmentController.handleExecutionTriggers(appointment);
            }
            res.json(appointment);
        }
        catch (error) {
            console.error('--- ERRO AO ATUALIZAR AGENDAMENTO ---');
            console.error('ID:', req.params.id);
            console.error('Payload:', req.body);
            console.error('Erro:', error.message);
            res.status(500).json({
                error: 'Erro ao atualizar agendamento',
                details: error.message
            });
        }
    }
    /**
     * Gerencia Triggers de CRM e Estoque
     */
    static async handleExecutionTriggers(appointment) {
        try {
            // 1. Trigger CRM: Criar tarefa de retorno
            await prisma.task.create({
                data: {
                    clinicId: appointment.clinicId,
                    patientId: appointment.patientId,
                    title: `Retorno: ${appointment.procedureId ? 'Procedimento Realizado' : 'Consulta'}`,
                    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias depois
                    type: 'FOLLOW_UP',
                    status: 'ABERTA'
                }
            });
            // 2. Trigger Estoque: Baixa de insumos (se houver procedimento vinculado)
            if (appointment.procedureId) {
                const procedure = await prisma.procedure.findUnique({
                    where: { id: appointment.procedureId },
                    include: { supplies: true }
                });
                if (procedure && procedure.supplies.length > 0) {
                    for (const supply of procedure.supplies) {
                        // Buscar item do estoque pelo nome ou id se estiver vinculado
                        const inventoryItem = await prisma.inventoryItem.findFirst({
                            where: {
                                clinicId: appointment.clinicId,
                                name: supply.name
                            }
                        });
                        if (inventoryItem) {
                            // Criar movimento de saída
                            await prisma.stockMovement.create({
                                data: {
                                    type: 'OUT',
                                    quantity: supply.quantity,
                                    reason: `Uso em agendamento: ${appointment.id}`,
                                    itemId: inventoryItem.id,
                                    clinicId: appointment.clinicId
                                }
                            });
                            // Atualizar saldo do item
                            await prisma.inventoryItem.update({
                                where: { id: inventoryItem.id },
                                data: {
                                    currentStock: { decrement: supply.quantity }
                                }
                            });
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in handleExecutionTriggers:', error);
            // Não falhamos a requisição principal se os triggers falharem, 
            // mas logamos o erro para auditoria.
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await prisma.appointment.delete({ where: { id } });
            res.json({ message: 'Agendamento excluído com sucesso' });
        }
        catch (error) {
            console.error('Error deleting appointment:', error);
            res.status(500).json({ error: 'Erro ao excluir agendamento' });
        }
    }
    static async getResources(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const [rooms, equipments, professionals] = await Promise.all([
                prisma.room.findMany({ where: { clinicId } }),
                prisma.equipment.findMany({ where: { clinicId } }),
                prisma.doctor.findMany({ where: { clinicId, isActive: true } })
            ]);
            res.json({ rooms, equipments, professionals });
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao listar recursos' });
        }
    }
}
