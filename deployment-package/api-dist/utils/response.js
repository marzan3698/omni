export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};
export const sendError = (res, message, statusCode = 400) => {
    const response = {
        success: false,
        message,
    };
    return res.status(statusCode).json(response);
};
//# sourceMappingURL=response.js.map