const API_URL = "http://127.0.0.eval:8000"; // Assuming local runner backend defaults to this. We'll set dynamically
const BASE_API_URL = "https://debatemate-api.onrender.com";

const domElements = {
    homeScreen: document.getElementById('home-screen'),
    homeLogo: document.getElementById('home-logo'),
    aboutScreen: document.getElementById('about-screen'),
    setupScreen: document.getElementById('setup-screen'),
    debateScreen: document.getElementById('debate-screen'),
    reportScreen: document.getElementById('report-screen'),
    historyScreen: document.getElementById('history-screen'),
    setupForm: document.getElementById('setup-form'),
    chatForm: document.getElementById('chat-form'),
    msgInput: document.getElementById('message-input'),
    chatMessages: document.getElementById('chat-messages'),
    timerDisplay: document.getElementById('timer-display'),
    sendBtn: document.getElementById('send-btn'),
    micBtn: document.getElementById('mic-btn'),
    recordingStatus: document.getElementById('recording-status'),
    recordingTimerDisplay: document.getElementById('recording-time'),
    endEarlyBtn: document.getElementById('end-early-btn'),
    reportContent: document.getElementById('report-content'),
    restartBtn: document.getElementById('restart-btn'),
    heroStartBtn: document.getElementById('hero-start-btn'),
    backToSetupBtn: document.getElementById('back-to-setup-btn'),
    historyList: document.getElementById('history-list'),
    downloadPdfBtn: document.getElementById('download-pdf-btn')
};

// Global Navigation Routing
const navLinks = document.querySelectorAll('.nav-link');

function navigateTo(targetId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(targetId).classList.remove('hidden');
    
    // Update active state on nav links
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-target="${targetId}"]`)?.classList.add('active');
    
    if (targetId === 'history-screen') renderHistory();
    
    if (targetId !== 'debate-screen') {
        if (!debateState.timerInterval) domElements.timerDisplay.classList.add('hidden');
    } else {
        domElements.timerDisplay.classList.remove('hidden');
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        
        // Confirm before leaving active debate
        if (debateState.timerInterval && targetId !== 'debate-screen' && targetId !== 'report-screen') {
            if (!confirm("You have an active debate running. Do you want to leave this page anyway?")) {
                return; // User cancelled
            }
        }
        
        navigateTo(targetId);
    });
});

document.querySelectorAll('.learn-more').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('about-screen');
    });
});

domElements.homeLogo.addEventListener('click', () => navigateTo('home-screen'));
if(domElements.heroStartBtn) domElements.heroStartBtn.addEventListener('click', () => navigateTo('setup-screen'));

// Web Speech API Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;
let recordingStartTime = null;
let recordingInterval = null;

const MIC_ICON = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
const STOP_ICON = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12"></rect></svg>`;

function updateRecordingTimer() {
    if (!recordingStartTime) return;
    const diff = Math.floor((Date.now() - recordingStartTime) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    domElements.recordingTimerDisplay.textContent = `${m}:${s}`;
}

const resetMicState = () => {
    isRecording = false;
    domElements.micBtn.classList.remove('recording');
    domElements.micBtn.innerHTML = MIC_ICON;
    domElements.msgInput.placeholder = "Type your argument here...";
    domElements.recordingStatus.classList.add('hidden');
    clearInterval(recordingInterval);
};

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Stay active until specifically stopped
    recognition.interimResults = true;
    
    recognition.onstart = () => {
        isRecording = true;
        domElements.micBtn.classList.add('recording');
        domElements.micBtn.innerHTML = STOP_ICON;
        domElements.msgInput.placeholder = "Listening... Click Stop icon to pause";
        domElements.recordingStatus.classList.remove('hidden');
        recordingStartTime = Date.now();
        domElements.recordingTimerDisplay.textContent = "00:00";
        recordingInterval = setInterval(updateRecordingTimer, 1000);
    };
    
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        domElements.msgInput.value = transcript;
        domElements.msgInput.style.height = 'auto'; 
        domElements.msgInput.style.height = (domElements.msgInput.scrollHeight) + 'px';
    };
    
    recognition.onend = () => {
        resetMicState();
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
            resetMicState();
        }
    };
} else {
    if (domElements.micBtn) domElements.micBtn.style.display = 'none'; // Hide if unsupported
}

let debateState = {
    topic: '',
    durationSeconds: 0,
    endTime: null,
    timerInterval: null,
    messages: [], // Format: { role: 'user'|'assistant', content: string }
    evaluations: []
};

// --- Setup Phase ---
domElements.setupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const topic = document.getElementById('topic-input').value.trim();
    const durationBtn = document.querySelector('input[name="duration"]:checked').value;
    
    if(!topic) return;

    debateState.topic = topic;
    debateState.durationSeconds = parseInt(durationBtn) * 60;
    
    startDebate();
});

function startDebate() {
    navigateTo('debate-screen');
    domElements.timerDisplay.classList.remove('hidden');
    if (domElements.endEarlyBtn) domElements.endEarlyBtn.disabled = false;
    
    // Clear chat
    domElements.chatMessages.innerHTML = '';
    debateState.messages = [];
    debateState.evaluations = [];

    // System message
    appendSystemMessage(`Debate started! Topic: "${debateState.topic}"`);
    
    // Start Timer
    debateState.endTime = Date.now() + (debateState.durationSeconds * 1000);
    updateTimer();
    debateState.timerInterval = setInterval(updateTimer, 1000);
}

// --- Chat Phase ---
domElements.chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isRecording && recognition) {
        recognition.stop();
    }
    const text = domElements.msgInput.value.trim();
    if (!text) return;

    // Build Message UI
    const msgId = `msg-${Date.now()}`;
    const userMsgObj = { role: 'user', content: text };
    debateState.messages.push(userMsgObj);
    
    domElements.msgInput.value = '';
    domElements.msgInput.style.height = 'auto'; // reset textarea
    appendUserMessage(text, msgId);
    
    // Lock Input
    domElements.sendBtn.disabled = true;
    domElements.msgInput.disabled = true;
    
    // Show AI typing indicator
    const typingIndicatorId = showTypingIndicator();

    try {
        // Parallel requests: Chat & Evaluate
        const [chatResponse, evalResponse] = await Promise.all([
            fetch(`${BASE_API_URL}/chat`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: debateState.messages, topic: debateState.topic })
            }),
            fetch(`${BASE_API_URL}/evaluate`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ argument: text, topic: debateState.topic })
            })
        ]);

        const chatData = await chatResponse.json();
        const evalData = await evalResponse.json();

        // 1. Remove Typing Indicator
        removeElement(typingIndicatorId);
        
        // 2. Append AI Response
        if(chatData.response) {
            debateState.messages.push({ role: 'assistant', content: chatData.response });
            appendAIMessage(chatData.response);
        } else {
            appendSystemMessage("Error retrieving counterargument.");
        }

        // 3. Attach Evaluation to User Message
        if(evalData) {
            debateState.evaluations.push(evalData);
            attachEvaluationUI(msgId, evalData);
        }

    } catch (error) {
        removeElement(typingIndicatorId);
        appendSystemMessage("Connection error with backend.");
        console.error(error);
    } finally {
        // Unlock input ONLY if time is not up
        if (debateState.timerInterval) {
            domElements.sendBtn.disabled = false;
            domElements.msgInput.disabled = false;
            domElements.msgInput.focus();
        }
    }
});

// Auto-resize textarea
domElements.msgInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Submit on Enter (prevent default to avoid newlines, shift+enter for new line)
domElements.msgInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        domElements.sendBtn.click();
    }
});

// --- UI Helpers ---
function appendUserMessage(content, id) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message user';
    wrapper.id = id;
    wrapper.innerHTML = `<div class="bubble">${escapeHTML(content)}</div>`;
    domElements.chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function appendAIMessage(content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message ai';
    wrapper.innerHTML = `<div class="bubble">${escapeHTML(content)}</div>`;
    domElements.chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function appendSystemMessage(content) {
    const div = document.createElement('div');
    div.style.textAlign = 'center';
    div.style.fontSize = '0.8rem';
    div.style.color = '#888';
    div.style.margin = '1rem 0';
    div.textContent = content;
    domElements.chatMessages.appendChild(div);
    scrollToBottom();
}

function showTypingIndicator() {
    const id = `typing-${Date.now()}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'message ai typing-wrapper';
    wrapper.id = id;
    wrapper.innerHTML = `
        <div class="bubble typing">
            <span></span><span></span><span></span>
        </div>
    `;
    domElements.chatMessages.appendChild(wrapper);
    scrollToBottom();
    return id;
}

function removeElement(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
}

function attachEvaluationUI(msgId, evalData) {
    const msgEl = document.getElementById(msgId);
    if(!msgEl) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'eval-wrapper';
    
    const scoreText = evalData.score ? `${evalData.score}/10` : `?`;

    wrapper.innerHTML = `
        <div class="eval-header" onclick="this.nextElementSibling.classList.toggle('open')">
            <span>📊 Evaluation Score: ${scoreText}</span>
            <span style="font-size: 0.7rem;">▼ Expand</span>
        </div>
        <div class="eval-body">
            <strong>Strengths</strong>
            <ul>${(evalData.strengths || []).map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul>
            <strong>Improvements</strong>
            <ul>${(evalData.improvements || []).map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul>
        </div>
    `;
    msgEl.appendChild(wrapper);
}

function scrollToBottom() {
    domElements.chatMessages.parentElement.scrollTop = domElements.chatMessages.parentElement.scrollHeight;
}

// --- Timer & Closing Phase ---
if (domElements.endEarlyBtn) {
    domElements.endEarlyBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to end the debate early and generate the final report?")) {
            endDebate();
        }
    });
}

function updateTimer() {
    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.ceil((debateState.endTime - now) / 1000));
    
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    
    domElements.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if(remainingSeconds <= 30) {
        domElements.timerDisplay.classList.add('danger');
    }

    if (remainingSeconds <= 0) {
        endDebate();
    }
}

async function endDebate() {
    clearInterval(debateState.timerInterval);
    debateState.timerInterval = null;
    
    domElements.timerDisplay.textContent = "00:00";
    domElements.timerDisplay.classList.remove('danger');
    
    domElements.sendBtn.disabled = true;
    domElements.msgInput.disabled = true;
    if (domElements.endEarlyBtn) domElements.endEarlyBtn.disabled = true;
    if (isRecording && recognition) recognition.stop();
    
    appendSystemMessage("Debate Session Concluded. Generating report...");
    
    setTimeout(() => {
        showReportScreen();
    }, 1500);
}

async function showReportScreen() {
    navigateTo('report-screen');
    domElements.timerDisplay.classList.add('hidden');
    
    // Fetch Report
    try {
        const response = await fetch(`${BASE_API_URL}/report`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evaluations: debateState.evaluations, topic: debateState.topic })
        });
        const data = await response.json();
        if(data.report) {
            domElements.reportContent.innerHTML = data.report;
            saveToHistory(debateState.topic, data.report);
        } else {
            domElements.reportContent.innerHTML = "<p>Could not generate complete report.</p>";
        }
    } catch (e) {
        domElements.reportContent.innerHTML = "<p>Connection error fetching final report.</p>";
    }
}

domElements.restartBtn.addEventListener('click', () => {
    navigateTo('setup-screen');
    document.getElementById('topic-input').value = '';
    domElements.reportContent.innerHTML = '<div class="loader-container"><div class="spinner"></div> Generating Comprehensive Report...</div>';
});

// PDF Generation
domElements.downloadPdfBtn.addEventListener('click', () => {
    const element = domElements.reportContent;
    const opt = {
      margin:       0.5,
      filename:     `Debate_Report_${debateState.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // Add temporary styling for PDF (ensure text is visible on white background)
    const originalColor = element.style.color;
    element.style.color = '#000';
    html2pdf().set(opt).from(element).save().then(() => {
        element.style.color = originalColor; // Restore
    });
});

// Mic Logic
if (domElements.micBtn) {
    domElements.micBtn.addEventListener('click', () => {
        if (!recognition) {
            alert("Speech Recognition API is not supported in this browser. Try Chrome or Edge!");
            return;
        }
        if (isRecording) {
            recognition.stop();
        } else {
            // Keep existing text, just add to it gracefully
            if (domElements.msgInput.value.trim() !== "") {
                domElements.msgInput.value += " ";
            }
            try {
                recognition.start();
            } catch(e) { /* Already started error */ }
        }
    });
}

// History Logic
function saveToHistory(topic, reportHtml) {
    const history = JSON.parse(localStorage.getItem('debateHistory') || '[]');
    history.unshift({
        topic: topic,
        date: new Date().toLocaleString(),
        report: reportHtml
    });
    localStorage.setItem('debateHistory', JSON.stringify(history));
}

domElements.backToSetupBtn.addEventListener('click', () => {
    navigateTo('home-screen');
});

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('debateHistory') || '[]');
    domElements.historyList.innerHTML = '';
    
    if (history.length === 0) {
        domElements.historyList.innerHTML = '<p>No past debates logged.</p>';
        return;
    }
    
    history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card fade-in';
        card.innerHTML = `
            <h3>${escapeHTML(item.topic)}</h3>
            <div class="date">${escapeHTML(item.date)}</div>
            <div class="report-preview" style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px;">
                ${item.report}
            </div>
        `;
        domElements.historyList.appendChild(card);
    });
}

// Utils
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
