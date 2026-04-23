import { HTTP_MESSAGES } from "../constants/httpMessages.js"

export const getHttpMessage = (statusCode : number) :string =>{
    return HTTP_MESSAGES[statusCode] ?? "An unexpected error occurred."
}