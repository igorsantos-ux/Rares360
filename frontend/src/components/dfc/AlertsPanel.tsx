import React from 'react';
import { AlertCircle, FileWarning, ArrowUpCircle, Info } from 'lucide-react';
import type { DfcAlert } from '../../types/Dfc';

interface Props {
    alerts: DfcAlert[];
}

export const AlertsPanel: React.FC<Props> = ({ alerts }) => {

    const getAlertStyle = (type: string) => {
        switch (type) {
            case 'CRITICAL': return 'bg-red-50 text-red-800 border-red-200';
            case 'WARNING': return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'OPPORTUNITY': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
            case 'INFO': default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'CRITICAL': return <AlertCircle size={18} className="text-red-500 flex-shrink-0" />;
            case 'WARNING': return <FileWarning size={18} className="text-amber-500 flex-shrink-0" />;
            case 'OPPORTUNITY': return <ArrowUpCircle size={18} className="text-indigo-500 flex-shrink-0" />;
            case 'INFO': default: return <Info size={18} className="text-slate-400 flex-shrink-0" />;
        }
    };

    if (!alerts || alerts.length === 0) {
        return (
            <div className="p-4 text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-2xl">
                Nenhum alerta pendente no momento.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-2xl border ${getAlertStyle(alert.type)} shadow-sm`}>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                        <div className="flex-1">
                            <p className="text-sm font-bold leading-tight mb-1">{alert.message}</p>
                            {alert.date && (
                                <p className="text-xs font-semibold opacity-70 mb-2">Evento em: {alert.date}</p>
                            )}
                            {alert.actionLabel && (
                                <button className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg border bg-white/50 hover:bg-white transition-colors
                                  ${alert.type === 'CRITICAL' ? 'text-red-700 border-red-300' :
                                        alert.type === 'WARNING' ? 'text-amber-700 border-amber-300' :
                                            alert.type === 'OPPORTUNITY' ? 'text-indigo-700 border-indigo-300' : 'text-slate-600 border-slate-300'}
                                `}>
                                    {alert.actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
