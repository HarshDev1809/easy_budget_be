import crypto from 'node:crypto';

export const generateRefreshToken = (): string=>{
        const token = crypto.randomBytes(40).toString('hex');

        const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

        return hashedToken;
}