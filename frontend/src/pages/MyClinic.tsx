import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    Building2, 
    MapPin, 
    Phone, 
    Mail, 
    Upload, 
    Save, 
    Loader2, 
    Globe, 
    Smartphone,
    X
} from 'lucide-react';
import { clinicApi } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const clinicSchema = z.object({
    name: z.string().min(3, 'Nome Fantasia deve ter pelo menos 3 caracteres'),
    razaoSocial: z.string().min(3, 'Razão Social deve ter pelo menos 3 caracteres'),
    cnpj: z.string().min(14, 'CNPJ inválido'),
    cnes: z.string().optional(),
    telefone: z.string().min(10, 'Telefone inválido'),
    whatsapp: z.string().optional(),
    email: z.string().email('E-mail inválido'),
    cep: z.string().min(8, 'CEP inválido'),
    logradouro: z.string().min(3, 'Rua obrigatória'),
    numero: z.string().min(1, 'Número obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(2, 'Bairro obrigatório'),
    cidade: z.string().min(2, 'Cidade obrigatória'),
    estado: z.string().length(2, 'UF deve ter 2 caracteres'),
    logo: z.string().optional(),
});

type ClinicFormValues = z.infer<typeof clinicSchema>;

const MyClinic = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<ClinicFormValues>({
        resolver: zodResolver(clinicSchema)
    });

    const cepValue = watch('cep');

    // Busca dados da clínica ao carregar
    useEffect(() => {
        const loadClinicData = async () => {
            try {
                const response = await clinicApi.getMe();
                const clinic = response.data;
                reset(clinic);
                if (clinic.logo) setLogoPreview(clinic.logo);
            } catch (error) {
                toast.error('Erro ao carregar dados da clínica');
            } finally {
                setIsLoading(false);
            }
        };
        loadClinicData();
    }, [reset]);

    // Automação ViaCEP
    useEffect(() => {
        const cleanCep = cepValue?.replace(/\D/g, '');
        if (cleanCep?.length === 8) {
            fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
                .then(res => res.json())
                .then(data => {
                    if (!data.erro) {
                        setValue('logradouro', data.logradouro);
                        setValue('bairro', data.bairro);
                        setValue('cidade', data.localidade);
                        setValue('estado', data.uf);
                        toast.success('Endereço preenchido automaticamente');
                    }
                })
                .catch(() => console.error('Erro ao buscar CEP'));
        }
    }, [cepValue, setValue]);

    const onSubmit = async (data: ClinicFormValues) => {
        setIsSaving(true);
        try {
            await clinicApi.updateMe(data);
            toast.success('Dados da clínica atualizados com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar alterações');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (file: File) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        const loadingToast = toast.loading('Enviando logotipo...');
        try {
            const response = await clinicApi.uploadLogo(formData);
            const logoUrl = response.data.url;
            setLogoPreview(logoUrl);
            setValue('logo', logoUrl);
            toast.success('Logotipo atualizado!', { id: loadingToast });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao enviar logotipo', { id: loadingToast });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleLogoUpload(file);
        }
    };

    // Máscaras Simples
    const maskCnpj = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18);
    };

    const maskCep = (value: string) => {
        return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
            .substring(0, 15);
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando dados cadastrais...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Fixo/Top */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Minha Clínica</h2>
                    <p className="text-slate-500 font-medium mt-1">Gerencie a identidade visual e as informações oficiais da sua unidade.</p>
                </div>
                <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-4 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
                {/* Branding Section */}
                <Card title="Identidade & Branding" icon={<Building2 size={20} />}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Logo Upload */}
                        <div className="lg:col-span-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Logotipo da Clínica</label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative aspect-square rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer group ${
                                    isDragging ? 'border-[#8A9A5B] bg-[#8A9A5B]/5 scale-[0.98]' : 'border-slate-200 hover:border-[#8A9A5B]/30 bg-slate-50/50'
                                }`}
                                onClick={() => document.getElementById('logo-input')?.click()}
                            >
                                {logoPreview ? (
                                    <>
                                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-6" />
                                        <div className="absolute inset-0 bg-[#697D58]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center">
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-xs font-black uppercase tracking-widest">Alterar Logotipo</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                            <Upload size={32} strokeWidth={1.5} />
                                        </div>
                                        <p className="text-xs font-bold px-6 text-center">Arraste sua logo aqui ou clique para selecionar</p>
                                        <span className="text-[10px] mt-2 opacity-60">PNG, JPG ou SVG (Máx 2MB)</span>
                                    </div>
                                )}
                                <input
                                    id="logo-input"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleLogoUpload(file);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Branding Fields */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Razão Social" error={errors.razaoSocial?.message}>
                                <input
                                    {...register('razaoSocial')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="Ex: Clínica Saúde Ltda"
                                />
                            </InputGroup>
                            <InputGroup label="Nome Fantasia" error={errors.name?.message}>
                                <input
                                    {...register('name')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="Ex: Rares Clinic"
                                />
                            </InputGroup>
                            <InputGroup label="CNPJ" error={errors.cnpj?.message}>
                                <input
                                    {...register('cnpj')}
                                    onChange={(e) => setValue('cnpj', maskCnpj(e.target.value))}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="00.000.000/0000-00"
                                />
                            </InputGroup>
                            <InputGroup label="CNES (Opcional)" error={errors.cnes?.message}>
                                <input
                                    {...register('cnes')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="Cadastro Nac. de Estab. de Saúde"
                                />
                            </InputGroup>
                        </div>
                    </div>
                </Card>

                {/* Location Section */}
                <Card title="Localização & Sede" icon={<MapPin size={20} />}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-3">
                            <InputGroup label="CEP" error={errors.cep?.message}>
                                <div className="relative">
                                    <input
                                        {...register('cep')}
                                        onChange={(e) => setValue('cep', maskCep(e.target.value))}
                                        className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                        placeholder="00000-000"
                                    />
                                    <Globe className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                </div>
                            </InputGroup>
                        </div>
                        <div className="md:col-span-7">
                            <InputGroup label="Logradouro" error={errors.logradouro?.message}>
                                <input
                                    {...register('logradouro')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="Rua, Avenida, etc"
                                />
                            </InputGroup>
                        </div>
                        <div className="md:col-span-2">
                            <InputGroup label="Número" error={errors.numero?.message}>
                                <input
                                    {...register('numero')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="123"
                                />
                            </InputGroup>
                        </div>
                        <div className="md:col-span-4">
                            <InputGroup label="Bairro" error={errors.bairro?.message}>
                                <input
                                    {...register('bairro')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                />
                            </InputGroup>
                        </div>
                        <div className="md:col-span-4">
                            <InputGroup label="Cidade" error={errors.cidade?.message}>
                                <input
                                    {...register('cidade')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                />
                            </InputGroup>
                        </div>
                        <div className="md:col-span-2">
                            <InputGroup label="Estado (UF)" error={errors.estado?.message}>
                                <input
                                    {...register('estado')}
                                    maxLength={2}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700 uppercase"
                                />
                            </InputGroup>
                        </div>
                        <div className="md:col-span-12">
                            <InputGroup label="Complemento" error={errors.complemento?.message}>
                                <input
                                    {...register('complemento')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="Sala, Andar, Ponto de referência"
                                />
                            </InputGroup>
                        </div>
                    </div>
                </Card>

                {/* Contact Section */}
                <Card title="Canais de Atendimento" icon={<Phone size={20} />}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputGroup label="Telefone Fixo" error={errors.telefone?.message}>
                            <div className="relative">
                                <input
                                    {...register('telefone')}
                                    onChange={(e) => setValue('telefone', maskPhone(e.target.value))}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="(00) 0000-0000"
                                />
                                <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                        </InputGroup>
                        <InputGroup label="WhatsApp / Celular" error={errors.whatsapp?.message}>
                            <div className="relative">
                                <input
                                    {...register('whatsapp')}
                                    onChange={(e) => setValue('whatsapp', maskPhone(e.target.value))}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="(00) 00000-0000"
                                />
                                <Smartphone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9A5B]/60" />
                            </div>
                        </InputGroup>
                        <InputGroup label="E-mail Corporativo" error={errors.email?.message}>
                            <div className="relative">
                                <input
                                    {...register('email')}
                                    className="w-full px-5 py-3.5 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="contato@clinica.com.br"
                                />
                                <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                        </InputGroup>
                    </div>
                </Card>
            </form>
        </div>
    );
};

const Card = ({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden p-8 md:p-10">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#8A9A5B]/5">
            <div className="w-12 h-12 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center text-[#8A9A5B]">
                {icon}
            </div>
            <h3 className="text-xl font-black text-[#697D58] tracking-tight">{title}</h3>
        </div>
        {children}
    </div>
);

const InputGroup = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        {children}
        <AnimatePresence>
            {error && (
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] font-bold text-red-500 mt-1 ml-1 flex items-center gap-1"
                >
                    <X size={10} strokeWidth={3} />
                    {error}
                </motion.span>
            )}
        </AnimatePresence>
    </div>
);

export default MyClinic;
