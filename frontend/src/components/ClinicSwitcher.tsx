import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Building2, Check, X, RefreshCw } from 'lucide-react';
import { clinicApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Clinic {
    id: string;
    name: string;
    cidade?: string;
    estado?: string;
    logo?: string;
}

const ClinicSwitcher = () => {
    const { activeClinicId, setContextClinic, clearContext, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && clinics.length === 0) {
            fetchClinics();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchClinics = async () => {
        setLoading(true);
        try {
            const response = await clinicApi.getAll();
            setClinics(response.data);
        } catch (error) {
            console.error('Erro ao buscar clínicas:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClinics = clinics.filter(clinic => 
        clinic.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentClinic = clinics.find(c => c.id === activeClinicId);

    if (user?.role !== 'ADMIN_GLOBAL') return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-200 ${
                    activeClinicId 
                        ? 'bg-[#8A9A5B]/10 border-[#8A9A5B]/30 text-[#8A9A5B] shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-[#8A9A5B]/30 hover:bg-slate-50'
                }`}
            >
                <div className={`p-1.5 rounded-lg ${activeClinicId ? 'bg-[#8A9A5B]/20' : 'bg-slate-100'}`}>
                    <Building2 size={18} />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[10px] uppercase font-bold tracking-widest leading-none opacity-60">
                        {activeClinicId ? 'Contexto Ativo' : 'Trocar Unidade'}
                    </span>
                    <span className="text-sm font-black truncate max-w-[150px]">
                        {currentClinic?.name || 'Selecionar Clínica'}
                    </span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-[100] overflow-hidden"
                    >
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar clínica..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 focus:border-[#8A9A5B] transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-height-[300px] overflow-y-auto p-2">
                            {activeClinicId && (
                                <button
                                    onClick={() => {
                                        clearContext();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm mb-2 border border-dashed border-red-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <X size={16} />
                                        <span>Voltar ao Painel Global</span>
                                    </div>
                                    <RefreshCw size={14} className="opacity-50" />
                                </button>
                            )}

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                    <RefreshCw size={24} className="animate-spin mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Carregando...</span>
                                </div>
                            ) : filteredClinics.length > 0 ? (
                                filteredClinics.map((clinic) => (
                                    <button
                                        key={clinic.id}
                                        onClick={() => {
                                            if (clinic.id !== activeClinicId) {
                                                setContextClinic(clinic.id);
                                            }
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                                            clinic.id === activeClinicId 
                                                ? 'bg-[#8A9A5B] text-white shadow-md' 
                                                : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                clinic.id === activeClinicId ? 'bg-white/20' : 'bg-[#8A9A5B]/10'
                                            }`}>
                                                {clinic.logo ? (
                                                    <img src={clinic.logo} alt="" className="w-6 h-6 object-contain" />
                                                ) : (
                                                    <Building2 size={16} className={clinic.id === activeClinicId ? 'text-white' : 'text-[#8A9A5B]'} />
                                                )}
                                            </div>
                                            <div className="flex flex-col items-start overflow-hidden">
                                                <span className="text-sm font-bold truncate max-w-[160px]">{clinic.name}</span>
                                                <span className={`text-[10px] uppercase font-bold tracking-tight opacity-70`}>
                                                    {clinic.cidade ? `${clinic.cidade}, ${clinic.estado}` : 'Localização não informada'}
                                                </span>
                                            </div>
                                        </div>
                                        {clinic.id === activeClinicId && <Check size={16} />}
                                    </button>
                                ))
                            ) : (
                                <div className="py-8 text-center text-slate-400">
                                    <Building2 size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-tight">Nenhuma clínica encontrada</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClinicSwitcher;
