import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRightCircle, Settings, Trash2, User, X, Search } from 'lucide-react';
import { saasApi } from '../../services/api';
import { PlanBadge } from './PlanBadge';
import { StatusBadge } from './StatusBadge';
import { ClinicDetailsDrawer, ClinicRow } from './ClinicDetailsDrawer';
import { formatBRL, formatCNPJ } from '../../lib/saasFormat';
import { enterImpersonation } from '../../lib/impersonation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';

// Painel completo da aba "Gestão de Clínicas". Concentra:
//  - Barra de busca/filtros (Status, Plano, contador, Limpar)
//  - Tabela com colunas enriquecidas (Plano, MRR, Usuários, Status, Ações)
//  - Drawer de detalhes com tabs
//  - Modal de delete com digitação do nome para confirmar
//
// É um drop-in auto-suficiente — fetcha a própria lista. Quando a tela-pai
// precisar reagir (ex.: abrir modal de "novo usuário" vinculado à clínica),
// disparamos CustomEvents de baixo acoplamento.

interface Props {
    onRequestNewClinic?: () => void; // abre o modal de criação já existente no parent
}

const PLAN_OPTIONS = ['Todos', 'Essencial', 'Profissional', 'Excellence'] as const;
const STATUS_OPTIONS = ['Todos', 'ATIVO', 'TRIAL', 'INATIVO'] as const;

export const ClinicsPanel: React.FC<Props> = ({ onRequestNewClinic }) => {
    const [clinics, setClinics] = useState<ClinicRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('Todos');
    const [planFilter, setPlanFilter] = useState<string>('Todos');

    const [selected, setSelected] = useState<ClinicRow | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [toDelete, setToDelete] = useState<ClinicRow | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);

    const fetchClinics = async () => {
        setLoading(true);
        try {
            const r = await saasApi.getClinics();
            setClinics(r.data || []);
        } catch {
            toast.error('Erro ao carregar clínicas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClinics(); }, []);

    // Filtro combinado: busca textual (nome/CNPJ) + status + plano.
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return clinics.filter(c => {
            if (statusFilter !== 'Todos' && (c.status || 'TRIAL') !== statusFilter) return false;
            if (planFilter !== 'Todos' && (c.plan || 'Essencial') !== planFilter) return false;
            if (!term) return true;
            return (
                c.name?.toLowerCase().includes(term) ||
                (c.cnpj || '').toLowerCase().includes(term)
            );
        });
    }, [clinics, search, statusFilter, planFilter]);

    const hasActiveFilter = statusFilter !== 'Todos' || planFilter !== 'Todos' || search.trim() !== '';

    const clearFilters = () => {
        setStatusFilter('Todos');
        setPlanFilter('Todos');
        setSearch('');
    };

    const handleImpersonate = async (c: ClinicRow) => {
        try {
            const r = await saasApi.impersonateClinic(c.id);
            const { token, user } = r.data;
            enterImpersonation({
                targetToken: token,
                targetClinicId: user?.clinicId || c.id,
                targetClinicName: c.name,
            });
            // Full reload: AuthContext re-fetcha /auth/me com o novo token.
            window.location.href = '/dashboard';
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Erro ao entrar como admin da clínica');
        }
    };

    const openDrawer = (c: ClinicRow) => {
        setSelected(c);
        setDrawerOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        if (deleteConfirm.trim() !== toDelete.name) {
            toast.error('Digite o nome da clínica exatamente como aparece.');
            return;
        }
        setDeleting(true);
        try {
            await saasApi.deleteClinic(toDelete.id);
            toast.success('Clínica excluída com sucesso');
            setToDelete(null);
            setDeleteConfirm('');
            fetchClinics();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Erro ao excluir clínica');
        } finally {
            setDeleting(false);
        }
    };

    // Permite que a página-pai trate a criação de usuário pré-vinculada à clínica
    // via CustomEvent — evita threading de props pela hierarquia inteira.
    const handleCreateUserForClinic = (clinicId: string) => {
        window.dispatchEvent(new CustomEvent('rares360:create-user-for-clinic', { detail: { clinicId } }));
        toast('Abra a aba "Usuários Globais" para concluir o cadastro.', { icon: 'ℹ️' });
    };

    return (
        <div className="space-y-4">
            {/* Busca + ação de criar clínica */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9A5B]" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou CNPJ…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E2D8] rounded-lg focus:outline-none focus:border-[#3B6D11]"
                    />
                </div>
                {onRequestNewClinic && (
                    <button
                        type="button"
                        onClick={onRequestNewClinic}
                        className="bg-[#3B6D11] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2d5409] transition-colors"
                    >
                        + Nova Clínica
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[#8A9A5B]">Status</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2 py-1.5 bg-white border border-[#E5E2D8] rounded-lg text-xs font-medium focus:outline-none focus:border-[#3B6D11]"
                    >
                        {STATUS_OPTIONS.map(o => (
                            <option key={o} value={o}>
                                {o === 'Todos' ? 'Todos'
                                    : o === 'ATIVO' ? 'Ativo'
                                    : o === 'TRIAL' ? 'Trial' : 'Inativo'}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[#8A9A5B]">Plano</span>
                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="px-2 py-1.5 bg-white border border-[#E5E2D8] rounded-lg text-xs font-medium focus:outline-none focus:border-[#3B6D11]"
                    >
                        {PLAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </label>

                <span className="text-[#5F5E5A] font-medium">
                    {filtered.length} {filtered.length === 1 ? 'clínica encontrada' : 'clínicas encontradas'}
                </span>

                {hasActiveFilter && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[#854F0B] hover:bg-[#FAEEDA] transition-colors"
                    >
                        <X size={12} /> Limpar filtros
                    </button>
                )}
            </div>

            {/* Tabela */}
            <div className="rounded-lg border border-[#E5E2D8] bg-white overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#F5F0E8] text-[#5F5E5A] text-[10px] font-bold uppercase tracking-wider">
                            <th className="px-4 py-3 text-left">Nome</th>
                            <th className="px-4 py-3 text-left">CNPJ</th>
                            <th className="px-4 py-3 text-left">Plano</th>
                            <th className="px-4 py-3 text-right">MRR</th>
                            <th className="px-4 py-3 text-left">Usuários ativos</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-t border-[#E5E2D8]">
                                    <td colSpan={7} className="px-4 py-3">
                                        <div className="h-6 bg-[#F0EAD6] rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        )}

                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-[#5F5E5A]">
                                    Nenhuma clínica encontrada com os filtros atuais.
                                </td>
                            </tr>
                        )}

                        {!loading && filtered.map(c => (
                            <tr key={c.id} className="border-t border-[#E5E2D8] hover:bg-[#F9F6F0] transition-colors">
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => openDrawer(c)}
                                        className="font-semibold text-[#3B6D11] hover:underline text-left"
                                    >
                                        {c.name}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-[#5F5E5A] font-mono text-xs">
                                    {formatCNPJ(c.cnpj)}
                                </td>
                                <td className="px-4 py-3"><PlanBadge plan={c.plan} /></td>
                                <td className="px-4 py-3 text-right font-bold text-[#3B6D11]">
                                    {formatBRL(c.mrr)}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Redireciona para a aba de usuários filtrada por esta clínica.
                                            window.dispatchEvent(new CustomEvent('rares360:filter-users-by-clinic', {
                                                detail: { clinicId: c.id, clinicName: c.name },
                                            }));
                                        }}
                                        className="inline-flex items-center gap-1.5 text-[#3B6D11] hover:underline"
                                    >
                                        <User size={14} />
                                        <span>{c.activeUsersCount ?? 0} usuários</span>
                                    </button>
                                </td>
                                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <IconButton
                                            title="Entrar como admin desta clínica"
                                            onClick={() => handleImpersonate(c)}
                                            icon={<ArrowRightCircle size={16} />}
                                        />
                                        <IconButton
                                            title="Configurar"
                                            onClick={() => openDrawer(c)}
                                            icon={<Settings size={16} />}
                                        />
                                        <IconButton
                                            title="Excluir"
                                            onClick={() => { setToDelete(c); setDeleteConfirm(''); }}
                                            icon={<Trash2 size={16} />}
                                            destructive
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Drawer de detalhes */}
            <ClinicDetailsDrawer
                clinic={selected}
                open={drawerOpen}
                onOpenChange={(open) => setDrawerOpen(open)}
                onSaved={() => { fetchClinics(); }}
                onCreateUserForClinic={handleCreateUserForClinic}
            />

            {/* Modal de exclusão com digitação do nome */}
            <Dialog
                open={!!toDelete}
                onOpenChange={(o) => { if (!o) { setToDelete(null); setDeleteConfirm(''); } }}
            >
                <DialogContent>
                    <DialogHeader className="bg-[#A32D2D]">
                        <DialogTitle>Excluir clínica</DialogTitle>
                        <DialogDescription className="text-white/80">
                            Esta ação é irreversível e removerá todos os dados vinculados a{' '}
                            <strong>{toDelete?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 pt-2 space-y-3">
                        <p className="text-sm text-[#5F5E5A]">
                            Para confirmar, digite o nome da clínica abaixo:
                        </p>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder={toDelete?.name || ''}
                            className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2D8] rounded-lg focus:outline-none focus:border-[#A32D2D]"
                            autoFocus
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => { setToDelete(null); setDeleteConfirm(''); }}
                                className="px-4 py-2 text-sm font-bold text-[#5F5E5A] hover:bg-[#F0EAD6] rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={deleting || deleteConfirm.trim() !== (toDelete?.name || '')}
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-sm font-bold text-white bg-[#A32D2D] rounded-lg hover:bg-[#8a2525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? 'Excluindo…' : 'Excluir definitivamente'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const IconButton: React.FC<{
    title: string;
    onClick: () => void;
    icon: React.ReactNode;
    destructive?: boolean;
}> = ({ title, onClick, icon, destructive }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        className={`p-1.5 rounded-md transition-colors ${
            destructive
                ? 'text-[#A32D2D] hover:bg-[#FCEBEB]'
                : 'text-[#3B6D11] hover:bg-[#EAF3DE]'
        }`}
    >
        {icon}
    </button>
);
