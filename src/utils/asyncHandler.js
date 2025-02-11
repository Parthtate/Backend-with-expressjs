// asyncHandler is a middleware that wraps around async functions to catch any errors that are thrown and pass them to the next middleware in the chain. This way, we don't have to write try/catch blocks in our route handlers.
// WE acees DataBase multiple times so we use asyncHandler to handle errors.

// Code paradigme using Promise 
const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error));
    }
}

export {asyncHandler}

// Code paradigme using try Catch style

// const asyncHandlers = () => {}
// const asyncHandlers = (function) => {}
// const asyncHandlers = (function) => () => {}
// const asyncHandlers = (function) => async () => {}

/*
const asyncHandlers = (func) => async (req, res, next) => {
    try {
        await func(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })        
    }
} 
*/