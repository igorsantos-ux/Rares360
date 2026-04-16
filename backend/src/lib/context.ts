import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  clinicId: string;
  userId?: string;
  ipAddress?: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();

export function getClinicId(): string | undefined {
  return tenantContext.getStore()?.clinicId;
}

export function getUserId(): string | undefined {
  return tenantContext.getStore()?.userId;
}

export function getIpAddress(): string | undefined {
  return tenantContext.getStore()?.ipAddress;
}
