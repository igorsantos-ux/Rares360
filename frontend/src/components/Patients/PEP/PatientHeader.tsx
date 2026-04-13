import { User, Shield, CreditCard, Activity, CalendarDays, Plus, FileText, Syringe } from 'lucide-react';
import { differenceInYears } from 'date-fns';

const PatientHeader = ({ patient }: { patient: any }) => {
    const age = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : 'N/A';

    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
            {/* Perfil Principal - Lado Esquerdo */}
            <div className="flex items-center gap-6 flex-1">
                <div className="w-20 h-20 bg-[#F5F5DC] border-2 border-[#8A9A5B]/30 rounded-full flex items-center justify-center p-1 shadow-md overflow-hidden shrink-0">
                    {patient.photoUrl ? (
                        <img src={patient.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <User size={32} className="text-[#8A9A5B]" />
                    )}
                </div>
                <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-black text-[#697D58] tracking-tight truncate">{patient.fullName}</h1>
                        {patient.analytics?.isHighProfitability && (
                            <span className="px-3 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Activity size={10} />
                                VIP
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-bold">
                        <div className="flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-[#8A9A5B]" />
                            {age} anos
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CreditCard size={14} className="text-[#8A9A5B]" />
                            {patient.cpf || 'CPF não informado'}
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-100">
                            <Shield size={14} className="text-blue-500" />
                            {patient.insurance || 'Particular'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ações Rápidas - Lado Direito */}
            <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#8A9A5B]/10 text-[#8A9A5B] rounded-xl font-bold text-xs hover:bg-[#F5F5DC]/50 transition-all shadow-sm">
                    <FileText size={16} />
                    + Receita
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#697D58] text-white rounded-xl font-bold text-xs shadow-lg shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
                    <Syringe size={16} />
                    Reg. Procedimento
                </button>
                <button className="flex items-center gap-2 px-5 py-3 bg-[#8A9A5B] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
                    <Plus size={18} />
                    Nova Evolução
                </button>
            </div>
        </div>
    );
};

export default PatientHeader;
