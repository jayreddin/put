import { modelConfig } from './config.js';
import { ModelService } from '../services/ModelService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { InputValidator } from '../utils/InputValidator.js';
import puter from './puter.js';

const modelService = new ModelService();

export class ModelHandler {
    // Method to handle chat messages
    static async chat(message, model, systemPrompt = null) {
        try {
            if (!message) {
                throw new Error('Message is required'); // Validate message presence
            }

            // Call the model service to handle the request
            return await modelService.handleModelRequest(message, model, systemPrompt);
        } catch (error) {
            console.error(`Error in chat for model ${model}:`, error);
            throw error; // Rethrow error for further handling
        }
    }

    // Method to process the response from the AI model
    static async processResponse(response) {
        try {
            // Handle streaming response
            if (response && typeof response[Symbol.asyncIterator] === 'function') {
                return response; // Return stream directly for processing
            }
            
            // Handle regular response
            if (response?.text) {
                return response.text; // Return text content if available
            }
            
            return "No content available."; // Default message if no content
        } catch (error) {
            console.error("Error processing response:", error);
            throw error; // Rethrow error for further handling
        }
    }
}

// Model handlers for specific operations
export const modelHandlers = {
    async handleRequest(message, model, systemPrompt) {
        return await modelService.handleModelRequest(message, model, systemPrompt);
    }
};

// Function to get a specific handler for a model
export function getHandler(model) {
    return async (message, systemPrompt) => {
        return await modelHandlers.handleRequest(message, model, systemPrompt);
    };
}