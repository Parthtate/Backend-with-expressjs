class ApiError extends Error {
    constructor(
        statusCode,
        message = "Somethins went wrong",
        errors = [],
        errorStack = "",
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null // check what is this
        this.message = message
        this.success = false 
        this.errors = errors
        
        if (errorStack) {
            this.stack = errorStack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}