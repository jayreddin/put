async function togetheraiChat(message, model, systemPrompt) {
    try {
        const response = await puter.ai.chat(message, { model: model, stream: true, systemPrompt: systemPrompt });
        let fullResponse = "";
        for await (const part of response) {
            fullResponse += part?.text || "";
        }
        return { message: { content: [{ text: fullResponse }] } };
    } catch (error) {
        console.error(`TogetherAI Error with model ${model}:`, error);
        return { text: `Error with ${model}: ${error.message}` };
    }
}

export { togetheraiChat };
