import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Save, Trash2, AlertTriangle, User, Mail, Phone, Calendar as CalendarIcon, Hash, Shield, Briefcase, MapPin } from 'lucide-react';
import { coreApi } from '../../../../services/api';
import { Input } from '../../../ui/Input';
import { Button } from '../../../ui/Button';
import { Label } from '../../../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';
import AlertDialog from '../../../ui/AlertDialog';
import { format } from 'date-fns';

const patientSchema = z.object({
    fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    cpf: z.string().refine((val) => !val || val.replace(/\D/g, '').length === 11, 'CPF deve ter 11 dígitos'),
    rg: z.string().optional(),
    gender: z.string().optional(),
    birthDate: z.string().optional(),
    profession: z.string().optional(),
    healthInsurance: z.string().optional(),
    leadSource: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export const MainDataModule = ({ patient, onUpdate }: { patient: any; onUpdate?: () => void }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            fullName: patient?.fullName || '',
            email: patient?.email || '',
            phone: patient?.phone || '',
            cpf: patient?.cpf || '',
            rg: patient?.rg || '',
            gender: patient?.gender || '',
            birthDate: patient?.birthDate ? format(new Date(patient.birthDate), 'yyyy-MM-dd') : '',
            profession: patient?.profession || '',
            healthInsurance: patient?.healthInsurance || '',
            leadSource: patient?.leadSource || '',
        }
    });

    useEffect(() => {
        if (patient) {
            reset({
                fullName: patient.fullName || '',
                email: patient.email || '',
                phone: patient.phone || '',
                cpf: patient.cpf || '',
                rg: patient.rg || '',
                gender: patient.gender || '',
                birthDate: patient.birthDate ? format(new Date(patient.birthDate), 'yyyy-MM-dd') : '',
                profession: patient.profession || '',
                healthInsurance: patient.healthInsurance || '',
                leadSource: patient.leadSource || '',
            });
        }
    }, [patient, reset]);

    const onSubmit = async (data: PatientFormData) => {
        setIsSaving(true);
        try {
            await coreApi.updatePatient(patient.id, data);
            toast.success('Dados do paciente atualizados com sucesso.', {
                style: {
                    background: '#697D58',
                    color: '#fff',
                    fontWeight: 'bold',
                },
                iconTheme: {
                    primary: '#fff',
                    secondary: '#697D58',
                },
            });
            if (onUpdate) onUpdate();
        } catch (error: any) {
            console.error('Error updating patient:', error);
            toast.error(error.response?.data?.error || 'Erro ao atualizar dados do paciente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== 'CONFIRMAR' && deleteConfirmText !== patient.fullName) {
            toast.error('Por favor, digite CONFIRMAR ou o nome do paciente para excluir.');
            return;
        }

        setIsDeleting(true);
        try {
            await coreApi.deletePatient(patient.id);
            toast.success('Paciente excluído com sucesso.');
            window.location.href = '/patients';
        } catch (error: any) {
            console.error('Error deleting patient:', error);
            toast.error(error.response?.data?.error || 'Não foi possível excluir o paciente.');
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    // Masks helpers
    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
        const masked = val
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        setValue('cpf', masked);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
        let masked = val;
        if (val.length > 10) {
            masked = val.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (val.length > 5) {
            masked = val.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (val.length > 2) {
            masked = val.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        } else if (val.length > 0) {
            masked = val.replace(/(\d{0,2})/, '($1');
        }
        setValue('phone', masked);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="bg-white rounded-[2.5rem] p-10 border border-[#8A9A5B]/5 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#F5F5DC] text-[#8A9A5B] rounded-xl font-bold">
                            <User size={20} />
                        </div>
                        <h3 className="font-black text-slate-700 tracking-tight text-xl">Informações Cadastrais</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Linha 1 */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    {...register('fullName')}
                                    className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-14 rounded-2xl font-bold text-slate-600"
                                    placeholder="Jonas Silva..."
                                />
                            </div>
                            {errors.fullName && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.fullName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rg" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">RG</Label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    {...register('rg')}
                                    className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-14 rounded-2xl font-bold text-slate-600"
                                    placeholder="00.000.000-0"
                                />
                            </div>
                        </div>

                        {/* Linha 2 */}
                        <div className="space-y-2">
                            <Label htmlFor="cpf" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CPF</Label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    {...register('cpf')}
                                    onChange={handleCpfChange}
                                    value={watch('cpf')}
                                    className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-14 rounded-2xl font-bold text-slate-600"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            {errors.cpf && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.cpf.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gênero</Label>
                            <Select onValueChange={(val) => setValue('gender', val)} defaultValue={watch('gender')}>
                                <SelectTrigger className="h-14 bg-slate-50 border-transparent focus:bg-white transition-all rounded-2xl font-bold text-slate-600">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-2xl shadow-xl border-slate-100">
                                    <SelectItem value="M" className="font-bold">Masculino</SelectItem>
                                    <SelectItem value="F" className="font-bold">Feminino</SelectItem>
                                    <SelectItem value="O" className="font-bold">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="birthDate" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data de Nascimento</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    {...register('birthDate')}
                                    type="date"
                                    className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-14 rounded-2xl font-bold text-slate-600"
                                />
                            </div>
                        </div>

                        {/* Linha 3 */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone / Celular</Label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    {...register('phone')}
                                    onChange={handlePhoneChange}
                                    value={watch('phone')}
                                    className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-14 rounded-2xl font-bold text-slate-600"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    {...register('email')}
                                    className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-14 rounded-2xl font-bold text-slate-600"
                                    placeholder="exemplo@email.com"
                                />
                            </div>
                            {errors.email && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Origem / Indicação</Label>
                            <Select onValueChange={(val) => setValue('leadSource', val)} defaultValue={watch('leadSource')}>
                                <SelectTrigger className="h-14 bg-slate-50 border-transparent focus:bg-white transition-all rounded-2xl font-bold text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-slate-300" />
                                        <SelectValue placeholder="Selecione..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-2xl shadow-xl border-slate-100 font-bold">
                                    <SelectItem value="Instagram">Instagram</SelectItem>
                                    <SelectItem value="Google">Google / Pesquisa</SelectItem>
                                    <SelectItem value="Indicação">Indicação</SelectItem>
                                    <SelectItem value="Tráfego Pago">Tráfego Pago</SelectItem>
                                    <SelectItem value="Outros">Outros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Linha 4 */}
                        <div className="space-y-2">
                            <Label htmlFor="profession" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Profissão</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    {...register('profession')}
                                    className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-14 rounded-2xl font-bold text-slate-600"
                                    placeholder="Engenheiro, Médico..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="healthInsurance" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Convênio / Plano</Label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    {...register('healthInsurance')}
                                    className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-14 rounded-2xl font-bold text-slate-600"
                                    placeholder="Unimed, Bradesco..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-2"
                    >
                        <Trash2 size={18} />
                        Excluir Paciente
                    </Button>

                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-[#697D58] hover:bg-[#5a6b4b] text-white px-10 py-6 rounded-2xl font-black text-sm shadow-xl shadow-[#697D58]/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                SALVAR ALTERAÇÕES
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <AlertDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setDeleteConfirmText('');
                }}
                onConfirm={handleDelete}
                title="Excluir Registro de Paciente?"
                description={
                    <div className="space-y-4">
                        <p>Esta ação é permanente. Para confirmar a exclusão de <span className="font-black text-slate-700">{patient?.fullName}</span>, digite <span className="font-black text-red-600">CONFIRMAR</span> abaixo:</p>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Digite CONFIRMAR aqui..."
                            className="bg-white border-slate-200 text-center font-black uppercase"
                        />
                    </div>
                }
                variant="danger"
                icon={AlertTriangle}
                confirmText="EXCLUIR DEFINITIVAMENTE"
                isPending={isDeleting}
            />
        </div>
    );
};
