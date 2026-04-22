import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      validated?: any; // Or use your Zod inferred type here
    }
  }
}