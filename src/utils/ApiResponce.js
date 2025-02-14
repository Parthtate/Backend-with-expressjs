class ApiResponce {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400 // check what is server status code
    }
}

export { ApiResponce }