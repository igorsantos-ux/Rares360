import { AsyncLocalStorage } from 'async_hooks';
export const tenantContext = new AsyncLocalStorage();
export function getClinicId() {
    return tenantContext.getStore()?.clinicId;
}
