async function handleChatRequest(provider, message, model, systemPrompt) {
    try {
        const response = await puter.ai.chat(message, { model: model, systemPrompt: systemPrompt });
        return { success: true, data: response };
    } catch (error) {
        console.error(`${provider} Error with model ${model}:`, error);
        return { success: false, error: error, message: `Error with ${model}: ${error.message}` };
    }
}

export { handleChatRequest };