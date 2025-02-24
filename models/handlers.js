import { modelConfig } from './config.js';
import { ModelService } from '../services/ModelService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { InputValidator } from '../utils/InputValidator.js';
import puter from './puter.js';

const modelService = new ModelService();

export class ModelHandler {
    static async chat(message, model, systemPrompt = null) {
        try {
            if (!message) {
                throw new Error('Message is required');
            }

            return await modelService.handleModelRequest(message, model, systemPrompt);
        } catch (error) {
            console.error(`Error in chat for model ${model}:`, error);
            throw error;
        }
    }

    static async processResponse(response) {
        try {
            // Handle streaming response
            if (response && typeof response[Symbol.asyncIterator] === 'function') {
                return response; // Return stream directly for processing
            }
            
            // Handle regular response
            if (response?.text) {
                return response.text;
            }
            
            return "No content available.";
        } catch (error) {
            console.error("Error processing response:", error);
            throw error;
        }
    }
}

export const modelHandlers = {
    async handleRequest(message, model, systemPrompt) {
        return await modelService.handleModelRequest(message, model, systemPrompt);
    }
};

// Add this new export
export function getHandler(model) {
    return async (message, systemPrompt) => {
        return await modelHandlers.handleRequest(message, model, systemPrompt);
    };
}
