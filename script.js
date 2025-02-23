// script.js

import { handleChatRequest } from './AICode/utility.js';

const aiFiles = {
    defaultChat: async (message, model, systemPrompt) => {
        try {
            // Default configuration
            const chatOptions = {
                model,
                stream: true,
                messages: [{ role: 'user', content: message }],
                format: 'markdown' // Ensure markdown format for all default models
            };

            // Only add systemPrompt for models that support it
            if (systemPrompt && !['o1-mini'].includes(model)) { // o1-mini does not support system prompts
                chatOptions.systemPrompt = systemPrompt;
            }

            const response = await puter.ai.chat(message, chatOptions);
            return response;
        } catch (error) {
            console.error(`Error in defaultChat for model ${model}:`, error);
            throw new Error(error.error?.message || 'Failed to get response from AI model');
        }
    },

    // Model-specific handlers
    "o1-mini": async (message, model) => {
        try {
            return await puter.ai.chat(message, {
                model: 'o1-mini',
                stream: true,
                messages: [{ role: 'user', content: message }], // Removed system prompt as o1-mini doesn't support it
                format: 'markdown' // Ensure markdown format
            });
        } catch (error) {
            console.error("O1-mini error:", error);
            throw error;
        }
    },

    "deepseek-reasoner": async (message, model, systemPrompt) => {
        try {
            // Removed systemPrompt from reasoningPrompt for deepseek-reasoner, it might be causing issues
            const reasoningPrompt = `Analyze step by step and provide detailed reasoning.`;
            return await puter.ai.chat(message, {
                model: "deepseek-reasoner",
                systemPrompt: reasoningPrompt, // Keep system prompt, but simplify if needed
                stream: true,
                temperature: 0.7,
                max_tokens: 2000,
                messages: [{ role: 'user', content: message }],
                format: 'markdown' // Ensure markdown format
            });
        } catch (error) {
            console.error("Deepseek Reasoner error:", error);
            throw error;
        }
    },

    // Gemini models - Corrected to use gemini models directly
    "gemini-2.0-flash": async (message) => {
        try {
            return await puter.ai.chat(message, {
                model: 'gemini-2.0-flash',
                messages: [{ role: 'user', content: message }],
                format: 'markdown' // Ensure markdown format
            });
        } catch (error) {
            console.error("Gemini 2.0 Flash error:", error);
            throw error;
        }
    },

    "gemini-1.5-flash": async (message) => {
        try {
            return await puter.ai.chat(message, {
                model: 'gemini-1.5-flash',
                messages: [{ role: 'user', content: message }],
                format: 'markdown' // Ensure markdown format
            });
        } catch (error) {
            console.error("Gemini 1.5 Flash error:", error);
            throw error;
        }
    },

    // Meta Llama models - Adjusted systemPrompt handling, ensure systemPrompt is a string if provided
    "meta-llama": async (message, model, systemPrompt) => {
        try {
            const chatOptions = {
                model,
                stream: true,
                messages: [{ role: 'user', content: message }],
                format: 'markdown' // Ensure markdown format
            };
            if (systemPrompt) {
                chatOptions.systemPrompt = String(systemPrompt); // Ensure systemPrompt is a string
            }
            return await puter.ai.chat(message, chatOptions);
        } catch (error) {
            console.error("Meta Llama error:", error);
            throw error;
        }
    }
};

const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.querySelector('.messages-container');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.querySelector('.close-modal');
const modelSelectHeader = document.getElementById('model-select-header');
const systemPrompt = document.getElementById('system-prompt');
const customModelButton = document.getElementById('custom-model-button');
const customModelCard = document.getElementById('custom-model-card');
const applyCustomModelButton = document.getElementById('apply-custom-model-button');
const saveSettingsButton = document.getElementById('save-settings-button');
const modelNameDisplay = document.getElementById('model-name');
const customProvider = document.getElementById('custom-provider');
const customApiKey = document.getElementById('custom-api-key');
const customEndpointURL = document.getElementById('custom-endpoint-url');
const customModelName = document.getElementById('custom-model-name');
const savedModelName = document.getElementById('saved-model-name');
const newChatButton = document.getElementById('new-chat-button');
const historyButton = document.getElementById('history-button');
const historyModal = document.getElementById('history-modal');
const closeHistoryModal = document.getElementById('close-history-modal');
const historyList = document.getElementById('history-list');
const imageButton = document.getElementById('image-button');
const fileButton = document.getElementById('file-button');
const linkButton = document.getElementById('link-button');
const searchButton = document.getElementById('search-button');
const brainButton = document.getElementById('brain-button');
const toolsButton = document.getElementById('tools-button');
const toolsModal = document.getElementById('tools-modal');
const closeToolsModal = document.getElementById('close-tools-modal');
const weatherToolCheckbox = document.getElementById('weather-tool');
const img2txtToolCheckbox = document.getElementById('img2txt-tool');
const txt2imgToolCheckbox = document.getElementById('txt2img-tool');
const txt2speechToolCheckbox = document.getElementById('txt2speech-tool');
const loadingIndicator = document.getElementById('loading-indicator');

// Update document elements
const webSearchButton = document.getElementById('web-search-button');
const deepThinkingButton = document.getElementById('deep-thinking-button');
const webSearchModal = document.getElementById('web-search-modal');
const deepThinkingModal = document.getElementById('deep-thinking-modal');
const websiteUrl = document.getElementById('website-url');
const startWebSearch = document.getElementById('start-web-search');
const reasoningModelSelect = document.getElementById('reasoning-model-select');
const applyReasoning = document.getElementById('apply-reasoning');
const modals = {
    'web-search-modal': webSearchModal,
    'deep-thinking-modal': deepThinkingModal,
    'tools-modal': toolsModal
};

// Initialize variables
let currentModel = 'gpt-4o-mini';
let currentSystemPrompt = '';
let customModels = {};
let chatHistory = [];
let currentChat = null;
let enabledTools = {};
let activeReasoningModel = null;
let defaultModel = 'gpt-4o-mini';
let isReasoningActive = false;

// Modal Management Functions
function showModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

// Initialize UI and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    startNewChat();
    loadSettingsAndHistory();
});

function initializeUI() {
    themeToggle.addEventListener('click', toggleTheme);
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', handleEnterKey);

    settingsButton.addEventListener('click', () => showModal('settings-modal'));
    closeModal.addEventListener('click', closeAllModals);
    saveSettingsButton.addEventListener('click', saveSettings);
    customModelButton.addEventListener('click', toggleCustomModelCard);
    applyCustomModelButton.addEventListener('click', applyCustomModel);
    modelSelectHeader.addEventListener('change', changeModel);
    systemPrompt.addEventListener('change', changeSystemPrompt);

    historyButton.addEventListener('click', () => showModal('history-modal'));
    closeHistoryModal.addEventListener('click', closeAllModals);
    newChatButton.addEventListener('click', startNewChat);

    toolsButton.addEventListener('click', () => showModal('tools-modal'));
    closeToolsModal.addEventListener('click', closeAllModals);
    weatherToolCheckbox.addEventListener('change', toggleWeatherTool);
    img2txtToolCheckbox.addEventListener('change', toggleImg2txtTool);
    txt2imgToolCheckbox.addEventListener('change', toggleTxt2imgTool);
    txt2speechToolCheckbox.addEventListener('change', toggleTxt2speechTool);

    webSearchButton.addEventListener('click', () => showModal('web-search-modal'));
    startWebSearch.addEventListener('click', startWebsiteAnalysis);

    deepThinkingButton.addEventListener('click', toggleReasoningModal);
    applyReasoning?.addEventListener('click', applyReasoningModel);

    imageButton?.addEventListener('click', handleImageUpload);
    fileButton?.addEventListener('click', handleFileUpload);
    linkButton?.addEventListener('click', handleLinkInput);
    searchButton?.addEventListener('click', handleSearchQuery);
    brainButton?.addEventListener('click', handleBrainButton);

    window.addEventListener('click', clickOutsideModal);
}

// --- UI Event Handlers ---
function toggleTheme() {
    body.classList.toggle('dark-mode');
    themeToggle.innerHTML = body.classList.contains('dark-mode') ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        handleChatMessage(message);
        chatInput.value = '';
    }
}

function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function saveSettings() {
    currentModel = modelSelectHeader.value;
    currentSystemPrompt = systemPrompt.value;
    modelNameDisplay.textContent = currentModel;
    saveSettingsAndHistory();
    closeAllModals();
}

function toggleCustomModelCard() {
    customModelCard.style.display = customModelCard.style.display === "none" ? "block" : "none";
}

function applyCustomModel() {
    const provider = customProvider.value;
    const apiKey = customApiKey.value;
    const endpointURL = customEndpointURL.value;
    const modelName = customModelName.value;
    const savedName = savedModelName.value;

    if (provider && apiKey && endpointURL && modelName && savedName) {
        customModels[provider] = {
            customProvider: provider,
            customApiKey: apiKey,
            customEndpointURL: endpointURL,
            customModelName: modelName,
            savedModelName: savedName
        };

        const option = document.createElement("option");
        option.value = provider;
        option.textContent = savedName;
        modelSelectHeader.appendChild(option);
        modelSelectHeader.value = provider;
        currentModel = provider;
        modelNameDisplay.textContent = currentModel;

        saveSettingsAndHistory();
        customModelCard.style.display = 'none';
    } else {
        alert("Please fill all Custom Model fields");
    }
}

function changeModel() {
    const newModel = modelSelectHeader.value;
    defaultModel = newModel;
    if (!isReasoningActive) {
        currentModel = newModel;
    }
    modelNameDisplay.textContent = currentModel;
}

function changeSystemPrompt() {
    currentSystemPrompt = systemPrompt.value;
}

function toggleWeatherTool() {
    enabledTools.weather = weatherToolCheckbox.checked;
    saveSettingsAndHistory();
}

function toggleImg2txtTool() {
    enabledTools.img2txt = img2txtToolCheckbox.checked;
    saveSettingsAndHistory();
}

function toggleTxt2imgTool() {
    enabledTools.txt2img = txt2imgToolCheckbox.checked;
    saveSettingsAndHistory();
}

function toggleTxt2speechTool() {
    enabledTools.txt2speech = txt2speechToolCheckbox.checked;
    saveSettingsAndHistory();
}

function startWebsiteAnalysis() {
    const url = websiteUrl.value.trim();
    if (url) {
        closeAllModals();
        handleChatMessage(`Analyzing website: ${url}`);
        websiteUrl.value = '';
    }
}

function toggleReasoningModal() {
    showModal('deep-thinking-modal');
}

function applyReasoningModel() {
    const message = chatInput.value.trim();
    if (message) {
        const selectedModel = reasoningModelSelect.value;
        closeAllModals();
        const originalModel = currentModel;
        currentModel = selectedModel;
        handleChatMessage(message).then(() => {
            currentModel = originalModel;
            chatInput.value = '';
        });
    } else {
        alert("Please enter a message first");
    }
}

function saveReasoningSettings() {
    activeReasoningModel = reasoningModelSelect.value;
    isReasoningActive = true;
    closeAllModals();
}

function handleImageUpload() {
    puter.ui.showOpenFilePicker({
        accept: 'image/*',
        multiple: false
    }).then(file => {
        if (file) {
            file.read().then(blob => {
                const imageUrl = URL.createObjectURL(blob);
                handleChatMessage(`Analyzing image...`, imageUrl);
            });
        }
    }).catch(error => {
        console.error("Error handling image:", error);
        alert(`Error handling image: ${error.message}`);
    });
}

function handleFileUpload() {
    puter.ui.showOpenFilePicker({
        accept: '.txt,.doc,.docx,.pdf',
        multiple: false
    }).then(file => {
        if (file) {
            file.read().then(blob => {
                blob.text().then(content => {
                    handleChatMessage(`Analyzing document: ${file.name}\n\nContent:\n${content}`);
                });
            });
        }
    }).catch(error) => {
        console.error("Error handling file:", error);
        alert(`Error handling file: ${error.message}`);
    });
}

function handleLinkInput() {
    const link = window.prompt("Enter a website link:");
    if (link) {
        handleChatMessage(`Link: ${link}`);
    }
}

function handleSearchQuery() {
    const query = window.prompt("Enter your search query:", "");
    if (query && typeof query === 'string' && query.trim()) {
        handleChatMessage(`Search the web for: ${query.trim()}`);
    }
}

function handleBrainButton() {
    const message = chatInput.value.trim();
    if (message) {
        const aiFunction = aiFiles[currentModel];
        if (typeof aiFunction !== 'function') {
            throw new Error(`Model "${currentModel}" is not a valid function.`);
        }
        aiFunction(message, currentModel, currentSystemPrompt).then(response => {
            let aiResponse = "";
            if (response && typeof response[Symbol.asyncIterator] === 'function') {
                for (const part of response) {
                    const textChunk = part?.text || '';
                    aiResponse += textChunk;
                    updateLastAIMessage(aiResponse);
                }
            } else {
                aiResponse = response?.message?.content?.[0]?.text || response?.text || "No content available.";
                appendMessage('ai', aiResponse);
            }
        }).catch(error => {
            console.error("Error during processing:", error);
            appendMessage('ai', `Error using ${currentModel}: ${error.message || error}`);
        });
    }
}

function clickOutsideModal(event) {
    if (Object.values(modals).some(modal => event.target === modal)) {
        closeAllModals();
    }
}

// Function to load settings and history
async function loadSettingsAndHistory() {
    try {
        loadingIndicator.style.display = 'block';
        const blob = await puter.fs.read("chat_settings.json");
        const settings = JSON.parse(await blob.text());
        currentModel = settings.currentModel || 'gpt-4o-mini';
        currentSystemPrompt = settings.currentSystemPrompt || '';
        customModels = settings.customModels || {};
        chatHistory = settings.chatHistory || [];
        enabledTools = settings.enabledTools || {};
        modelNameDisplay.textContent = currentModel;
        modelSelectHeader.value = currentModel;
        systemPrompt.value = currentSystemPrompt;
        weatherToolCheckbox.checked = enabledTools.weather === true;
        img2txtToolCheckbox.checked = enabledTools.img2txt === true;
        txt2imgToolCheckbox.checked = enabledTools.txt2img === true;
        txt2speechToolCheckbox.checked = enabledTools.txt2speech === true;

        Object.values(customModels).forEach(model => {
            const option = document.createElement("option");
            option.value = model.customProvider;
            option.textContent = model.savedModelName;
            modelSelectHeader.appendChild(option);
        });

        loadChat();
    } catch (error) {
        console.log("No settings file found or error loading settings, using defaults:", error);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

//Function to save settings and history
async function saveSettingsAndHistory() {
    const settings = {
        currentModel,
        currentSystemPrompt,
        customModels,
        chatHistory,
        enabledTools
    };
    try {
        await puter.fs.write("chat_settings.json", JSON.stringify(settings));
    } catch (error) {
        console.error("Error saving settings", error);
    }
}

function getTimestamp() {
    const now = new Date();
    return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
}

function appendMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    const timestamp = getTimestamp();
    const prefix = sender === 'user' ? 'You: ' : 'AI: ';
    messageDiv.innerHTML = `<span class="message-timestamp">${timestamp}</span> <span class="message-prefix">${prefix}</span>${message.replace(/\n/g, '<br>')}`;

    // Insert at the beginning to show newest first
    if (messagesContainer.firstChild) {
        messagesContainer.insertBefore(messageDiv, messagesContainer.firstChild);
    } else {
        messagesContainer.appendChild(messageDiv);
    }
    return messageDiv;
}

//Helper function to update the content of last AI message.
function updateLastAIMessage(newContent) {
    const aiMessages = messagesContainer.querySelectorAll('.ai-message');
    if (aiMessages.length > 0) {
        const lastAIMessage = aiMessages[0];
        const timestamp = lastAIMessage.querySelector('.message-timestamp').textContent;
        lastAIMessage.innerHTML = `<span class="message-timestamp">${timestamp}</span> <span class="message-prefix">AI: </span>${newContent.replace(/\n/g, '<br>')}`;
    } else {
        appendMessage('ai', newContent);
    }
}

// Convert text to basic Markdown (for Codestral) - No changes needed as current implementation handles basic markdown like bold, italics, lists and newlines.
function convertToMarkdown(text) {
    let markdownText = text.replace(/\n/g, '<br>'); // Newlines to <br>
    markdownText = markdownText.replace(/^\s*(\d+\.|\*|-)\s+/gm, (match) => {  // Lists
        return `<br>${match}`;
    });
    markdownText = markdownText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    markdownText = markdownText.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italics
    return markdownText;
}

// --- Main Message Handling ---
async function handleChatMessage(message, imageUrl = null) {
    const timestamp = getTimestamp();

    // Create a new message group for this exchange
    const messageGroup = document.createElement('div');
    messageGroup.classList.add('message-group');

    // Create user message
    const userDiv = document.createElement('div');
    userDiv.classList.add('message', 'user-message');
    userDiv.innerHTML = `<span class="message-timestamp">${timestamp}</span> <span class="message-prefix">You: </span>${message.replace(/\n/g, '<br>')}`;

    // Create AI message placeholder
    const aiDiv = document.createElement('div');
    aiDiv.classList.add('message', 'ai-message');

    // Add messages to group
    messageGroup.appendChild(userDiv);
    messageGroup.appendChild(aiDiv);

    // Insert at the beginning of messages container
    messagesContainer.insertBefore(messageGroup, messagesContainer.firstChild);

    if (!currentChat) {
        startNewChat();
    }

    currentChat.messages.push({
        role: 'user',
        content: message,
        timestamp: timestamp
    });

    try {
        showLoading();
        let response;

        // Model-specific handling
        switch (currentModel) {
            case 'o1-mini':
                response = await aiFiles['o1-mini'](message);
                break;
            case 'deepseek-reasoner':
                response = await aiFiles['deepseek-reasoner'](message, currentModel, currentSystemPrompt);
                break;
            case 'gemini-2.0-flash':
            case 'gemini-1.5-flash':
                response = await aiFiles[currentModel](message);
                break;
            case 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo':
            case 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo':
            case 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo':
                response = await aiFiles['meta-llama'](message, currentModel, currentSystemPrompt);
                break;
            default:
                response = await aiFiles.defaultChat(message, currentModel, currentSystemPrompt);
        }

        let aiResponse = await processAIResponse(response, aiDiv);
        aiResponse = formatModelResponse(aiResponse, currentModel);
        updateAIDivContent(aiDiv, getTimestamp(), aiResponse);

        currentChat.messages.push({
            role: 'ai',
            content: aiResponse,
            timestamp: getTimestamp()
        });

        saveSettingsAndHistory(); // Save after processing

    } catch (error) {
        console.error("Full error object:", error);
        const errorTimestamp = getTimestamp();
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        aiDiv.innerHTML = `
            <span class="message-timestamp">${errorTimestamp}</span>
            <span class="message-prefix">AI: </span>
            <span class="error-message">Error: ${errorMessage}</span>
        `;

        if (currentChat) {
            currentChat.messages.push({
                role: 'error',
                content: `Error: ${errorMessage}`,
                timestamp: errorTimestamp
            });
        }
        saveSettingsAndHistory();
    } finally {
        hideLoading();
    }
}

// --- Custom Model Handling ---
async function handleCustomModel(message, model) {
    try {
        const response = await fetch(model.customEndpointURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${model.customApiKey}`
            },
            body: JSON.stringify({
                model: model.customModelName,
                messages: [{ role: "user", content: message }],
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { message: { content: [{ text: data.choices[0].message.content }] } }; //Consistent response


    } catch (error) {
        console.error("Failed to get response from Custom Endpoint", error);
        return { text: "Failed to get response from Custom Endpoint: " + error.message }
    }
}

// --- UI Event Listeners ---

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    themeToggle.innerHTML = body.classList.contains('dark-mode') ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});

sendButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        handleChatMessage(message);
        chatInput.value = '';
    }
});

chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            handleChatMessage(message);
            chatInput.value = '';
        }
    }
});

settingsButton.addEventListener('click', () => {
    settingsModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

modelSelectHeader.addEventListener('change', () => {
    currentModel = modelSelectHeader.value;
    modelNameDisplay.textContent = currentModel;
    console.log('Selected AI Model:', currentModel);
});

systemPrompt.addEventListener('change', () => {
    currentSystemPrompt = systemPrompt.value;
    console.log('Set System Prompt', currentSystemPrompt)
});

customModelButton.addEventListener('click', () => {
    customModelCard.style.display = customModelCard.style.display === "none" ? "block" : "none";
});

applyCustomModelButton.addEventListener("click", () => {
    const provider = customProvider.value;
    const apiKey = customApiKey.value;
    const endpointURL = customEndpointURL.value;
    const modelName = customModelName.value;
    const savedName = savedModelName.value;

    if (provider && apiKey && endpointURL && modelName && savedName) {
        customModels[provider] = {
            customProvider: provider,
            customApiKey: apiKey,
            customEndpointURL: endpointURL,
            customModelName: modelName,
            savedModelName: savedName
        }

        const option = document.createElement("option");
        option.value = provider;
        option.textContent = savedName;
        modelSelectHeader.appendChild(option);
        modelSelectHeader.value = provider;
        currentModel = provider;
        modelNameDisplay.textContent = currentModel;

        saveSettingsAndHistory();
        customModelCard.style.display = 'none';

    } else {
        alert("Please fill all Custom Model fields");
    }
});


saveSettingsButton.addEventListener("click", () => {
    currentModel = modelSelectHeader.value;
    currentSystemPrompt = systemPrompt.value;
    modelNameDisplay.textContent = currentModel;
    saveSettingsAndHistory();
    settingsModal.style.display = 'none';
});


newChatButton.addEventListener('click', startNewChat);

function startNewChat() {
    currentChat = { id: Date.now(), messages: [] };
    chatHistory.push(currentChat);
    messagesContainer.innerHTML = '';
    saveSettingsAndHistory();
}

historyButton.addEventListener('click', () => {
    historyModal.style.display = 'block';
    renderHistoryList();
});

closeHistoryModal.addEventListener('click', () => {
    historyModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

function renderHistoryList() {
    historyList.innerHTML = '';
    chatHistory.sort((a, b) => b.id - a.id);

    chatHistory.forEach(chat => {
        const chatTitle = chat.messages[0]?.content?.substring(0, 20) || 'New Chat';
        const item = document.createElement('div');
        item.textContent = `${chatTitle}...`;
        item.classList.add("history-item")
        item.addEventListener('click', () => {
            loadChat(chat.id);
            historyModal.style.display = 'none';
        });
        historyList.appendChild(item);
    });
}

function loadChat(chatId = null) {
    messagesContainer.innerHTML = '';
    if (chatId) {
        currentChat = chatHistory.find(chat => chat.id === chatId);
    } else if (chatHistory.length > 0) {
        currentChat = chatHistory[chatHistory.length - 1];
    } else {
        currentChat = null;
    }

    if (currentChat) {
        // Group messages by pairs and display in reverse order
        const messages = [...currentChat.messages].reverse();

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const messageGroup = document.createElement('div');
            messageGroup.classList.add('message-group');

            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', `${msg.role}-message`);
            messageDiv.innerHTML = `<span class="message-timestamp">${msg.timestamp || getTimestamp()}</span> <span class="message-prefix">${msg.role === 'user' ? 'You: ' : 'AI: '}</span>${msg.content.replace(/\n/g, '<br>')}`;
            messageGroup.appendChild(messageDiv);

            messagesContainer.appendChild(messageGroup);
        }
    }
}


imageButton.addEventListener('click', async () => {
    try {
        const file = await puter.ui.showOpenFilePicker({
            accept: 'image/*',
            multiple: false
        });
        if (file) {
            const blob = await file.read();
            const imageUrl = URL.createObjectURL(blob);
            // Send image to AI for analysis
            handleChatMessage(`Analyzing image...`, imageUrl);
        }
    } catch (error) {
        console.error("Error handling image:", error);
        alert(`Error handling image: ${error.message}`);
    }
});


fileButton.addEventListener('click', async () => {
    try {
        const file = await puter.ui.showOpenFilePicker({
            accept: '.txt,.doc,.docx,.pdf',
            multiple: false
        });
        if (file) {
            const blob = await file.read();
            const content = await blob.text();
            handleChatMessage(`Analyzing document: ${file.name}\n\nContent:\n${content}`);
        }
    } catch (error) {
        console.error("Error handling file:", error);
        alert(`Error handling file: ${error.message}`);
    }
});


if (linkButton) {
    linkButton.addEventListener('click', async () => {
        try {
            const link = window.prompt("Enter a website link:");
            if (link) {
                handleChatMessage(`Link: ${link}`);
            }
        } catch (error) {
            console.error("Error getting or displaying link:", error);
            alert(`Error getting or displaying link: ${error.message}`);
        }
    });
}

if (searchButton) {
    searchButton.addEventListener('click', () => {
        try {
            const query = window.prompt("Enter your search query:", "");

            if (query && typeof query === 'string' && query.trim()) {
                handleChatMessage(`Search the web for: ${query.trim()}`);
            }
        } catch (error) {
            console.error("Error during web search:", error);
            alert(`Error during web search: ${error.message}`);
        }
    });
}

if (brainButton) {
    brainButton.addEventListener('click', async () => {
        try {
            const message = chatInput.value.trim();
            if (message) {
                // Use the currently selected model
                const aiFunction = aiFiles[currentModel];
                if (typeof aiFunction !== 'function') {
                    throw new Error(`Model "${currentModel}" is not a valid function.`);
                }
                const response = await aiFunction(message, currentModel, currentSystemPrompt);
                let aiResponse = "";

                if (response && typeof response[Symbol.asyncIterator] === 'function') {
                    // Handle streaming response
                    for await (const part of response) {
                        const textChunk = part?.text || '';
                        aiResponse += textChunk;
                        updateLastAIMessage(aiResponse); // Update for streaming
                    }
                } else {
                    // Handle non-streaming response
                    aiResponse = response?.message?.content?.[0]?.text || response?.text || "No content available.";
                    appendMessage('ai', aiResponse); // Show complete response
                }
            }
        } catch (error) {
            console.error("Error during processing:", error);
            appendMessage('ai', `Error using ${currentModel}: ${error.message || error}`);
        }
    });
}


toolsButton.addEventListener('click', () => showModal('tools-modal'));

closeToolsModal.addEventListener('click', () => {
    toolsModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === toolsModal) {
        toolsModal.style.display = 'none';
    }
});

weatherToolCheckbox.addEventListener('change', () => {
    enabledTools.weather = weatherToolCheckbox.checked;
    saveSettingsAndHistory();
});

img2txtToolCheckbox.addEventListener('change', () => {
    enabledTools.img2txt = img2txtToolCheckbox.checked;
    saveSettingsAndHistory();
});

txt2imgToolCheckbox.addEventListener('change', () => {
    enabledTools.txt2img = txt2imgToolCheckbox.checked;
    saveSettingsAndHistory();
});

txt2speechToolCheckbox.addEventListener('change', () => {
    enabledTools.txt2speech = txt2speechToolCheckbox.checked;
    saveSettingsAndHistory();
});

webSearchButton.addEventListener('click', () => showModal('web-search-modal'));

startWebSearch.addEventListener('click', async () => {
    const url = websiteUrl.value.trim();
    if (url) {
        closeAllModals();
        handleChatMessage(`Analyzing website: ${url}`);
        websiteUrl.value = ''; // Clear input
    }
});

deepThinkingButton.addEventListener('click', () => showModal('deep-thinking-modal'));

// Close modals
document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', closeAllModals);
});

window.addEventListener('click', (event) => {
    if (Object.values(modals).some(modal => event.target === modal)) {
        closeAllModals();
    }
});

document.addEventListener('DOMContentLoaded', loadSettingsAndHistory);

// Update loading indicator display
function showLoading() {
    const loader = document.getElementById('loading-indicator');
    loader.classList.remove('hidden');
}

function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    loader.classList.add('hidden');
}

// Remove old event listeners
const oldButtons = ['searchButton', 'brainButton', 'linkButton'];
oldButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    }
});

// Tool buttons event listeners
imageButton?.addEventListener('click', async () => {
    try {
        const file = await puter.ui.showOpenFilePicker({
            accept: 'image/*',
            multiple: false
        });
        if (file) {
            const blob = await file.read();
            const imageUrl = URL.createObjectURL(blob);
            handleChatMessage(`Analyzing image...`, imageUrl);
        }
    } catch (error) {
        console.error("Error handling image:", error);
        alert(`Error handling image: ${error.message}`);
    }
});

fileButton?.addEventListener('click', async () => {
    try {
        const file = await puter.ui.showOpenFilePicker({
            accept: '.txt,.doc,.docx,.pdf',
            multiple: false
        });
        if (file) {
            const blob = await file.read();
            const content = await blob.text();
            handleChatMessage(`Analyzing document: ${file.name}\n\nContent:\n${content}`);
        }
    } catch (error) {
        console.error("Error handling file:", error);
        alert(`Error handling file: ${error.message}`);
    }
});

webSearchButton?.addEventListener('click', () => {
    webSearchModal.style.display = 'block';
});

deepThinkingButton?.addEventListener('click', () => {
    deepThinkingModal.style.display = 'block';
});

toolsButton?.addEventListener('click', () => {
    toolsModal.style.display = 'block';
});

// Modal form submissions
startWebSearch?.addEventListener('click', async () => {
    const url = websiteUrl.value.trim();
    if (url) {
        closeAllModals();
        handleChatMessage(`Analyzing website: ${url}`);
        websiteUrl.value = '';
    }
});

applyReasoning?.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (message) {
        const selectedModel = reasoningModelSelect.value;
        closeAllModals();
        const originalModel = currentModel;
        currentModel = selectedModel;
        await handleChatMessage(message);
        currentModel = originalModel;
        chatInput.value = '';
    } else {
        alert("Please enter a message first");
    }
});