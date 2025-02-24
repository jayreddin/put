export const modelConfig = {
    defaultSettings: {
        stream: true,
        format: 'markdown'
    },
    
    // Define model-specific configurations
    models: {
        "o1": {
            supportsSystemPrompt: true,
            defaultOptions: {
                format: 'markdown',
                stream: true,
                temperature: 0.7
            }
        },
        "o3-mini": {
            supportsSystemPrompt: true
        },
        "gpt-4o": {
            supportsSystemPrompt: true
        },
        "gpt-4o-mini": {
            supportsSystemPrompt: true
        },
        "deepseek-reasoner": {
            supportsSystemPrompt: true,
            defaultOptions: {
                temperature: 0.7,
                max_tokens: 2000
            }
        },
        "deepseek-chat": {
            supportsSystemPrompt: true
        },
        "claude-3-5-sonnet": {
            supportsSystemPrompt: true,
            defaultOptions: {
                temperature: 0.7,
                format: 'markdown'
            }
        },
        "gemini-2.0-flash": {
            supportsSystemPrompt: false
        },
        "gemini-1.5-flash": {
            supportsSystemPrompt: false
        },
        "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": {
            supportsSystemPrompt: true
        },
        "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": {
            supportsSystemPrompt: true
        },
        "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo": {
            supportsSystemPrompt: true
        }
    }
};
