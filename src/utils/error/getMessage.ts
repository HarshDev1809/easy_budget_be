export const getMessage = (error: unknown): string => {
    const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);

    return errorMessage;
};