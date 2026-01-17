export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (err, req, res, next) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err.message || 'Internal server error';
    const response = {
        success: false,
        message,
    };
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
        response.error = err.stack;
    }
    res.status(statusCode).json(response);
};
//# sourceMappingURL=errorHandler.js.map