export async function anthropicChat(message, model, systemPrompt = null) {
    try {
        const response = await puter.ai.chat(message, {
            model: 'claude-3-5-sonnet',
            systemPrompt: systemPrompt,
            stream: false
        });

        return {
            message: {
                content: [{
                    text: response
                }]
            }
        };
    } catch (error) {
        console.error("Anthropic API Error:", error);
        throw error;
    }
}
