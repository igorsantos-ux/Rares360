import { useState, useEffect } from 'react';
import { Settings, CheckCircle2, XCircle, Loader2, Link2, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

interface Integration {
    id: string;
    type: string;
    token: string;
    isActive: boolean;
}

const Automations = () => {
    const [feegowToken, setFeegowToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [integrations, setIntegrations] = useState<Integration[]>([]);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            const response = await api.get('/integrations');
            setIntegrations(response.data);
            const feegow = response.data.find((i: Integration) => i.type === 'FEEGOW');
            if (feegow) {
                setFeegowToken(feegow.token);
            }
        } catch (error) {
            console.error('Erro ao buscar integrações:', error);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setStatus(null);
        try {
            const response = await api.post('/integrations/test', {
                type: 'FEEGOW',
                token: feegowToken
            });
            setStatus({ type: 'success', message: response.data.message });
        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Erro ao conectar com o Feegow.'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.post('/integrations/save', {
                type: 'FEEGOW',
                token: feegowToken,
                isActive: true
            });
            setStatus({ type: 'success', message: 'Configurações salvas com sucesso!' });
            fetchIntegrations();
        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Erro ao salvar configurações.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Settings className="text-[#8A9A5B]" size={32} />
                        Automatizações
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Conecte o Heath Finance com seus sistemas favoritos e automatize seu fluxo de trabalho.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Feegow Integration Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
                >
                    <div className="bg-[#8A9A5B]/10 p-8 border-b border-[#8A9A5B]/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#8A9A5B]/20">
                                <img src="https://ajuda.feegow.com.br/support/home" alt="Feegow" className="w-8 h-8 object-contain opacity-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                <Link2 className="text-[#8A9A5B]" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Feegow Clinic</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#8A9A5B] text-white">
                                        Oficial
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium tracking-tight">API REST v1.0</span>
                                </div>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${integrations.find(i => i.type === 'FEEGOW') ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    </div>

                    <div className="p-8 space-y-6">
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            Integre seus agendamentos e dados de pacientes do Feegow diretamente no seu dashboard financeiro.
                        </p>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-[#8A9A5B] ml-1">
                                Token de Acesso (x-access-token)
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={feegowToken}
                                    onChange={(e) => setFeegowToken(e.target.value)}
                                    placeholder="Cole aqui seu token gerado no Feegow..."
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#8A9A5B] focus:bg-white outline-none transition-all font-mono text-sm group-hover:border-slate-200"
                                />
                                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            </div>
                        </div>

                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl text-blue-600 h-fit">
                                <Settings size={18} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-blue-800">Dica de Configuração</p>
                                <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                                    No Feegow, vá em Configurações &gt; Outras Configurações &gt; API Pública para gerar seu token.
                                </p>
                                <a
                                    href="https://ajuda.feegow.com/support/solutions/articles/67000714396-como-integrar-o-feegow-via-api-com-outros-sistemas-"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-black text-blue-700 flex items-center gap-1 hover:underline mt-2"
                                >
                                    Ver tutorial completo <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>

                        {status && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-2xl flex items-center gap-3 border ${status.type === 'success'
                                    ? 'bg-green-50 border-green-100 text-green-700'
                                    : 'bg-red-50 border-red-100 text-red-700'
                                    }`}
                            >
                                {status.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                <span className="text-xs font-bold tracking-tight">{status.message}</span>
                            </motion.div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleTestConnection}
                                disabled={testing || !feegowToken}
                                className="flex-1 px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {testing ? <Loader2 className="animate-spin" size={16} /> : 'Testar Conexão'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || !feegowToken}
                                className="flex-1 px-6 py-4 bg-[#8A9A5B] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#697D58] shadow-lg shadow-[#8A9A5B]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Coming Soon Card */}
                <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300">
                        <Link2 size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-400">Novas Integrações em Breve</h3>
                        <p className="text-sm text-slate-400 font-medium max-w-[240px] mt-2">
                            Estamos trabalhando para trazer conectores com RD Station, Google Agenda e muito mais.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Automations;
