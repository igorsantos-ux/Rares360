import { AsyncLocalStorage } from 'async_hooks';
export const tenantContext = new AsyncLocalStorage();
export function getClinicId() {
    return tenantContext.getStore()?.clinicId;
}
export function getUserId() {
    return tenantContext.getStore()?.userId;
}
export function getIpAddress() {
    return tenantContext.getStore()?.ipAddress;
}
