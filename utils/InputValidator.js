export class InputValidator {
    static validateMessage(message) {
        if (!message || typeof message !== 'string') {
            return false;
        }
        return message.trim().length > 0 && message.length <= 4000;
    }

    static validateModel(model, availableModels) {
        return availableModels.includes(model);
    }

    static validateSystemPrompt(prompt) {
        if (!prompt) return true; // Optional
        return typeof prompt === 'string' && prompt.length <= 1000;
    }

    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_');
    }

    static validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return file && validTypes.includes(file.type);
    }
}