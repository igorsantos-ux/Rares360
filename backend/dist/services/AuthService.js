import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'heath_finance_secret_key_2026';
export class AuthService {
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
    static async comparePasswords(password, hash) {
        return bcrypt.compare(password, hash);
    }
    static generateToken(payload) {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    }
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (error) {
            console.error('--- JWT VERIFY ERROR ---', error.message);
            return null;
        }
    }
}
