// utils/error/httpMessages.ts

export const HTTP_MESSAGES: Record<number, string> = {
    // 2xx
    200: 'Request was successful.',
    201: 'Resource created successfully.',
    204: 'Request successful, no content to return.',

    // 4xx - client errors
    400: 'Bad request. Please check the data you sent.',
    401: 'You are not logged in. Please authenticate.',
    403: 'You do not have permission to access this.',
    404: 'The resource you are looking for does not exist.',
    405: 'This action is not allowed.',
    408: 'Request timed out. Please try again.',
    409: 'A conflict occurred. This resource may already exist.',
    410: 'This resource has been permanently removed.',
    413: 'The data you sent is too large.',
    415: 'Unsupported file or content type.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please slow down.',

    // 5xx - server errors
    500: 'Something went wrong on our end. Please try again later.',
    501: 'This feature is not implemented yet.',
    502: 'We received an invalid response from an upstream server.',
    503: 'Service is temporarily unavailable. Please try again later.',
    504: 'The server took too long to respond. Please try again.',
};