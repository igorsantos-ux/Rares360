import axios from 'axios';

export class FeegowService {
    private static BASE_URL = 'https://api.feegow.com/v1/api';

    /**
     * Valida o token x-access-token fazendo uma chamada simples à API do Feegow.
     * Estamos usando o endpoint de listagem de unidades como teste de conectividade.
     */
    static async validateToken(token: string): Promise<boolean> {
        try {
            const response = await axios.get(`${this.BASE_URL}/unidades/listar`, {
                headers: {
                    'x-access-token': token,
                    'Content-Type': 'application/json'
                },
                validateStatus: (status: number) => status < 500 // Aceita 422 como resposta válida do servidor
            });

            // Se retornar JSON com a estrutura do Feegow, o token foi Aceito pelo gateway
            if (response.data && typeof (response.data as any).success !== 'undefined') {
                return true;
            }

            return response.status === 200;
        } catch (error) {
            console.error('Erro ao validar token Feegow:', error);
            return false;
        }
    }

    /**
     * Exemplo de busca de pacientes (pode ser usado futuramente para sincronização)
     */
    static async getPatients(token: string, offset: number = 0, limit: number = 50) {
        try {
            const response = await axios.get(`${this.BASE_URL}/patient/list`, {
                headers: {
                    'x-access-token': token,
                    'Content-Type': 'application/json'
                },
                params: {
                    offset,
                    limit
                }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Erro ao buscar pacientes Feegow: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Busca faturas (contas a pagar/receber) do Feegow.
     * @param type 'C' para Receber (Crédito), 'D' para Pagar (Débito)
     */
    static async getInvoices(token: string, type: 'C' | 'D', dataStart: string, dataEnd: string) {
        try {
            const response = await axios.get(`${this.BASE_URL}/financial/list-invoice`, {
                params: {
                    tipo_transacao: type,
                    data_start: dataStart,
                    data_end: dataEnd
                },
                headers: {
                    'x-access-token': token,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Erro ao buscar faturas Feegow: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Busca o plano de contas/categorias financeiras.
     */
    static async getFinancialCategories(token: string, type: 'income' | 'expense') {
        try {
            const response = await axios.post(`${this.BASE_URL}/core/financial/base/financial-category`, {
                page: 1,
                perPage: 1000,
                type
            }, {
                headers: {
                    'x-access-token': token,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Erro ao buscar categorias Feegow: ${error.response?.data?.message || error.message}`);
        }
    }
}
