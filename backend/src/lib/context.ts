import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  clinicId: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();

export function getClinicId(): string | undefined {
  return tenantContext.getStore()?.clinicId;
}
