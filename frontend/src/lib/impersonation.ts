// Helpers para o fluxo de impersonação do ADMIN_GLOBAL.
// Guardamos o token original do admin em uma chave separada antes de trocar
// o token principal, permitindo que "Sair do modo admin" restaure a sessão
// original sem novo login.

const ADMIN_TOKEN_KEY = 'heath_finance_admin_token';
const IMPERSONATED_CLINIC_NAME_KEY = 'heath_finance_impersonated_clinic_name';
const TOKEN_KEY = 'heath_finance_token';
const CLINIC_ID_KEY = 'heath_finance_clinic_id';

export function enterImpersonation(params: {
    targetToken: string;
    targetClinicId?: string | null;
    targetClinicName?: string | null;
}) {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
        localStorage.setItem(ADMIN_TOKEN_KEY, currentToken);
    }
    localStorage.setItem(TOKEN_KEY, params.targetToken);
    if (params.targetClinicId) {
        localStorage.setItem(CLINIC_ID_KEY, params.targetClinicId);
    }
    if (params.targetClinicName) {
        localStorage.setItem(IMPERSONATED_CLINIC_NAME_KEY, params.targetClinicName);
    }
}

export function exitImpersonation(): boolean {
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!adminToken) return false;
    localStorage.setItem(TOKEN_KEY, adminToken);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATED_CLINIC_NAME_KEY);
    localStorage.removeItem(CLINIC_ID_KEY);
    return true;
}

export function isImpersonating(): boolean {
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getImpersonatedClinicName(): string | null {
    return localStorage.getItem(IMPERSONATED_CLINIC_NAME_KEY);
}
