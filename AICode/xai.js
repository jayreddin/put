import { handleChatRequest } from './utility.js';

async function xaiChat(message, model, systemPrompt) {
    const result = await handleChatRequest("xAI", message, model, systemPrompt);
    if (result.success) {
        return result.data;
    } else {
        return { text: result.message };
    }
}

export { xaiChat };
