import { Request, Response, NextFunction } from "express";
import { transactionSchema, verifyDeleteTransactionSchema } from "../../schemas/transactions.schemas.js";

export const validateTransaction = (req: Request, res: Response, next: NextFunction): void => {
    try {
        req.body = transactionSchema.parse(req.body);
        next();
    } catch (error) {
        next(error);
    }
};

export const validateDeleteToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        req.body = verifyDeleteTransactionSchema.parse(req.body);
        next();
    } catch (error) {
        next(error);
    }
};
