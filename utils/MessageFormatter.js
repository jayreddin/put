export class MessageFormatter {
    static formatUserMessage(message) {
        return message.trim().replace(/\n{3,}/g, '\n\n');
    }

    static formatAIResponse(response, model) {
        // Handle different response formats
        if (typeof response === 'object') {
            response = response.message?.content?.[0]?.text || response.text || JSON.stringify(response);
        }

        let formattedResponse = response.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
            return `<pre><code class="${lang || ''}">${this.escapeHtml(code)}</code></pre>`;
        });

        // Handle inline code
        formattedResponse = formattedResponse.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Handle lists
        formattedResponse = formattedResponse.replace(/^\s*[-*+]\s+/gm, '• ');

        // Handle headers
        formattedResponse = formattedResponse.replace(/^#{1,6}\s+(.*)$/gm, (match, content) => {
            const level = match.trim().indexOf(' ');
            return `<h${level}>${content}</h${level}>`;
        });

        return formattedResponse;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static getTimestamp() {
        return new Date().toLocaleTimeString();
    }
}
