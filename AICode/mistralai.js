export async function mistralChat(message, model, systemPrompt = null) {
    try {
        const response = await puter.ai.chat(message, {
            model: model, // Will be one of Mistral's models
            systemPrompt: systemPrompt,
            stream: false
        });

        return {
            text: response,
            model: model
        };
    } catch (error) {
        console.error("Mistral AI API Error:", error);
        throw error;
    }
}
