import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      validated?: any;
      session?: any;
      user: {
        id: string;
        email: string;
        // add other fields you set on req.user
      };
    }
  }
}