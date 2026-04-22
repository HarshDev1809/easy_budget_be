export const getStack = (error : unknown) : string | undefined=> {
    if(error instanceof Error){
        return error.stack
    }

    return undefined
}