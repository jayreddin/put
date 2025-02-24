import { ModelService } from './ModelService.js';
import { MessageFormatter } from '../utils/MessageFormatter.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class ChatService {
    constructor() {
        this.modelService = new ModelService();
    }

    async sendMessage(message, options = {}) {
        try {
            // Destructure options with default values
            const { model = 'gpt-4o-mini', systemPrompt = null } = options;
            
            // Format the user message
            const formattedMessage = MessageFormatter.formatUserMessage(message);
            
            // Get the response from the model
            let response = await this.modelService.handleModelRequest(
                formattedMessage,
                model,
                systemPrompt
            );

            // Initialize content and reasoning content
            let content = '';
            let reasoningContent = '';

            // Check if the response is an object
            if (typeof response === 'object') {
                // Extract content and reasoning from the response
                content = response.message?.content || response.text || JSON.stringify(response);
                reasoningContent = response.message?.reasoning_content || '';
            } else {
                // If the response is a string, assign it directly to content
                content = response;
            }

            // Format the AI response for display
            const formattedContent = MessageFormatter.formatAIResponse(content, model);
            return { content: formattedContent, reasoning_content: reasoningContent };

        } catch (error) {
            console.error('ChatService Error:', error);
            // Consider using ErrorHandler for consistent error handling
            ErrorHandler.handleError(error);
            throw error; // Rethrow the error after logging
        }
    }
}