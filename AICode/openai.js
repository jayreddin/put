async function openaiChat(message, model, systemPrompt, imageUrl = null) {
    try {
        if (imageUrl) {
            const response = await puter.ai.chat(message, imageUrl, { model: model, systemPrompt: systemPrompt });
            return response;
        } else {
            const response = await puter.ai.chat(message, { model: model, systemPrompt: systemPrompt });
            return response;
        }
    } catch (error) {
        console.error(`OpenAI Error with model ${model}:`, error);
        return { text: `Error with ${model}: ${error.message}` };
    }
}
