class ApiError extends Error {
    constructor(
        httpStatusCode,
        message = "Somethins went wrong",
        errors = [],
        errorStack = "",
    ) {
        super(message)
        this.httpStatusCode = httpStatusCode
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