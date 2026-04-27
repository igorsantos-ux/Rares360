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
export class AuthService {
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        return bcrypt.hash(password, salt);
    }
    static async comparePasswords(password, hash) {
        return bcrypt.compare(password, hash);
    }
    static generateToken(payload) {
        const expiresIn = payload.role === 'ADMIN_GLOBAL' ? '15m' : '25m';
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn,
            algorithm: 'HS256',
            issuer: 'rares360',
            audience: 'rares360-api',
        });
    }
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET, {
                algorithms: ['HS256'],
                issuer: 'rares360',
                audience: 'rares360-api',
            });
        }
        catch (error) {
            console.error('[AUTH] Falha na verificação do token:', error.message);
            return null;
        }
    }
}
