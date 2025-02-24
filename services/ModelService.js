import { modelConfig } from '../models/config.js';
import { openaiChat } from '../AICode/openai.js';
import { anthropicChat } from '../AICode/anthropic.js';
import { googleChat } from '../AICode/google.js';
import { mistralChat } from '../AICode/mistralai.js';
import { togetheraiChat } from '../AICode/togetherai.js';
import { deepseekChat } from '../AICode/deepseek.js'; // Import deepseekChat

export class ModelService {
    constructor() {
        this.modelHandlers = {
            // OpenAI models
            'gpt-4o-mini': openaiChat,
            'gpt-4o': openaiChat,
            'o3-mini': openaiChat,
            'o1-mini': openaiChat,
            
            // Anthropic models
            'claude-3-5-sonnet': anthropicChat,
            
            // Meta Llama models via Together.ai
            'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': togetheraiChat,
            'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': togetheraiChat,
            'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': togetheraiChat,
            
            // Google models
            'gemini-2.0-flash': googleChat,
            'gemini-1.5-flash': googleChat,
            
            // Mistral models
            'mistral-large-latest': mistralChat,
            'pixtral-large-latest': mistralChat,
            'codestral-latest': mistralChat,
            
            // Deepseek models
            'deepseek-chat': deepseekChat, // Add deepseek-chat
            'deepseek-reasoner': deepseekChat // Add deepseek-reasoner
        };
    }

    // Get model configuration
    getModelConfig(model) {
        return modelConfig.models[model] || null;
    }

    // Check if the model supports system prompts
    supportsSystemPrompt(model) {
        const config = this.getModelConfig(model);
        return config?.supportsSystemPrompt || false;
    }

    // Get model options including defaults and specific configurations
    getModelOptions(model) {
        const config = this.getModelConfig(model);
        return {
            ...modelConfig.defaultSettings,
            ...(config?.defaultOptions || {}),
            model
        };
    }

    // Handle the model request
    async handleModelRequest(message, model, systemPrompt = null) {
        const handler = this.modelHandlers[model];
        if (!handler) {
            throw new Error(`Unsupported model: ${model}`);
        }

        try {
            const messages = [{ role: 'user', content: message }];
            return await handler(messages, model, systemPrompt);
        } catch (error) {
            console.error(`Error in model handler for ${model}:`, error);
            throw error;
        }
    }
}