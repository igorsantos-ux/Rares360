import { useAdmin } from '../contexts/AdminContext';

// Re-exportando o hook para compatibilidade com o código existente
export const useAdminContext = useAdmin;

export type { AdminAccessContextData } from '../contexts/AdminContext';
