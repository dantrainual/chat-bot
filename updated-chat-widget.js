// Chat Widget with Registration Support
(function() {
    // Default configuration
    const defaultConfig = {
        webhook: {
            url: '',
            route: 'general'
        },
        branding: {
            logo: '',
            name: 'Chat Widget',
            welcomeText: 'Hello! How can I help you today?',
            responseTimeText: 'We usually respond within a few minutes'
        },
        style: {
            primaryColor: '#4f46e5',
            secondaryColor: '#818cf8',
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#1f2937'
        },
        requireRegistration: false,
        registrationFields: ['name', 'email'],
        suggestedQuestions: []
    };

    // Merge default config with user config
    const config = { ...defaultConfig, ...window.ChatWidgetConfig };

    // State management
    const state = {
        isOpen: false,
        isLoading: false,
        conversationId: Date.now().toString(),
        messages: [],
        isRegistered: false,
        userInfo: {}
    };

    // Utility function to create elements
    function createElement(tag, className, attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        
        return element;
    }

    // Create CSS
    function createStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .chat-widget-container {
                position: fixed;
                bottom: 20px;
                ${config.style.position === 'left' ? 'left: 20px;' : 'right: 20px;'}
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            
            .chat-widget-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: ${config.style.primaryColor};
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }
            
            .chat-widget-button:hover {
                transform: scale(1.05);
            }
            
            .chat-widget-icon {
                width: 30px;
                height: 30px;
                fill: white;
            }
            
            .chat-widget-close-icon {
                width: 24px;
                height: 24px;
                fill: white;
            }
            
            .chat-widget {
                position: absolute;
                bottom: 80px;
                ${config.style.position === 'left' ? 'left: 0;' : 'right: 0;'}
                width: 350px;
                height: 500px;
                background-color: ${config.style.backgroundColor};
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                transform: translateY(20px);
                pointer-events: none;
                transition: all 0.3s ease;
            }
            
            .chat-widget.active {
                opacity: 1;
                transform: translateY(0);
                pointer-events: all;
            }
            
            .chat-widget-header {
                background-color: ${config.style.primaryColor};
                color: white;
                padding: 15px;
                display: flex;
                align-items: center;
            }
            
            .chat-widget-logo {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                margin-right: 10px;
                object-fit: cover;
            }
            
            .chat-widget-title {
                font-weight: 600;
                font-size: 16px;
                flex-grow: 1;
            }
            
            .chat-widget-close {
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            
            .chat-widget-close:hover {
                opacity: 1;
            }
            
            .chat-widget-body {
                flex-grow: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            
            .chat-welcome-message {
                text-align: center;
                margin-bottom: 10px;
            }
            
            .chat-welcome-message h3 {
                margin-bottom: 10px;
                color: ${config.style.fontColor};
            }
            
            .chat-welcome-message p {
                color: ${config.style.fontColor};
                opacity: 0.8;
            }
            
            .chat-message {
                margin-bottom: 10px;
                max-width: 80%;
                padding: 10px 12px;
                border-radius: 15px;
                position: relative;
                word-wrap: break-word;
                line-height: 1.4;
            }
            
            .chat-message.user {
                align-self: flex-end;
                background-color: ${config.style.primaryColor};
                color: white;
                border-bottom-right-radius: 5px;
            }
            
            .chat-message.bot {
                align-self: flex-start;
                background-color: #f0f0f0;
                color: ${config.style.fontColor};
                border-bottom-left-radius: 5px;
            }
            
            .typing-indicator {
                align-self: flex-start;
                background-color: #f0f0f0;
                padding: 12px 16px;
                border-radius: 15px;
                border-bottom-left-radius: 5px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
            }
            
            .typing-dot {
                width: 8px;
                height: 8px;
                background-color: #888;
                border-radius: 50%;
                margin: 0 2px;
                animation: typing-animation 1.4s infinite ease-in-out;
            }
            
            .typing-dot:nth-child(1) {
                animation-delay: 0s;
            }
            
            .typing-dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .typing-dot:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing-animation {
                0%, 60%, 100% {
                    transform: translateY(0);
                }
                30% {
                    transform: translateY(-5px);
                }
            }
            
            .chat-widget-footer {
                padding: 15px;
                border-top: 1px solid #eee;
            }
            
            .chat-input-container {
                display: flex;
                align-items: center;
            }
            
            .chat-input {
                flex-grow: 1;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 10px 15px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }
            
            .chat-input:focus {
                border-color: ${config.style.primaryColor};
            }
            
            .chat-send-button {
                background-color: ${config.style.primaryColor};
                color: white;
                border: none;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                margin-left: 10px;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: background-color 0.2s;
            }
            
            .chat-send-button:hover {
                background-color: ${config.style.secondaryColor};
            }
            
            .chat-send-icon {
                width: 18px;
                height: 18px;
                fill: white;
            }
            
            .suggested-questions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 15px;
            }
            
            .suggested-question {
                background-color: #f0f0f0;
                color: ${config.style.fontColor};
                padding: 8px 12px;
                border-radius: 15px;
                font-size: 13px;
                cursor: pointer;
                transition: background-color 0.2s;
                border: none;
                text-align: left;
            }
            
            .suggested-question:hover {
                background-color: #e0e0e0;
            }

            .registration-form {
                display: flex;
                flex-direction: column;
                padding: 15px;
                gap: 15px;
            }

            .registration-form h3 {
                text-align: center;
                color: ${config.style.fontColor};
                margin-bottom: 10px;
            }

            .registration-form input {
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
                outline: none;
            }

            .registration-form input:focus {
                border-color: ${config.style.primaryColor};
            }

            .registration-form button {
                background-color: ${config.style.primaryColor};
                color: white;
                border: none;
                border-radius: 5px;
                padding: 10px 15px;
                font-size: 14px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .registration-form button:hover {
                background-color: ${config.style.secondaryColor};
            }
        `;
        document.head.appendChild(style);
    }

    // Create chat button
    function createChatButton() {
        const container = createElement('div', 'chat-widget-container');
        
        const button = createElement('div', 'chat-widget-button');
        button.innerHTML = `
            <svg class="chat-widget-icon" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
                <path d="M7 9h10v2H7zM7 6h10v2H7zM7 12h7v2H7z"/>
            </svg>
        `;
        
        button.addEventListener('click', toggleChat);
        container.appendChild(button);
        
        return container;
    }

    // Create chat widget
    function createChatWidget(container) {
        const chatWidget = createElement('div', 'chat-widget');
        
        // Header
        const header = createElement('div', 'chat-widget-header');
        
        if (config.branding.logo) {
            const logo = createElement('img', 'chat-widget-logo', {
                src: config.branding.logo,
                alt: `${config.branding.name} Logo`
            });
            header.appendChild(logo);
        }
        
        const title = createElement('div', 'chat-widget-title');
        title.textContent = config.branding.name;
        header.appendChild(title);
        
        const closeButton = createElement('div', 'chat-widget-close');
        closeButton.innerHTML = `
            <svg class="chat-widget-close-icon" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
        `;
        closeButton.addEventListener('click', toggleChat);
        header.appendChild(closeButton);
        
        chatWidget.appendChild(header);
        
        // Body
        const body = createElement('div', 'chat-widget-body');
        chatWidget.appendChild(body);
        
        // Footer
        const footer = createElement('div', 'chat-widget-footer');
        
        const inputContainer = createElement('div', 'chat-input-container');
        
        const input = createElement('input', 'chat-input', {
            type: 'text',
            placeholder: 'Type a message...'
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                handleSendMessage(input.value);
                input.value = '';
            }
        });
        
        inputContainer.appendChild(input);
        
        const sendButton = createElement('button', 'chat-send-button');
        sendButton.innerHTML = `
            <svg class="chat-send-icon" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
        `;
        sendButton.addEventListener('click', () => {
            if (input.value.trim()) {
                handleSendMessage(input.value);
                input.value = '';
            }
        });
        
        inputContainer.appendChild(sendButton);
        footer.appendChild(inputContainer);
        
        chatWidget.appendChild(footer);
        container.appendChild(chatWidget);
        
        return {
            widget: chatWidget,
            body: body,
            input: input,
            footer: footer
        };
    }

    // Show registration form
    function showRegistrationForm() {
        const chatBody = document.querySelector('.chat-widget-body');
        chatBody.innerHTML = '';
        
        const form = createElement('div', 'registration-form');
        
        const title = createElement('h3');
        title.textContent = 'Please register to continue';
        form.appendChild(title);
        
        // Add registration fields based on config
        config.registrationFields.forEach(field => {
            let input;
            
            if (field === 'email') {
                input = createElement('input', '', {
                    type: 'email',
                    id: 'reg-email',
                    placeholder: 'Your email',
                    required: 'required'
                });
            } else if (field === 'name') {
                input = createElement('input', '', {
                    type: 'text',
                    id: 'reg-name',
                    placeholder: 'Your name',
                    required: 'required'
                });
            } else {
                input = createElement('input', '', {
                    type: 'text',
                    id: `reg-${field}`,
                    placeholder: `Your ${field}`,
                    required: 'required'
                });
            }
            
            form.appendChild(input);
        });
        
        const registerBtn = createElement('button', '', {
            id: 'register-btn'
        });
        registerBtn.textContent = 'Register';
        
        registerBtn.addEventListener('click', handleRegistration);
        form.appendChild(registerBtn);
        
        chatBody.appendChild(form);
    }

    // Handle registration
    function handleRegistration() {
        const userInfo = {};
        let isValid = true;
        
        config.registrationFields.forEach(field => {
            const input = document.getElementById(`reg-${field}`);
            if (input && input.value.trim()) {
                userInfo[field] = input.value.trim();
            } else {
                isValid = false;
            }
        });
        
        if (isValid) {
            state.userInfo = userInfo;
            state.isRegistered = true;
            
            // Notify webhook about registration
            fetch(config.webhook.url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    type: 'registration',
                    userInfo: state.userInfo,
                    conversationId: state.conversationId,
                    route: config.webhook.route || 'general'
                }),
            });
            
            initChatInterface();
        }
    }

    // Initialize chat interface
    function initChatInterface() {
        const chatBody = document.querySelector('.chat-widget-body');
        chatBody.innerHTML = '';
        
        // Welcome message
        const welcomeMessage = createElement('div', 'chat-welcome-message');
        
        const welcomeTitle = createElement('h3');
        welcomeTitle.textContent = config.branding.welcomeText;
        welcomeMessage.appendChild(welcomeTitle);
        
        const welcomeSubtitle = createElement('p');
        welcomeSubtitle.textContent = config.branding.responseTimeText;
        welcomeMessage.appendChild(welcomeSubtitle);
        
        chatBody.appendChild(welcomeMessage);
        
        // Suggested questions
        if (config.suggestedQuestions && config.suggestedQuestions.length > 0) {
            const suggestedQuestionsContainer = createElement('div', 'suggested-questions');
            
            config.suggestedQuestions.forEach(question => {
                const btn = createElement('button', 'suggested-question');
                btn.textContent = question;
                btn.addEventListener('click', () => {
                    handleSendMessage(question);
                });
                suggestedQuestionsContainer.appendChild(btn);
            });
            
            chatBody.appendChild(suggestedQuestionsContainer);
        }
    }

    // Toggle chat open/closed
    function toggleChat() {
        state.isOpen = !state.isOpen;
        const chatWidget = document.querySelector('.chat-widget');
        
        if (state.isOpen) {
            chatWidget.classList.add('active');
            
            // Show registration form or chat interface based on registration status
            if (config.requireRegistration && !state.isRegistered) {
                showRegistrationForm();
            } else if (!state.isRegistered) {
                state.isRegistered = true; // Auto-register if not required
                initChatInterface();
            }
        } else {
            chatWidget.classList.remove('active');
        }
    }

    // Handle sending a message
    function handleSendMessage(message) {
        // Add user message to UI
        addMessage(message, 'user');
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send to webhook
        sendMessage(message);
    }

    // Add a message to the chat
    function addMessage(message, sender) {
        const chatBody = document.querySelector('.chat-widget-body');
        
        const messageEl = createElement('div', `chat-message ${sender}`);
        messageEl.textContent = message;
        
        chatBody.appendChild(messageEl);
        
        // Save to state
        state.messages.push({ sender, message });
        
        // Scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const chatBody = document.querySelector('.chat-widget-body');
        
        const indicator = createElement('div', 'typing-indicator');
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        chatBody.appendChild(indicator);
        chatBody.scrollTop = chatBody.scrollHeight;
        
        return indicator;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Send message to webhook
    function sendMessage(message) {
        state.isLoading = true;
        
        fetch(config.webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationId: state.conversationId,
                userInfo: state.userInfo, // Include registration info
                route: config.webhook.route || 'general'
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot message
            if (data.message) {
                addMessage(data.message, 'bot');
            }
            
            state.isLoading = false;
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add error message
            addMessage('Sorry, there was an error processing your request.', 'bot');
            
            state.isLoading = false;
        });
    }

    // Initialize chat widget
    function init() {
        // Create styles
        createStyles();
        
        // Create chat button
        const container = createChatButton();
        
        // Create chat widget
        createChatWidget(container);
        
        // Add to document
        document.body.appendChild(container);
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
