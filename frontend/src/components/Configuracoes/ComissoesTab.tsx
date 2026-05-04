import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { configuracoesApi } from '../../services/api';
import { useToast } from '../ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function ComissoesTab() {
    const { toast } = useToast();
    const [regras, setRegras] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    // Form
    const [gatilho, setGatilho] = useState('VENDA');
    const [tipoValor, setTipoValor] = useState('PERCENTUAL');
    const [valor, setValor] = useState('');

    const loadRegras = async () => {
        try {
            setLoading(true);
            const { data } = await configuracoesApi.getRegrasComissao();
            setRegras(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRegras();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta regra?')) return;
        try {
            await configuracoesApi.deleteRegraComissao(id);
            toast({ title: 'Regra excluída' });
            loadRegras();
        } catch (error) {
            toast({ title: 'Erro ao excluir', variant: 'destructive' });
        }
    };

    const handleCreate = async () => {
        if (!valor) return toast({ title: 'Preencha o valor', variant: 'destructive' });
        try {
            await configuracoesApi.createRegraComissao({
                gatilho,
                tipoValor,
                valor: Number(valor)
            });
            toast({ title: 'Regra criada com sucesso' });
            setOpenDialog(false);
            loadRegras();
        } catch (error) {
            toast({ title: 'Erro ao criar regra', variant: 'destructive' });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Comissões da Equipe</CardTitle>
                    <CardDescription>Gerencie as regras de comissão para fechamento de orçamentos e vendas.</CardDescription>
                </div>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-rares-primary"><Plus className="w-4 h-4 mr-2" /> Nova Regra</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Regra de Comissão</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Gatilho</Label>
                                <Select value={gatilho} onValueChange={setGatilho}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="VENDA">Venda (Aprovação de Orçamento)</SelectItem>
                                        <SelectItem value="META">Meta Batida</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Valor</Label>
                                <Select value={tipoValor} onValueChange={setTipoValor}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERCENTUAL">Percentual (%)</SelectItem>
                                        <SelectItem value="FIXO">Valor Fixo (R$)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor</Label>
                                <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} />
                            </div>
                            <Button className="w-full bg-rares-primary" onClick={handleCreate}>Salvar Regra</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Escopo</TableHead>
                            <TableHead>Gatilho</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {regras.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-gray-500">Nenhuma regra cadastrada.</TableCell></TableRow>
                        ) : regras.map(r => (
                            <TableRow key={r.id}>
                                <TableCell>
                                    {r.userId ? `Usuário: ${r.user?.name}` : r.procedimentoId ? `Procedimento: ${r.procedimento?.name}` : r.categoriaId ? `Categoria: ${r.categoria?.nome}` : 'Regra Global (Todos)'}
                                </TableCell>
                                <TableCell>{r.gatilho}</TableCell>
                                <TableCell>{r.tipoValor === 'PERCENTUAL' ? `${r.valor}%` : `R$ ${r.valor}`}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
