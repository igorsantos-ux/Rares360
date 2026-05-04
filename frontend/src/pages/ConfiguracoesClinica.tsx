import { useState, useEffect } from 'react';
import { Settings, Percent, Stethoscope, Users, Building } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { configuracoesApi } from '../services/api';
import RepassesTab from '../components/Configuracoes/RepassesTab';
import ComissoesTab from '../components/Configuracoes/ComissoesTab';
import { Switch } from '../components/ui/Switch';

export default function ConfiguracoesClinica() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('impostos');
    
    // Globais
    const [equiparacaoHospitalar, setEquiparacaoHospitalar] = useState(false);
    const [custoMinutoSala, setCustoMinutoSala] = useState(0);

    const carregarGlobais = async () => {
        try {
            const { data } = await configuracoesApi.getGlobais();
            if (data) {
                setEquiparacaoHospitalar(data.equiparacaoHospitalar || false);
                setCustoMinutoSala(Number(data.custoMinutoSala) || 0);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        carregarGlobais();
    }, []);

    const salvarGlobais = async () => {
        setLoading(true);
        try {
            await configuracoesApi.updateGlobais({
                equiparacaoHospitalar,
                custoMinutoSala
            });
            toast.success('Configurações salvas');
        } catch (error) {
            toast.error('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'impostos', label: 'Impostos', icon: Percent },
        { id: 'repasses', label: 'Repasses Médicos', icon: Stethoscope },
        { id: 'comissoes', label: 'Comissões', icon: Users },
        { id: 'custos', label: 'Custos de Sala', icon: Building },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 p-8 max-w-[1400px] mx-auto">
            <Toaster position="top-right" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58] flex items-center gap-3">
                        <Settings className="text-[#8A9A5B]" size={36} />
                        Configurações da Clínica
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        Gerencie as regras de negócio, impostos e custos operacionais (Motor de Regras).
                    </p>
                </div>
                <button 
                    onClick={salvarGlobais} 
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                                isActive 
                                    ? 'bg-white text-[#8A9A5B] shadow-sm border-2 border-[#8A9A5B]' 
                                    : 'bg-white/50 text-slate-500 hover:bg-white hover:text-slate-700 border-2 border-transparent'
                            }`}
                        >
                            <Icon size={18} /> {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="mt-6">
                {activeTab === 'impostos' && (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#DEB587]/20 shadow-sm">
                        <h3 className="font-extrabold text-xl text-slate-800 mb-2">Regime Tributário</h3>
                        <p className="text-sm font-bold text-slate-400 mb-6">Configure se a clínica possui equiparação hospitalar para redução de CSLL e IRPJ.</p>
                        
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <label className="text-sm font-black text-slate-700 uppercase tracking-widest block mb-1">Equiparação Hospitalar</label>
                                <p className="text-sm font-medium text-slate-500">Ative se a clínica tiver permissão contábil para pagar impostos reduzidos.</p>
                            </div>
                            <Switch 
                                checked={equiparacaoHospitalar}
                                onCheckedChange={setEquiparacaoHospitalar}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'repasses' && <RepassesTab />}
                {activeTab === 'comissoes' && <ComissoesTab />}
                
                {activeTab === 'custos' && (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#DEB587]/20 shadow-sm">
                        <h3 className="font-extrabold text-xl text-slate-800 mb-2">Custo Operacional</h3>
                        <p className="text-sm font-bold text-slate-400 mb-6">Configure o custo hora/minuto da estrutura clínica.</p>
                        
                        <div className="max-w-xs space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Padrão por Minuto (R$)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                value={custoMinutoSala} 
                                onChange={(e) => setCustoMinutoSala(Number(e.target.value))}
                                placeholder="Ex: 1.50"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                            />
                            <p className="text-xs text-slate-400 font-medium mt-2">
                                Este valor será multiplicado pelo tempo do procedimento na precificação.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
