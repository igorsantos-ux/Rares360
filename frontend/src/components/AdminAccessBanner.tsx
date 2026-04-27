import React, { useState } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useAdminContext } from '../hooks/useAdminContext';
import AlertDialog from './ui/AlertDialog';

const AdminAccessBanner: React.FC = () => {
    const {
        isAdminAccess,
        clinicName,
        adminName,
        adminEmail,
        accessStartedAt,
        sessionDuration,
        exitAdminAccess
    } = useAdminContext();

    const [isExitAlertOpen, setIsExitAlertOpen] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    if (!isAdminAccess) return null;

    const formattedTime = accessStartedAt ? new Date(accessStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    const handleConfirmExit = async () => {
        setIsExiting(true);
        await exitAdminAccess();
        setIsExitAlertOpen(false);
    };

    return (
        <>
            <div
                className="fixed top-0 left-0 right-0 h-[48px] z-[9999] bg-[#1A1A2E] border-b-2 border-[#534AB7] flex items-center justify-between px-4 text-white shadow-2xl"
                style={{ height: '48px' }}
            >
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-4 h-4 mr-1">
                        <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-[#A78BFA]"></span>
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-[#A78BFA]"></span>
                    </div>

                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-black tracking-tight flex items-center gap-1">
                                🛡️ MODO ADMIN GLOBAL <span className="opacity-50 mx-1">—</span> Você está visualizando: <span className="text-[#A78BFA] ml-1">{clinicName || 'Clínica Desconhecida'}</span>
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#534AB7]/30 border border-[#534AB7]/50 text-[9px] font-black uppercase tracking-widest text-[#A78BFA] ml-2">
                                ADMIN GLOBAL
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold tracking-wide flex items-center gap-1 mt-0.5">
                            Logado como: <span className="text-white font-bold">{adminName}</span> ({adminEmail}) <span className="opacity-50 mx-1">·</span>
                            Acesso iniciado às {formattedTime} <span className="opacity-50 mx-1">·</span> Sessão registrada em auditoria
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end" title="Tempo nesta sessão de acesso admin">
                        <span className="text-[9px] text-[#A78BFA] font-black uppercase tracking-widest opacity-80">SESSÃO ATIVA</span>
                        <span className="text-xs font-mono font-bold">{sessionDuration}</span>
                    </div>

                    <button
                        onClick={() => setIsExitAlertOpen(true)}
                        className="h-8 px-4 bg-[#534AB7] hover:bg-[#3D2D9F] text-white rounded-lg font-black text-[11px] uppercase tracking-widest transition-all shadow-md shadow-[#534AB7]/20 flex items-center gap-2 border border-[#A78BFA]/20 hover:border-[#A78BFA]/50"
                    >
                        <LogOut size={14} /> Sair da clínica
                    </button>
                </div>
            </div>

            <AlertDialog
                isOpen={isExitAlertOpen}
                onClose={() => setIsExitAlertOpen(false)}
                onConfirm={handleConfirmExit}
                title="Sair do acesso administrativo?"
                description={<>Você será redirecionado para o <strong>Painel Global Rares360</strong>. A sessão de acesso à <strong>{clinicName}</strong> será encerrada e o tempo total logado será registrado em auditoria.</>}
                confirmText={isExiting ? "Saindo..." : "Confirmar saída"}
                cancelText="Cancelar"
                icon={ShieldAlert}
                iconBg="bg-[#534AB7]/10"
                iconColor="text-[#534AB7]"
                isPending={isExiting}
                variant="success" // O variant Success do AlertDialog usa #697D58, que difere das cores pedidas (mas o botão devia ser verde conforme requisito? "...Botões: Cancelar | Confirmar saída (verde)")
            />
        </>
    );
};

export default AdminAccessBanner;
