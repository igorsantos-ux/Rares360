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
                validateStatus: (status) => status < 500 // Aceita 422 como resposta válida do servidor
            });

            // Se retornar JSON com a estrutura do Feegow, o token foi Aceito pelo gateway
            if (response.data && typeof response.data.success !== 'undefined') {
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
    static async getPatients(token: string) {
        try {
            const response = await axios.get(`${this.BASE_URL}/patient/list`, {
                headers: {
                    'x-access-token': token,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Erro ao buscar pacientes Feegow: ${error.response?.data?.message || error.message}`);
        }
    }
}
