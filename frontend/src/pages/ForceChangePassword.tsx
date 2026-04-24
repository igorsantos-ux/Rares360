import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';

export default function ForceChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { user } = useAuth();

    // Validação de força de senha
    const validatePasswordStrength = (password: string) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };

    const strength = validatePasswordStrength(newPassword);
    
    const getStrengthColor = () => {
        if (strength <= 2) return 'bg-red-500';
        if (strength === 3) return 'bg-yellow-500';
        if (strength >= 4) return 'bg-green-500';
        return 'bg-gray-200';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (strength < 4) {
            toast.error('A nova senha não atende aos requisitos mínimos de segurança.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('heath_finance_token');
            await authApi.updatePassword(
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Senha atualizada com sucesso!');
            
            // Recarregar os dados do usuário para remover a flag mustChangePassword
            // Idealmente a API de login/me retornará o usuário atualizado
            setTimeout(() => {
                 window.location.href = user?.role === 'ADMIN_GLOBAL' ? '/saas-dashboard' : '/dashboard';
            }, 1000);

        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-[#3B6D11] p-6 text-center text-white">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-[#E2C044]" />
                    <h2 className="text-2xl font-bold">Segurança da Conta</h2>
                    <p className="text-[#F5F0E8]/80 text-sm mt-1">
                        Para sua segurança, é necessário definir uma nova senha.
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1">
                        <Label>Senha Temporária</Label>
                        <Input 
                            type="password" 
                            required
                            placeholder="Sua senha atual ou provisória"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Nova Senha Segura</Label>
                        <Input 
                            type="password" 
                            required
                            placeholder="Mínimo 8 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden flex">
                            <div className={`h-full transition-all duration-300 ${getStrengthColor()}`} style={{ width: `${(strength / 5) * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Deve conter maiúsculas, minúsculas, números e símbolos (!@#$%).
                        </p>
                    </div>

                    <div className="space-y-1">
                        <Label>Confirmar Nova Senha</Label>
                        <Input 
                            type="password" 
                            required
                            placeholder="Digite novamente"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={loading || strength < 4 || newPassword !== confirmPassword}
                        className="w-full bg-[#3B6D11] hover:bg-[#2c530c] text-white"
                    >
                        {loading ? 'Atualizando Segurança...' : 'Atualizar e Acessar Sistema'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
