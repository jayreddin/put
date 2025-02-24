import { ModelService } from './ModelService.js';
import { MessageFormatter } from '../utils/MessageFormatter.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class ChatService {
    constructor() {
        this.modelService = new ModelService();
    }

    async sendMessage(message, options = {}) {
        try {
            const { model = 'gpt-4o-mini', systemPrompt = null } = options;
            
            // Format the message
            const formattedMessage = MessageFormatter.formatUserMessage(message);
            
            // Get the response from the model
            let response = await this.modelService.handleModelRequest(
                formattedMessage,
                model,
                systemPrompt
            );

            // Ensure response is a string
            let content = '';
            let reasoningContent = '';

            if (typeof response === 'object') {
                content = response.message?.content || response.text || JSON.stringify(response);
                reasoningContent = response.message?.reasoning_content || '';
            } else {
                content = response;
            }

            // Format the response
            const formattedContent = MessageFormatter.formatAIResponse(content, model);
            return { content: formattedContent, reasoning_content: reasoningContent };

        } catch (error) {
            console.error('ChatService Error:', error);
            throw error;
        }
    }
}
