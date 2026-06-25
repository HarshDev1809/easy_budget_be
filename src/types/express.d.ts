declare global {
  namespace Express {
    interface Request {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validated?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session?: any;
      user: {
        id: string;
        email: string;
        // add other fields you set on req.user
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction?: any;
    }
  }
}

export {};