import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// SEC-001: JWT_SECRET obrigatório — nunca usar fallback hardcoded
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET não está definido nas variáveis de ambiente. Encerrando o servidor.');
    process.exit(1);
}

// SEC-006: Salt rounds mínimo de 12
const BCRYPT_ROUNDS = Math.max(parseInt(process.env.BCRYPT_ROUNDS || '12', 10), 12);

export interface JwtPayload {
    id: string;
    role: string;
    clinicId?: string;
    mustChangePassword?: boolean;
    adminAccessContext?: any;
    impersonatedBy?: string;
    isImpersonation?: boolean;
}

export class AuthService {
    static async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        return bcrypt.hash(password, salt);
    }

    static async comparePasswords(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static generateToken(payload: JwtPayload): string {
        const expiresIn = '25m'; // SEC-002: Token de curta duração

        return jwt.sign(payload, JWT_SECRET!, {
            expiresIn,
            algorithm: 'HS256',
            issuer: 'rares360',
            audience: 'rares360-api',
        });
    }

    static generateRefreshToken(payload: { id: string }): string {
        const expiresIn = '8h'; // SEC-003: Refresh token

        return jwt.sign(payload, JWT_SECRET!, {
            expiresIn,
            algorithm: 'HS256',
            issuer: 'rares360',
            audience: 'rares360-refresh',
        });
    }

    static verifyToken(token: string, isRefresh = false): any | null {
        try {
            return jwt.verify(token, JWT_SECRET!, {
                algorithms: ['HS256'],
                issuer: 'rares360',
                audience: isRefresh ? 'rares360-refresh' : 'rares360-api',
            });
        } catch (error: any) {
            console.error(`[AUTH] Falha na verificação do ${isRefresh ? 'refresh ' : ''}token:`, error.message);
            return null;
        }
    }
}
