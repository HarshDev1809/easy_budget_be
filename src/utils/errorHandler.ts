// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/index.js';
import { getStatusCode } from './error/getStatusCode.js';
import { getStack } from './error/getStack.js';
import { getMessage } from './error/getMessage.js';
import { getHttpMessage } from './getHttpMessage.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = getStatusCode(err)
    res.status(statusCode).json({
        success: false,
        message : getHttpMessage(statusCode),
        // only expose stack trace in dev
        ...(env.nodeEnv === 'dev' && { stack: getStack(err) }),
        ...(env.nodeEnv === 'dev' && { error: getMessage(err) })
    });
};