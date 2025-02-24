export async function togetheraiChat(message, model, systemPrompt = null) {
    try {
        // Handle different Llama models
        const response = await puter.ai.chat(message, {
            model: model, // Will be one of the Meta-Llama models
            systemPrompt: systemPrompt,
            stream: false,
            temperature: 0.7,
            max_tokens: 2048
        });

        return {
            text: response,
            model: model
        };
    } catch (error) {
        console.error("TogetherAI API Error:", error);
        throw error;
    }
}
