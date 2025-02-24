export const APP_CONSTANTS = {
    DEFAULT_MODEL: 'gpt-4o-mini',
    STREAM_ENABLED: true,
    DEFAULT_FORMAT: 'markdown',
    MAX_HISTORY_LENGTH: 100,
    STORAGE_KEYS: {
        SETTINGS: 'chat_settings.json',
        HISTORY: 'chat_history.json'
    }
};

export const UI_CONSTANTS = {
    MODAL_IDS: {
        SETTINGS: 'settings-modal',
        HISTORY: 'history-modal',
        TOOLS: 'tools-modal',
        WEB_SEARCH: 'web-search-modal',
        DEEP_THINKING: 'deep-thinking-modal'
    },
    THEME: {
        LIGHT: 'light',
        DARK: 'dark'
    }
};

export const ERROR_MESSAGES = {
    CHAT_ERROR: 'Error processing chat request',
    MODEL_ERROR: 'Error with model',
    FILE_ERROR: 'Error handling file',
    NETWORK_ERROR: 'Network error occurred'
};
