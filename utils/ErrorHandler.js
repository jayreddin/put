export class ErrorHandler {
    static handleError(error) {
        console.error('Error in chat service:', error);

        // Handle specific error types
        if (error.name === 'ModelError') {
            throw new Error(`Model error: ${error.message}`);
        }

        if (error.name === 'NetworkError') {
            throw new Error('Network error occurred. Please check your connection.');
        }

        // Generic error handling
        throw new Error(error.message || 'An unexpected error occurred');
    }

    static isModelError(error) {
        return error.name === 'ModelError';
    }

    static isNetworkError(error) {
        return error.name === 'NetworkError';
    }
}
