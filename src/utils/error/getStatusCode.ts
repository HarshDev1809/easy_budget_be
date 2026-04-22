import { ApiError } from "../ApiError.js";

export function getStatusCode(error: unknown): number {
    if (error instanceof ApiError) return error.statusCode;
    if (error && typeof error === 'object' && 'statusCode' in error) {
        return (error as {statusCode : number}).statusCode;
    }
    return 500;
}