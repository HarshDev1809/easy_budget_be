import jwt from 'jsonwebtoken';

export const signToken = (
    payload: string | object | Buffer,
    secret: string,
    options: jwt.SignOptions = {}
): Promise<string> => {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) return reject(err);
            // We cast to string because we know jwt.sign 
            // returns a string in this async callback mode
            resolve(token as string);
        });
    });
};