// script.js

import { ChatService } from './services/ChatService.js';
import { APP_CONSTANTS, UI_CONSTANTS, ERROR_MESSAGES } from './config/constants.js';
import { ModelService } from './services/ModelService.js';
import { InputValidator } from './utils/InputValidator.js';

const chatService = new ChatService();
const modelService = new ModelService();
let currentChat = null;

// Initialize variables
let currentModel = APP_CONSTANTS.DEFAULT_MODEL;
let currentSystemPrompt = '';
let customModels = {};
let chatHistory = [];
let enabledTools = {};
let activeReasoningModel = null;
let isReasoningActive = false;
let currentReasoningDiv = null;

// Helper Functions
function getTimestamp() {
    return new Date().toLocaleTimeString();
}

function convertToMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

const progressBarContainer = document.getElementById('progress-bar-container');
const progressBar = document.getElementById('progress-bar');

function showLoading() {
    progressBarContainer.style.visibility = 'visible';
    progressBar.style.width = '0%';
}

function hideLoading() {
    progressBarContainer.style.visibility = 'hidden';
    progressBar.style.width = '100%';
}

function updateProgressBar(progress) {
    progressBar.style.width = `${progress}%`;
}

// Storage Functions
function loadSettingsAndHistory() {
    try {
        // Load settings
        const savedSettings = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.SETTINGS);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            currentModel = settings.model || APP_CONSTANTS.DEFAULT_MODEL;
            currentSystemPrompt = settings.systemPrompt || '';
            enabledTools = settings.enabledTools || {};
            customModels = settings.customModels || {};
            
            // Update UI
            modelSelectHeader.value = currentModel;
            modelNameDisplay.textContent = currentModel;
            systemPrompt.value = currentSystemPrompt;
            
            // Update tool checkboxes
            weatherToolCheckbox.checked = enabledTools.weather || false;
            img2txtToolCheckbox.checked = enabledTools.img2txt || false;
            txt2imgToolCheckbox.checked = enabledTools.txt2img || false;
            txt2speechToolCheckbox.checked = enabledTools.txt2speech || false;
        }

        // Load chat history
        const savedHistory = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.HISTORY);
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            if (chatHistory.length > 0) {
                currentChat = chatHistory[chatHistory.length - 1];
                loadChat();
            } else {
                startNewChat();
            }
        } else {
            startNewChat();
        }
    } catch (error) {
        console.error('Error loading settings and history:', error);
        startNewChat();
    }
}

function saveSettingsAndHistory() {
    try {
        // Save settings
        const settings = {
            model: currentModel,
            systemPrompt: currentSystemPrompt,
            enabledTools,
            customModels
        };
        localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

        // Save chat history
        localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.HISTORY, JSON.stringify(chatHistory));
    } catch (error) {
        console.error('Error saving settings and history:', error);
    }
}

// Add missing helper functions
async function processAIResponse(response, aiDiv) {
    let aiResponse = '';
    const timestamp = getTimestamp();
    
    try {
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
            for await (const part of response) {
                const textChunk = part?.text || '';
                aiResponse += textChunk;
                aiDiv.innerHTML = `
                    <span class="message-timestamp">${timestamp}</span>
                    <span class="message-prefix">AI: </span>
                    ${convertToMarkdown(aiResponse)}
                `;
            }
        } else if (typeof response === 'string') {
            aiResponse = response;
        } else {
            aiResponse = response?.text || response?.message?.content || "No content available.";
        }
        return aiResponse;
    } catch (error) {
        console.error("Error processing AI response:", error);
        throw error;
    }
}

function formatModelResponse(text, model) {
    let formattedText = convertToMarkdown(text);
    if (model === 'deepseek-reasoner') {
        formattedText = formattedText.replace(
            /Thought (process)?:(.*?)(?:\n|$)/g,
            '<span style="color: grey;">Thought $1:$2</span>'
        );
    }
    return formattedText;
}

function updateAIDivContent(aiDiv, timestamp, content) {
    aiDiv.innerHTML = `
        <span class="message-timestamp">${timestamp}</span>
        <span class="message-prefix">AI: </span>
        ${content}
    `;
}

// Update aiFiles object
const aiFiles = {
    defaultChat: async (message, model, systemPrompt) => {
        try {
            const handler = getHandler(model);
            const response = await handler(message, systemPrompt);
            if (!response) {
                throw new Error('No response from AI model');
            }
            return response;
        } catch (error) {
            console.error(`Error in defaultChat for model ${model}:`, error);
            throw error; // Pass the error up for proper handling
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

    settingsButton.addEventListener('click', () => showModal(UI_CONSTANTS.MODAL_IDS.SETTINGS));
    closeModal.addEventListener('click', closeAllModals);
    saveSettingsButton.addEventListener('click', saveSettings);
    customModelButton.addEventListener('click', toggleCustomModelCard);
    applyCustomModelButton.addEventListener('click', applyCustomModel);
    modelSelectHeader.addEventListener('change', changeModel);
    systemPrompt.addEventListener('change', changeSystemPrompt);

    historyButton.addEventListener('click', () => showModal(UI_CONSTANTS.MODAL_IDS.HISTORY));
    closeHistoryModal.addEventListener('click', closeAllModals);
    newChatButton.addEventListener('click', startNewChat);

    toolsButton.addEventListener('click', () => showModal(UI_CONSTANTS.MODAL_IDS.TOOLS));
    closeToolsModal.addEventListener('click', closeAllModals);
    weatherToolCheckbox.addEventListener('change', toggleWeatherTool);
    img2txtToolCheckbox.addEventListener('change', toggleImg2txtTool);
    txt2imgToolCheckbox.addEventListener('change', toggleTxt2imgTool);
    txt2speechToolCheckbox.addEventListener('change', toggleTxt2speechTool);

    webSearchButton.addEventListener('click', () => showModal(UI_CONSTANTS.MODAL_IDS.WEB_SEARCH));
    startWebSearch.addEventListener('click', startWebsiteAnalysis);

    deepThinkingButton.addEventListener('click', toggleReasoningModal);
    applyReasoning?.addEventListener('click', applyReasoningModel);

    imageButton?.addEventListener('click', handleImageUpload);
    fileButton?.addEventListener('click', handleFileUpload);
    linkButton?.addEventListener('click', handleLinkInput);
    searchButton?.addEventListener('click', handleSearchQuery);
    brainButton?.addEventListener('click', handleBrainButton);

    window.addEventListener('click', clickOutsideModal);

    // Add the processAIResponse function to the global scope
    window.processAIResponse = processAIResponse;
    window.formatModelResponse = formatModelResponse;
    window.updateAIDivContent = updateAIDivContent;
}

function clickOutsideModal(event) {
    if (Object.values(modals).some(modal => event.target === modal)) {
        closeAllModals();
    }
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
    showModal(UI_CONSTANTS.MODAL_IDS.DEEP_THINKING);
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
    }).catch(error => {
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

async function handleChatMessage(message, imageUrl = null) {
    const timestamp = getTimestamp();
    
    // Create message containers
    const messageGroup = document.createElement('div');
    messageGroup.classList.add('message-group');

    // Create reasoning div
    const reasoningDiv = document.createElement('div');
    reasoningDiv.classList.add('thought-process');
    reasoningDiv.style.display = 'none';
    currentReasoningDiv = reasoningDiv; // Store reference to current reasoning div
    
    // Create AI message div
    const aiDiv = document.createElement('div');
    aiDiv.classList.add('message', 'ai-message');
    aiDiv.appendChild(reasoningDiv);

    // Create message content div
    const messageContentDiv = document.createElement('div');
    messageContentDiv.classList.add('message-content');
    aiDiv.appendChild(messageContentDiv);
    
    // Create user message div
    const userDiv = document.createElement('div');
    userDiv.classList.add('message', 'user-message');
    userDiv.innerHTML = `
        <div class="message-content">
            <span class="message-timestamp">${timestamp}</span>
            <span class="message-prefix">You: </span>
            ${message.replace(/\n/g, '<br>')}
        </div>
    `;
    messageGroup.appendChild(userDiv);

    messageGroup.appendChild(aiDiv);

    // Insert at the beginning of messages container
    messagesContainer.insertBefore(messageGroup, messagesContainer.firstChild);

    let progressInterval; // Declare progressInterval outside the try block

    try {
        if (!InputValidator.validateMessage(message)) {
            throw new Error('Invalid message format');
        }

        showLoading();
        // Simulate progress
        let progress = 0;
        progressInterval = setInterval(() => {
            progress += 10;
            updateProgressBar(progress);
            if (progress >= 90) {
                clearInterval(progressInterval);
            }
        }, 100);

        const response = await chatService.sendMessage(message, {
            model: currentModel,
            systemPrompt: currentSystemPrompt
        });

        clearInterval(progressInterval);
        hideLoading();

        // Update AI response
        const aiContent = response.content;
        const reasoningContent = response.reasoning_content;

        messageContentDiv.innerHTML = `
            <span class="message-timestamp">${getTimestamp()}</span>
            <span class="message-prefix">AI: </span> 
            ${aiContent}
        `;

        // Update reasoning content
        reasoningDiv.textContent = reasoningContent;
        reasoningDiv.style.display = 'none'; // Hide reasoning div after response

        // Save to chat history
        if (!currentChat) {
            startNewChat();
        }
        currentChat.messages.push(
            { role: 'user', content: message, timestamp },
            { role: 'ai', content: aiContent, reasoning_content: reasoningContent, timestamp: getTimestamp() }
        );
        saveSettingsAndHistory();

        // After response is complete, minimize reasoning
        if (reasoningDiv.textContent) {
            const toggleButton = document.createElement('button');
            toggleButton.textContent = 'Show reasoning';
            toggleButton.classList.add('toggle-reasoning');
            toggleButton.onclick = () => {
                const isHidden = reasoningDiv.style.display === 'none';
                reasoningDiv.style.display = isHidden ? 'block' : 'none';
                toggleButton.textContent = isHidden ? 'Hide reasoning' : 'Show reasoning';
            };
            reasoningDiv.style.display = 'none';
            aiDiv.insertBefore(toggleButton, messageContentDiv);
        }

    } catch (error) {
        console.error("Error:", error);
        messageContentDiv.innerHTML = `
            <span class="message-timestamp">${getTimestamp()}</span>
            <span class="message-prefix">AI: </span>
            Error: ${error.message || 'An error occurred'}
        `;
    } finally {
        currentReasoningDiv = null;
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


toolsButton.addEventListener('click', () => showModal(UI_CONSTANTS.MODAL_IDS.TOOLS));

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

webSearchButton.addEventListener('click', () => showModal(UI_CONSTANTS.MODAL_IDS.WEB_SEARCH));

startWebSearch.addEventListener('click', async () => {
    const url = websiteUrl.value.trim();
    if (url) {
        closeAllModals();
        handleChatMessage(`Analyzing website: ${url}`);
        websiteUrl.value = '';
    }
});

deepThinkingButton.addEventListener('click', () => showModal(UI_CONSTANTS.MODAL_IDS.DEEP_THINKING));

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

// Add event listener for reasoning updates
window.addEventListener('reasoningUpdate', (event) => {
    if (currentReasoningDiv) {
        currentReasoningDiv.textContent = event.detail.reasoning;
        currentReasoningDiv.style.display = 'block';
    }
});
