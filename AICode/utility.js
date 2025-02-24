import { modelHandlers } from '../models/handlers.js';

export async function handleChatRequest(message, model, systemPrompt = null) {
    try {
        let response = await modelHandlers.handleRequest(message, model, systemPrompt);
        
        // If it's a stream, handle it
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
            let fullResponse = '';
            for await (const part of response) {
                fullResponse += part?.text || '';
            }
            response = fullResponse;
        }

        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error(`Chat request failed for model ${model}:`, error);
        throw error; // Let the caller handle the error
    }
}