async function deepseekChat(messages, model, systemPrompt) {
    try {
        const response = await puter.ai.chat(messages, { 
            model: model, 
            stream: true, 
            systemPrompt: systemPrompt 
        });

        let content = "";
        let reasoningContent = "";
        let isReasoning = false;
        let reasoningBuffer = "";
        let fullResponse = { content: "", reasoning_content: "" };

        // Add reasoning trigger phrases
        const reasoningTriggers = [
            "Let me think",
            "I should",
            "First,",
            "Let's analyze",
            "Let me break this down",
            "I need to consider",
            "To answer this",
            "Let me explain",
            "Here's my thought process"
        ];

        for await (const part of response) {
            console.log('deepseekChat part:', part);
            
            if (part?.text) {
                reasoningBuffer += part.text;

                // Check if we've entered reasoning mode
                if (!isReasoning) {
                    for (const trigger of reasoningTriggers) {
                        if (reasoningBuffer.includes(trigger)) {
                            isReasoning = true;
                            reasoningContent = reasoningBuffer;
                            reasoningBuffer = "";
                            
                            // Emit reasoning update event
                            const event = new CustomEvent('reasoningUpdate', {
                                detail: { reasoning: reasoningContent }
                            });
                            window.dispatchEvent(event);
                            break;
                        }
                    }

                    if (!isReasoning) {
                        content += part.text;
                        fullResponse.content = content;
                    }
                } else {
                    // We're in reasoning mode
                    reasoningContent += part.text;
                    fullResponse.reasoning_content = reasoningContent;
                    
                    // Emit reasoning update event
                    const event = new CustomEvent('reasoningUpdate', {
                        detail: { reasoning: reasoningContent }
                    });
                    window.dispatchEvent(event);

                    // Check if we should exit reasoning mode
                    if (part.text.includes(".") || part.text.includes("\n")) {
                        const nextParts = reasoningContent.split(/[.\n]/);
                        if (nextParts.length > 1) {
                            // End reasoning mode if we detect a conclusion
                            const lastPart = nextParts[nextParts.length - 1].toLowerCase();
                            if (lastPart.includes("therefore") || 
                                lastPart.includes("so,") || 
                                lastPart.includes("in conclusion") ||
                                lastPart.includes("finally,")) {
                                isReasoning = false;
                                content += part.text;
                            }
                        }
                    }
                }
            }
        }

        console.log('deepseekChat fullResponse:', fullResponse);
        return { message: fullResponse };
    } catch (error) {
        console.error(`DeepSeek Error with model ${model}:`, error);
        return { 
            message: { 
                content: `Error with ${model}: ${error.message}`,
                reasoning_content: reasoningContent 
            } 
        };
    }
}

export { deepseekChat };