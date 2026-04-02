import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pepApi } from '../../../../services/api';
import { 
    Plus, 
    Lock, 
    History, 
    CheckCircle2, 
    AlertCircle,
    User,
    Clock,
    FileText,
    Loader2
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EvolutionModule = ({ patient }: { patient: any }) => {
    const queryClient = useQueryClient();
    const [isWriting, setIsWriting] = useState(false);
    
    const { data: evolutions, isLoading } = useQuery({
        queryKey: ['evolutions', patient.id],
        queryFn: async () => {
            const response = await pepApi.getEvolutions(patient.id);
            return response.data;
        }
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Descreva a evolução do paciente aqui...',
            }),
        ],
    });

    const createMutation = useMutation({
        mutationFn: (text: string) => pepApi.createEvolution({
            patientId: patient.id,
            text,
            professionalId: 'staff-id-here', // Simplificado para o demo
            date: new Date()
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evolutions', patient.id] });
            setIsWriting(false);
            editor?.commands.clearContent();
        }
    });

    const handleSave = () => {
        if (editor?.getText()) {
            createMutation.mutate(editor.getHTML());
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F5DC]/10">
            {/* Top Bar do Módulo */}
            <div className="p-8 pb-4 border-b border-[#8A9A5B]/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-[#697D58]">Evolução Clínica</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Histórico chronológico de atendimentos e anotações</p>
                </div>
                {!isWriting && (
                    <button 
                        onClick={() => setIsWriting(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 transition-all hover:scale-[1.02]"
                    >
                        <Plus size={20} />
                        Nova Evolução
                    </button>
                )}
            </div>

            {/* Editor Area */}
            {isWriting && (
                <div className="p-8 border-b border-[#8A9A5B]/10 bg-white/80 animate-in slide-in-from-top duration-300">
                    <div className="bg-white border-2 border-[#8A9A5B]/20 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-[#F5F5DC]/30 px-6 py-3 border-b border-[#8A9A5B]/10 flex items-center justify-between">
                            <span className="text-[10px] font-black text-[#697D58] uppercase tracking-widest">Nova Anotação Clinica</span>
                            <div className="flex items-center gap-2">
                                <button className="p-1.5 hover:bg-white rounded-lg text-slate-400 transition-all"><b>B</b></button>
                                <button className="p-1.5 hover:bg-white rounded-lg text-slate-400 transition-all"><i>I</i></button>
                            </div>
                        </div>
                        <div className="p-6 prose max-w-none min-h-[150px]">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button 
                            onClick={() => setIsWriting(false)}
                            className="px-6 py-2.5 text-slate-400 font-bold text-sm hover:text-red-500 transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={createMutation.isPending}
                            className="px-8 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#8A9A5B]/20 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            {createMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            Salvar Evolução
                        </button>
                    </div>
                </div>
            )}

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 className="animate-spin text-[#8A9A5B]" size={32} />
                    </div>
                ) : evolutions?.length === 0 && !isWriting ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-[#F5F5DC] rounded-full flex items-center justify-center text-[#8A9A5B]/30">
                            <FileText size={32} />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma evolução registrada para este paciente</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[23px] top-0 bottom-0 w-1 bg-[#8A9A5B]/10 rounded-full" />
                        
                        <div className="space-y-12">
                            {evolutions?.map((ev: any) => (
                                <div key={ev.id} className="relative pl-16 group">
                                    {/* Bubble indicator */}
                                    <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-md z-10 transition-transform group-hover:scale-110 ${ev.isLocked ? 'bg-slate-100 text-slate-400' : 'bg-[#8A9A5B] text-white'}`}>
                                        {ev.isLocked ? <Lock size={18} /> : <History size={18} />}
                                    </div>

                                    {/* Card Content */}
                                    <div className="bg-white rounded-[2rem] border border-[#8A9A5B]/10 shadow-sm p-8 transition-all hover:shadow-xl hover:shadow-[#8A9A5B]/5 group-hover:translate-x-2">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#697D58]">{ev.professional?.name || 'Profissional'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ev.professional?.specialty || 'Médico'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2 text-[#8A9A5B] font-bold text-xs bg-[#F5F5DC]/50 px-3 py-1 rounded-lg border border-[#8A9A5B]/10">
                                                    <Clock size={12} />
                                                    {format(new Date(ev.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                </div>
                                                <span className="text-[9px] text-slate-300 font-bold uppercase">{formatDistanceToNow(new Date(ev.date), { addSuffix: true, locale: ptBR })}</span>
                                            </div>
                                        </div>

                                        <div 
                                            className="prose prose-slate bg-slate-50/30 p-6 rounded-2xl border border-dotted border-slate-200 text-slate-600 font-medium leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: ev.text }}
                                        />

                                        {ev.isLocked && (
                                            <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-300 text-[10px] font-black uppercase tracking-widest">
                                                    <AlertCircle size={14} />
                                                    Registro de Prontuário Bloqueado (Segurança)
                                                </div>
                                                <button className="text-[10px] font-black text-[#8A9A5B] uppercase tracking-widest hover:underline">Adicionar Adendo</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvolutionModule;
