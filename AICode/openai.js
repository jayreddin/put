export async function openaiChat(messages, model, systemPrompt = null) {
    try {
        // Format for puter.ai like interface
        const options = {
            model: model,
            stream: false
        };

        if (systemPrompt && model !== 'o1-mini') {
            options.systemPrompt = systemPrompt;
        }

        const response = await puter.ai.chat(messages, options);

        // Process response based on model
        if (model === 'gpt-4o' || model === 'gpt-4o-mini') {
            return {
                index: 0,
                message: {
                    role: "assistant",
                    content: response.message.content,
                    refusal: null
                },
                finish_reason: "stop",
                logprobs: null
            };
        } else if (model === 'o3-mini' || model === 'o1-mini') {
            return {
                index: 0,
                message: {
                    role: "assistant",
                    content: response.message.content,
                    refusal: null
                },
                finish_reason: "stop"
            };
        }

        return response;
    } catch (error) {
        console.error("OpenAI API Error:", error);
        console.error("Error Details:", error); // Log the entire error object
        throw error;
    }
}
