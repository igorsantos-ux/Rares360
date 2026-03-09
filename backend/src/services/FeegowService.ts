import axios from 'axios';

export class FeegowService {
    private static BASE_URL = 'https://api.feegow.com.br/v1';

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
                }
            });

            // Se a API responder (mesmo que vazio), o token é válido.
            // A documentação diz que erros de auth retornam 401 ou 403.
            return response.status === 200;
        } catch (error: any) {
            console.error('Erro ao validar token Feegow:', error.response?.data || error.message);
            return false;
        }
    }

    /**
     * Exemplo de busca de pacientes (pode ser usado futuramente para sincronização)
     */
    static async getPatients(token: string) {
        try {
            const response = await axios.get(`${this.BASE_URL}/pacientes/listar`, {
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
