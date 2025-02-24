export async function googleChat(message, model, systemPrompt = null) {
    try {
        const response = await puter.ai.chat(message, {
            model: model, // 'gemini-2.0-flash' or 'gemini-1.5-flash'
            systemPrompt: systemPrompt,
            stream: false
        });

        return {
            text: response,
            model: model
        };
    } catch (error) {
        console.error("Google AI API Error:", error);
        throw error;
    }
}
