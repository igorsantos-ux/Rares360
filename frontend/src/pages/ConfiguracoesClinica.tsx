import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Settings, Percent, Stethoscope, Users, Building } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { configuracoesApi } from '../services/api';
import RepassesTab from '../components/Configuracoes/RepassesTab';
import ComissoesTab from '../components/Configuracoes/ComissoesTab';

export default function ConfiguracoesClinica() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
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
            toast({ title: 'Configurações salvas' });
        } catch (error) {
            toast({ title: 'Erro ao salvar', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Settings className="w-8 h-8 text-rares-primary" />
                        Configurações da Clínica
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gerencie as regras de negócio, impostos e custos operacionais (Motor de Regras).
                    </p>
                </div>
                <Button onClick={salvarGlobais} disabled={loading} className="bg-rares-primary hover:bg-rares-primary/90">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <Tabs defaultValue="impostos" className="w-full">
                <TabsList className="grid grid-cols-4 lg:w-[800px] mb-6">
                    <TabsTrigger value="impostos" className="flex items-center gap-2">
                        <Percent className="w-4 h-4" /> Impostos
                    </TabsTrigger>
                    <TabsTrigger value="repasses" className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" /> Repasses Médicos
                    </TabsTrigger>
                    <TabsTrigger value="comissoes" className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Comissões
                    </TabsTrigger>
                    <TabsTrigger value="custos" className="flex items-center gap-2">
                        <Building className="w-4 h-4" /> Custos de Sala
                    </TabsTrigger>
                </TabsList>

                {/* ABA: IMPOSTOS */}
                <TabsContent value="impostos" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Regime Tributário</CardTitle>
                            <CardDescription>Configure se a clínica possui equiparação hospitalar para redução de CSLL e IRPJ.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Equiparação Hospitalar</Label>
                                    <p className="text-sm text-gray-500">Ative se a clínica tiver permissão contábil para pagar impostos reduzidos.</p>
                                </div>
                                <Switch 
                                    checked={equiparacaoHospitalar}
                                    onCheckedChange={setEquiparacaoHospitalar}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABA: REPASSES */}
                <TabsContent value="repasses">
                    <RepassesTab />
                </TabsContent>

                {/* ABA: COMISSÕES */}
                <TabsContent value="comissoes">
                    <ComissoesTab />
                </TabsContent>

                {/* ABA: CUSTOS */}
                <TabsContent value="custos">
                    <Card>
                        <CardHeader>
                            <CardTitle>Custo Operacional</CardTitle>
                            <CardDescription>Configure o custo hora/minuto da estrutura clínica.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2 w-[300px]">
                                <Label>Custo Padrão por Minuto (R$)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={custoMinutoSala} 
                                    onChange={(e) => setCustoMinutoSala(Number(e.target.value))}
                                    placeholder="Ex: 1.50"
                                />
                                <p className="text-xs text-gray-500">
                                    Este valor será multiplicado pelo tempo do procedimento na precificação.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
