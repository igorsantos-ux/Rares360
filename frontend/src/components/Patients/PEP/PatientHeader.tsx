import { User, Shield, CreditCard, Activity, CalendarDays, Plus, FileText, Syringe } from 'lucide-react';
import { differenceInYears } from 'date-fns';

const PatientHeader = ({ patient }: { patient: any }) => {
    const age = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : 'N/A';
    
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Perfil Principal */}
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-[#F5F5DC] border-2 border-[#8A9A5B]/30 rounded-full flex items-center justify-center p-1 shadow-lg overflow-hidden">
                    {patient.photoUrl ? (
                        <img src={patient.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <User size={40} className="text-[#8A9A5B]" />
                    )}
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-[#697D58] tracking-tight truncate max-w-md">{patient.fullName}</h1>
                        {patient.analytics?.isHighProfitability && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 animate-pulse">
                                <Activity size={10} />
                                Paciente de Alta Rentabilidade
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-bold">
                        <div className="flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-[#8A9A5B]" />
                            {age} anos
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CreditCard size={14} className="text-[#8A9A5B]" />
                            {patient.cpf || 'CPF não informado'}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 rounded-lg border border-slate-100 italic">
                            <Shield size={14} className="text-blue-500" />
                            {patient.insurance || 'Particular'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex flex-wrap items-center gap-3">
                <button className="flex items-center gap-2 px-5 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
                    <Plus size={18} />
                    Nova Evolução
                </button>
                <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-[#8A9A5B]/10 text-[#8A9A5B] rounded-2xl font-bold text-sm hover:bg-[#F5F5DC]/50 transition-all shadow-sm">
                    <FileText size={18} />
                    + Receita
                </button>
                <button className="flex items-center gap-2 px-5 py-3 bg-[#697D58] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
                    <Syringe size={18} />
                    Reg. Procedimento
                </button>
            </div>
        </div>
    );
};

export default PatientHeader;
