
class AppError extends Error {
    statusCode;
    message;
    errorCode;

    constructor(statusCode, message, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errorCode = errorCode;

        // Maintain proper stack trace (especially for V8 engines like Node.js)
        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;
