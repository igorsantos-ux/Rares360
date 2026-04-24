import React, { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/Sheet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { saasApi } from '../../services/api';
import toast from 'react-hot-toast';
import { StatusBadge } from './StatusBadge';
import { PlanBadge } from './PlanBadge';
import { formatBRL, formatCNPJ, daysSince } from '../../lib/saasFormat';
import { UserPlus, Save, Users as UsersIcon } from 'lucide-react';

// Tipos mínimos para o payload vindo do backend. Mantemos `any` em pontos
// onde o controller ainda é loose para não atrapalhar integrações existentes.
export interface ClinicRow {
    id: string;
    name: string;
    cnpj?: string | null;
    plan?: string | null;
    status?: string | null;
    mrr?: number;
    activeUsersCount?: number;
    monthlyFee?: number | null;
    pricePerUser?: number | null;
    createdAt?: string;
}

interface ClinicDetailsDrawerProps {
    clinic: ClinicRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void; // callback para refetch da listagem
    onCreateUserForClinic: (clinicId: string) => void;
}

type TabKey = 'overview' | 'users' | 'settings';

// Mini-tabs inline — evita dependência nova; cada aba renderiza seu próprio conteúdo.
const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'users',    label: 'Usuários' },
    { key: 'settings', label: 'Configurações' },
];

export const ClinicDetailsDrawer: React.FC<ClinicDetailsDrawerProps> = ({
    clinic, open, onOpenChange, onSaved, onCreateUserForClinic,
}) => {
    const [tab, setTab] = useState<TabKey>('overview');
    const [revenue, setRevenue] = useState<Array<{ month: string; total: number }>>([]);
    const [loadingRevenue, setLoadingRevenue] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form do tab "Configurações" — edita nome, CNPJ, plano, status e mensalidade.
    const [form, setForm] = useState({
        name: '', cnpj: '', plan: 'Essencial', status: 'TRIAL', monthlyFee: 0,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!clinic || !open) return;
        setTab('overview');
        setForm({
            name: clinic.name || '',
            cnpj: clinic.cnpj || '',
            plan: clinic.plan || 'Essencial',
            status: clinic.status || 'TRIAL',
            monthlyFee: Number(clinic.monthlyFee || 0),
        });
    }, [clinic, open]);

    // Busca dados do tab ativo lazily — economiza round-trips quando o drawer abre.
    useEffect(() => {
        if (!clinic || !open) return;

        if (tab === 'overview' && revenue.length === 0) {
            setLoadingRevenue(true);
            saasApi.getClinicRevenueHistory(clinic.id, 12)
                .then(r => setRevenue(r.data || []))
                .catch(() => toast.error('Erro ao carregar histórico de faturamento'))
                .finally(() => setLoadingRevenue(false));
        }

        if (tab === 'users' && users.length === 0) {
            setLoadingUsers(true);
            saasApi.getUsers()
                .then(r => setUsers((r.data || []).filter((u: any) => u.clinicId === clinic.id)))
                .catch(() => toast.error('Erro ao carregar usuários'))
                .finally(() => setLoadingUsers(false));
        }
    }, [tab, clinic, open]); // revenue/users nos caches, re-carga ao reabrir drawer é feita no reset abaixo

    // Reset de caches quando a clínica selecionada muda.
    useEffect(() => {
        setRevenue([]);
        setUsers([]);
    }, [clinic?.id]);

    const handleSave = async () => {
        if (!clinic) return;
        setSaving(true);
        try {
            await saasApi.updateClinic(clinic.id, {
                name: form.name,
                cnpj: form.cnpj,
                plan: form.plan,
                status: form.status,
                monthlyFee: form.monthlyFee,
                // isActive espelha status — mantém compatibilidade com código antigo que
                // ainda depende do boolean.
                isActive: form.status !== 'INATIVO',
            });
            toast.success('Clínica atualizada com sucesso');
            onSaved();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    const daysAsClient = useMemo(() => daysSince(clinic?.createdAt), [clinic?.createdAt]);

    if (!clinic) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader className="space-y-2 pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                        <SheetTitle className="text-xl">{clinic.name}</SheetTitle>
                        <StatusBadge status={clinic.status} />
                        <PlanBadge plan={clinic.plan} />
                    </div>
                    <div className="text-xs text-[#5F5E5A] font-medium">
                        {formatCNPJ(clinic.cnpj)}
                        {clinic.createdAt && (
                            <> • Cliente desde{' '}
                                {new Date(clinic.createdAt).toLocaleDateString('pt-BR')}
                            </>
                        )}
                    </div>
                </SheetHeader>

                {/* Abas */}
                <div className="mt-6 border-b border-[#E5E2D8] flex gap-1">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                                tab === t.key
                                    ? 'text-[#3B6D11] border-b-2 border-[#3B6D11]'
                                    : 'text-[#5F5E5A] hover:text-[#3B6D11]'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Conteúdo das abas */}
                <div className="mt-6 space-y-6">
                    {tab === 'overview' && (
                        <OverviewTab
                            clinic={clinic}
                            daysAsClient={daysAsClient}
                            revenue={revenue}
                            loading={loadingRevenue}
                        />
                    )}

                    {tab === 'users' && (
                        <UsersTab
                            users={users}
                            loading={loadingUsers}
                            onCreate={() => onCreateUserForClinic(clinic.id)}
                        />
                    )}

                    {tab === 'settings' && (
                        <SettingsTab
                            form={form}
                            setForm={setForm}
                            saving={saving}
                            onSave={handleSave}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

// --- Visão Geral -----------------------------------------------------------

const StatCard: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
    <div className="rounded-lg border border-[#E5E2D8] bg-white p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A9A5B]">{label}</div>
        <div className="text-lg font-black text-[#3B6D11] mt-0.5">{value}</div>
        {hint && <div className="text-[11px] text-[#5F5E5A] mt-0.5">{hint}</div>}
    </div>
);

const OverviewTab: React.FC<{
    clinic: ClinicRow;
    daysAsClient: number;
    revenue: Array<{ month: string; total: number }>;
    loading: boolean;
}> = ({ clinic, daysAsClient, revenue, loading }) => (
    <>
        <div className="grid grid-cols-2 gap-3">
            <StatCard label="MRR" value={formatBRL(clinic.mrr)} />
            <StatCard label="Plano" value={clinic.plan || 'Essencial'} />
            <StatCard
                label="Usuários ativos"
                value={String(clinic.activeUsersCount ?? 0)}
                hint="Apenas usuários ativos"
            />
            <StatCard label="Dias como cliente" value={String(daysAsClient)} />
        </div>

        <div className="rounded-lg border border-[#E5E2D8] bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8A9A5B] mb-3">
                Faturamento mensal (últimos 12 meses)
            </div>
            {loading ? (
                <div className="h-48 animate-pulse bg-[#F0EAD6] rounded-md" />
            ) : revenue.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-[#5F5E5A]">
                    Sem dados de faturamento.
                </div>
            ) : (
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E2D8" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5F5E5A' }} />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#5F5E5A' }}
                                tickFormatter={(v: number) => `R$ ${Math.round(v / 1000)}k`}
                            />
                            <Tooltip
                                formatter={(value: any) => formatBRL(Number(value))}
                                labelStyle={{ fontSize: 12 }}
                                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                            <Bar dataKey="total" fill="#3B6D11" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    </>
);

// --- Usuários --------------------------------------------------------------

const UsersTab: React.FC<{
    users: any[];
    loading: boolean;
    onCreate: () => void;
}> = ({ users, loading, onCreate }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8A9A5B] flex items-center gap-2">
                <UsersIcon size={14} /> {users.length} usuário(s)
            </div>
            <button
                type="button"
                onClick={onCreate}
                className="flex items-center gap-1.5 bg-[#3B6D11] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#2d5409] transition-colors"
            >
                <UserPlus size={14} /> Novo usuário
            </button>
        </div>

        {loading ? (
            <div className="space-y-2">
                {[0, 1, 2].map(i => <div key={i} className="h-12 bg-[#F0EAD6] rounded-md animate-pulse" />)}
            </div>
        ) : users.length === 0 ? (
            <div className="text-sm text-[#5F5E5A] py-8 text-center border border-dashed border-[#E5E2D8] rounded-lg">
                Nenhum usuário cadastrado nesta clínica.
            </div>
        ) : (
            <div className="rounded-lg border border-[#E5E2D8] bg-white divide-y divide-[#E5E2D8]">
                {users.map(u => (
                    <div key={u.id} className="p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#3D3A33] truncate">{u.name}</div>
                            <div className="text-[11px] text-[#5F5E5A] truncate">{u.email}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9A5B]">
                                {u.role}
                            </span>
                            {u.mustChangePassword && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FAEEDA] text-[#854F0B]">
                                    Senha pendente
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// --- Configurações ---------------------------------------------------------

const SettingsTab: React.FC<{
    form: { name: string; cnpj: string; plan: string; status: string; monthlyFee: number };
    setForm: React.Dispatch<React.SetStateAction<{ name: string; cnpj: string; plan: string; status: string; monthlyFee: number }>>;
    saving: boolean;
    onSave: () => void;
}> = ({ form, setForm, saving, onSave }) => (
    <form
        onSubmit={(e) => { e.preventDefault(); onSave(); }}
        className="space-y-3"
    >
        <Field label="Nome da clínica">
            <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2D8] rounded-lg focus:outline-none focus:border-[#3B6D11]"
                required
            />
        </Field>

        <Field label="CNPJ">
            <input
                type="text"
                value={form.cnpj}
                onChange={(e) => setForm(f => ({ ...f, cnpj: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2D8] rounded-lg focus:outline-none focus:border-[#3B6D11]"
                placeholder="00.000.000/0000-00"
            />
        </Field>

        <div className="grid grid-cols-2 gap-3">
            <Field label="Plano">
                <select
                    value={form.plan}
                    onChange={(e) => setForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2D8] rounded-lg focus:outline-none focus:border-[#3B6D11]"
                >
                    <option value="Essencial">Essencial</option>
                    <option value="Profissional">Profissional</option>
                    <option value="Excellence">Excellence</option>
                </select>
            </Field>

            <Field label="Status">
                <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2D8] rounded-lg focus:outline-none focus:border-[#3B6D11]"
                >
                    <option value="ATIVO">Ativo</option>
                    <option value="TRIAL">Trial</option>
                    <option value="INATIVO">Inativo</option>
                </select>
            </Field>
        </div>

        <Field label="Mensalidade (R$)">
            <input
                type="number"
                step="0.01"
                min="0"
                value={form.monthlyFee}
                onChange={(e) => setForm(f => ({ ...f, monthlyFee: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2D8] rounded-lg focus:outline-none focus:border-[#3B6D11]"
            />
        </Field>

        <div className="pt-2 flex justify-end">
            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#3B6D11] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2d5409] transition-colors disabled:opacity-60"
            >
                <Save size={14} /> {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
        </div>
    </form>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A9A5B]">{label}</span>
        <div className="mt-1">{children}</div>
    </label>
);
