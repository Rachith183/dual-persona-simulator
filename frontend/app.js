/**
 * INTERACTIVE CHARACTER BUILD AI - COMPLETE REWRITE
 * Firebase real-time sync, expression-driven canvas, Gemini integration
 */

// ============================================================================
// CONFIGURATION & STATE
// ============================================================================

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const EXPRESSION_MAP = {
    'exp 1': 'exp 1 - angry',
    'exp 2': 'exp 2 - annoyed or disatisfied',
    'exp 3': 'exp3-proud or satisfied',
    'exp 4': 'exp 4 - smiling'
};

const AppState = {
    currentYear: 2026,
    currentMonth: 4, // 0-indexed: May
    currentPanel: 'ch-core',
    currentExpression: 'exp 3',
    sidebarOpen: false,
    
    // Firebase data
    userProfile: {},
    userGoals: {},
    userCalendar: {},
    userDistractions: [],
    userContext: {},
};

// ============================================================================
// DOM REFERENCES
// ============================================================================

const DOM = {
    // Sidebar
    sidebarToggle: document.getElementById('sidebar-toggle-btn'),
    sidebar: document.getElementById('app-sidebar'),
    sidebarItems: document.querySelectorAll('.sidebar-nav-item'),
    
    // Panels
    contentViewport: document.getElementById('content-viewport'),
    allPanels: document.querySelectorAll('.app-panel'),
    panelChCore: document.getElementById('panel-ch-core'),
    panelGoals: document.getElementById('panel-goal-tracker'),
    panelCalendar: document.getElementById('panel-calendar'),
    panelDistraction: document.getElementById('panel-distraction'),
    panelProfile: document.getElementById('panel-profile'),
    
    // CH Core - Avatar & Chat
    avatarBase: document.getElementById('avatar-base'),
    chatHistory: document.getElementById('chat-history'),
    chatInput: document.getElementById('chat-input'),
    chatSendBtn: document.getElementById('chat-send-btn'),
    chatMicBtn: document.getElementById('chat-mic-btn'),
    
    // Calendar
    calendarGrid: document.getElementById('calendar-grid'),
    calendarTitle: document.getElementById('calendar-month-year'),
    prevMonthBtn: document.getElementById('prev-month-btn'),
    nextMonthBtn: document.getElementById('next-month-btn'),
    
    // Goal Tracker
    dailyProgress: document.getElementById('daily-progress'),
    midtermProgress: document.getElementById('midterm-progress'),
    endgoalProgress: document.getElementById('endgoal-progress'),
    dailyValue: document.getElementById('daily-value'),
    midtermValue: document.getElementById('midterm-value'),
    endgoalValue: document.getElementById('endgoal-value'),
    performanceTbody: document.getElementById('performance-tbody'),
    
    // Distraction Tracker
    distractionForm: document.getElementById('distraction-form'),
    dailyDistractionCount: document.getElementById('daily-distraction-count'),
    weeklyDistractionCount: document.getElementById('weekly-distraction-count'),
    monthlyDistractionCount: document.getElementById('monthly-distraction-count'),
    distractionEntries: document.getElementById('distraction-entries'),
    
    // Profile Form
    profileForm: document.getElementById('profile-form'),
    academicDetails: document.getElementById('academic-details'),
    routineConstraints: document.getElementById('routine-constraints'),
    physicalMetrics: document.getElementById('physical-metrics'),
    lifestyleRegimen: document.getElementById('lifestyle-regimen'),
};

// ============================================================================
// SIDEBAR & PANEL ROUTING
// ============================================================================

/**
 * Toggle sidebar visibility on mobile
 */
function toggleSidebar() {
    AppState.sidebarOpen = !AppState.sidebarOpen;
    if (AppState.sidebarOpen) {
        DOM.sidebar.classList.add('open');
    } else {
        DOM.sidebar.classList.remove('open');
    }
}

/**
 * Switch active panel
 */
function switchPanel(panelName) {
    // Hide all panels
    DOM.allPanels.forEach(panel => panel.classList.add('hidden'));
    
    // Show target panel
    const panelMap = {
        'ch-core': DOM.panelChCore,
        'goal-tracker': DOM.panelGoals,
        'calendar': DOM.panelCalendar,
        'distraction': DOM.panelDistraction,
        'profile': DOM.panelProfile,
    };
    
    const targetPanel = panelMap[panelName];
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        AppState.currentPanel = panelName;
    }
    
    // Close sidebar on mobile after selection
    if (AppState.sidebarOpen && window.innerWidth < 768) {
        toggleSidebar();
    }
}

/**
 * Initialize sidebar and panel routing
 */
function initRouting() {
    DOM.sidebarToggle?.addEventListener('click', toggleSidebar);
    
    DOM.sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const panelName = e.currentTarget.getAttribute('data-panel');
            switchPanel(panelName);
        });
    });
}

// ============================================================================
// CALENDAR ENGINE
// ============================================================================

/**
 * Get number of days in a month
 */
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get first day of week for a month (0 = Sunday)
 */
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

/**
 * Get date string (YYYY-MM-DD)
 */
function getDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Count tasks for a specific date
 */
function getTaskCountForDate(year, month, day) {
    const dateStr = getDateString(year, month, day);
    // Get task count from Firebase calendar data
    // For now, return random for demo
    return Math.floor(Math.random() * 5);
}

/**
 * Render single-month calendar grid
 */
function renderCalendarMonth() {
    const year = AppState.currentYear;
    const month = AppState.currentMonth;
    
    // Update title
    DOM.calendarTitle.textContent = `${MONTH_NAMES[month]} ${year}`;
    
    // Clear grid
    DOM.calendarGrid.innerHTML = '';
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Create weekday headers
    const weekdayRow = document.createElement('div');
    weekdayRow.className = 'calendar-weekday-row';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-weekday-header';
        header.textContent = day;
        weekdayRow.appendChild(header);
    });
    DOM.calendarGrid.appendChild(weekdayRow);
    
    // Create day cells
    const dayRow = document.createElement('div');
    dayRow.className = 'calendar-day-row';
    
    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day-cell empty';
        dayRow.appendChild(emptyCell);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell';
        
        // Add task indicator
        const taskCount = getTaskCountForDate(year, month, day);
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        
        const indicator = document.createElement('div');
        indicator.className = 'task-indicator';
        if (taskCount >= 2) {
            indicator.classList.add('checkmark');
            indicator.innerHTML = '✓';
            indicator.style.color = '#00F5A0'; // Emerald mint
        } else if (taskCount > 0) {
            indicator.classList.add('partial');
            indicator.innerHTML = '◐';
            indicator.style.color = '#FFB020';
        } else {
            indicator.classList.add('empty');
            indicator.innerHTML = '✗';
            indicator.style.color = '#FF3366'; // Vivid coral
        }
        
        dayCell.appendChild(dayNumber);
        dayCell.appendChild(indicator);
        dayRow.appendChild(dayCell);
    }
    
    DOM.calendarGrid.appendChild(dayRow);
}

/**
 * Handle previous month navigation
 */
function handlePrevMonth() {
    AppState.currentMonth--;
    if (AppState.currentMonth < 0) {
        AppState.currentMonth = 11;
        AppState.currentYear--;
    }
    renderCalendarMonth();
}

/**
 * Handle next month navigation
 */
function handleNextMonth() {
    AppState.currentMonth++;
    if (AppState.currentMonth > 11) {
        AppState.currentMonth = 0;
        AppState.currentYear++;
    }
    renderCalendarMonth();
}

/**
 * Initialize calendar navigation
 */
function initCalendar() {
    DOM.prevMonthBtn?.addEventListener('click', handlePrevMonth);
    DOM.nextMonthBtn?.addEventListener('click', handleNextMonth);
    renderCalendarMonth();
}

// ============================================================================
// AVATAR EXPRESSION SWITCHING
// ============================================================================

/**
 * Switch avatar expression layers
 */
function switchAvatarExpression(expressionState) {
    // expressionState: 'exp 1', 'exp 2', 'exp 3', 'exp 4'
    const folderMap = {
        'exp 1': 'exp 1 - angry',
        'exp 2': 'exp 2 - annoyed or disatisfied',
        'exp 3': 'exp3-proud or satisfied',
        'exp 4': 'exp 4 - smiling'
    };
    
    const folder = folderMap[expressionState];
    if (!folder) return;
    
    const newSrc = `./${folder}/idle.png`;
    
    // Smooth fade transition
    DOM.avatarBase.style.opacity = '0.5';
    setTimeout(() => {
        DOM.avatarBase.src = newSrc;
        DOM.avatarBase.style.opacity = '1';
    }, 150);
    
    AppState.currentExpression = expressionState;
    console.log(`Avatar expression switched to: ${expressionState}`);
}

// ============================================================================
// CHAT INTERFACE & GEMINI INTEGRATION
// ============================================================================

/**
 * Generate audio from text and play with animation sync
 */
async function generateAndPlayAudio(text) {
    try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Estimate duration: ~150ms per word + buffer
        const wordCount = text.split(' ').length;
        const estimatedDuration = (wordCount * 0.15) + 0.5;
        
        utterance.onstart = () => {
            startSpeechAnimation(estimatedDuration);
        };
        
        utterance.onend = () => {
            stopSpeechAnimation();
        };
        
        speechSynthesis.speak(utterance);
        
    } catch (error) {
        console.error('Audio generation error:', error);
    }
}

/**
 * Send chat message and get Gemini response
 */
async function handleChatSend() {
    const userMessage = DOM.chatInput?.value.trim();
    if (!userMessage) return;
    
    // Display user message
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'chat-message user';
    userMsgEl.innerHTML = `<p>${escapeHtml(userMessage)}</p>`;
    DOM.chatHistory?.appendChild(userMsgEl);
    
    // Clear input
    if (DOM.chatInput) DOM.chatInput.value = '';
    
    // Auto-scroll
    if (DOM.chatHistory) {
        DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
    }
    
    // Get AI response
    try {
        const response = await callGeminiAPI(userMessage);
        
        if (response && response.character_dialogue) {
            // Add AI response
            const aiMsgEl = document.createElement('div');
            aiMsgEl.className = 'chat-message ai';
            aiMsgEl.innerHTML = `<p>${escapeHtml(response.character_dialogue)}</p>`;
            DOM.chatHistory?.appendChild(aiMsgEl);
            
            // Switch avatar expression if provided
            if (response.current_expression_state) {
                switchAvatarExpression(response.current_expression_state);
            }
            
            // Generate and play audio response with animation
            await generateAndPlayAudio(response.character_dialogue);
            
            // Auto-scroll
            if (DOM.chatHistory) {
                DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Chat error:', error);
        const errorMsgEl = document.createElement('div');
        errorMsgEl.className = 'chat-message system';
        errorMsgEl.innerHTML = '<p>Unable to reach AI service. Please try again.</p>';
        DOM.chatHistory?.appendChild(errorMsgEl);
    }
}

/**
 * Call Gemini API via browser (free tier)
 */
async function callGeminiAPI(userMessage) {
    const apiKey = window.AOI_GEMINI_API_KEY;
    const model = window.AOI_GEMINI_MODEL || 'gemini-2.5-flash';
    
    if (!apiKey) {
        console.error('Gemini API key not found');
        return null;
    }
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: userMessage
                    }]
                }]
            })
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        
        return {
            character_dialogue: text,
            current_expression_state: AppState.currentExpression
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        return null;
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize chat handlers
 */
function initChat() {
    DOM.chatSendBtn?.addEventListener('click', handleChatSend);
    
    DOM.chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSend();
        }
    });
    
    DOM.chatMicBtn?.addEventListener('click', () => {
        console.log('Microphone button clicked - Speech-to-text coming soon');
        // TODO: Implement Web Speech API
    });
}

// ============================================================================
// DISTRACTION TRACKER
// ============================================================================

/**
 * Handle distraction form submission
 */
async function handleDistractionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(DOM.distractionForm);
    const entry = {
        type: formData.get('distraction-type'),
        date: formData.get('distraction-date'),
        time: formData.get('distraction-time'),
        duration: parseInt(formData.get('distraction-duration'), 10),
        timestamp: new Date().toISOString()
    };
    
    // Add to local state
    AppState.userDistractions.push(entry);
    
    // TODO: Sync to Firebase
    
    // Update display
    updateDistractionCounts();
    DOM.distractionForm.reset();
}

/**
 * Update distraction counts
 */
function updateDistractionCounts() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const dailyCount = AppState.userDistractions.filter(d => d.date === today).length;
    const weeklyCount = AppState.userDistractions.filter(d => d.date >= weekAgo).length;
    const monthlyCount = AppState.userDistractions.filter(d => d.date >= monthAgo).length;
    
    if (DOM.dailyDistractionCount) DOM.dailyDistractionCount.textContent = dailyCount;
    if (DOM.weeklyDistractionCount) DOM.weeklyDistractionCount.textContent = weeklyCount;
    if (DOM.monthlyDistractionCount) DOM.monthlyDistractionCount.textContent = monthlyCount;
}

/**
 * Initialize distraction tracker
 */
function initDistractionTracker() {
    DOM.distractionForm?.addEventListener('submit', handleDistractionSubmit);
}

// ============================================================================
// PROFILE FORM & FIREBASE SYNC
// ============================================================================

/**
 * Handle profile form submission
 */
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    AppState.userContext = {
        academic: DOM.academicDetails?.value || '',
        routine: DOM.routineConstraints?.value || '',
        physical: DOM.physicalMetrics?.value || '',
        lifestyle: DOM.lifestyleRegimen?.value || ''
    };
    
    // TODO: Sync to Firebase
    console.log('Profile saved (local):', AppState.userContext);
}

/**
 * Initialize profile form
 */
function initProfileForm() {
    DOM.profileForm?.addEventListener('submit', handleProfileSubmit);
}

// ============================================================================
// GOAL TRACKER PROGRESS CIRCLES
// ============================================================================

/**
 * Update progress circle SVG
 */
function updateProgressCircle(circleId, percentage) {
    const circle = document.querySelector(`#${circleId}`);
    if (!circle) return;
    
    const circumference = 2 * Math.PI * 50; // r=50
    const offset = circumference - (circumference * percentage) / 100;
    circle.style.strokeDashoffset = offset;
}

/**
 * Update goal progress display
 */
function updateGoalProgress() {
    // These values should come from Firebase
    // For now, using demo values
    
    const dailyXP = 75;  // percentage
    const midtermXP = 45; // percentage
    const endgoalXP = 20; // percentage
    
    updateProgressCircle('daily-progress', dailyXP);
    updateProgressCircle('midterm-progress', midtermXP);
    updateProgressCircle('endgoal-progress', endgoalXP);
    
    if (DOM.dailyValue) DOM.dailyValue.textContent = `${dailyXP}%`;
    if (DOM.midtermValue) DOM.midtermValue.textContent = `${midtermXP}%`;
    if (DOM.endgoalValue) DOM.endgoalValue.textContent = `${endgoalXP}%`;
}

// ============================================================================
// ANIMATION ENGINE: AUDIO-DRIVEN MOUTH & EYE ANIMATION
// ============================================================================

const AnimationState = {
    // Mouth animation
    mouthClosed: { opacity: 1.0 },
    mouthMiddling: { opacity: 0.0 },
    mouthOpen: { opacity: 0.0 },
    
    // Eye animation & emotion
    eyeOpen: { opacity: 1.0 },
    eyeAnnoyed: { opacity: 0.0 },
    eyeHalfClosed: { opacity: 0.0 },
    
    // Blinking state
    isBlinking: false,
    blinkCycle: 0,
    blinkDuration: 150, // ms
    blinkInterval: 3000, // 7-BPM = ~3000ms between blinks
    lastBlinkTime: 0,
    
    // Speech state
    isSpeaking: false,
    currentAudioDuration: 0,
    animationStartTime: 0,
    mouthCycleProgress: 0,
    
    // Animation loop
    animationFrameId: null,
    lastFrameTime: 0,
};

/**
 * Linear interpolation (Lerp) helper
 */
function lerp(current, target, factor = 0.1) {
    return current + (target - current) * factor;
}

/**
 * Update mouth layer opacities for phonetic animation
 */
function updateMouthLayers() {
    if (!document.getElementById('mouth-closed')) {
        const mouthContainer = document.getElementById('avatar-canvas');
        if (mouthContainer) {
            const closedImg = document.createElement('img');
            closedImg.id = 'mouth-closed';
            closedImg.src = './mouth(use for speaking animation and expression and generation)/mouth_closed.png';
            closedImg.className = 'mouth-layer';
            closedImg.style.opacity = '1';
            mouthContainer.appendChild(closedImg);
            
            const middlingImg = document.createElement('img');
            middlingImg.id = 'mouth-middling';
            middlingImg.src = './mouth(use for speaking animation and expression and generation)/mouth_middling.png';
            middlingImg.className = 'mouth-layer';
            middlingImg.style.opacity = '0';
            mouthContainer.appendChild(middlingImg);
            
            const openImg = document.createElement('img');
            openImg.id = 'mouth-open';
            openImg.src = './mouth(use for speaking animation and expression and generation)/mouth_open.png';
            openImg.className = 'mouth-layer';
            openImg.style.opacity = '0';
            mouthContainer.appendChild(openImg);
        }
    }
    
    const mouthClosed = document.getElementById('mouth-closed');
    const mouthMiddling = document.getElementById('mouth-middling');
    const mouthOpen = document.getElementById('mouth-open');
    
    if (mouthClosed) mouthClosed.style.opacity = AnimationState.mouthClosed.opacity.toFixed(2);
    if (mouthMiddling) mouthMiddling.style.opacity = AnimationState.mouthMiddling.opacity.toFixed(2);
    if (mouthOpen) mouthOpen.style.opacity = AnimationState.mouthOpen.opacity.toFixed(2);
}

/**
 * Update eye layer opacities for emotion and blinking
 */
function updateEyeLayers() {
    if (!document.getElementById('eye-open')) {
        const eyeContainer = document.getElementById('avatar-canvas');
        if (eyeContainer) {
            const openImg = document.createElement('img');
            openImg.id = 'eye-open';
            openImg.src = './eyes (  use blinking animation and expression  and emotiongeneration)/full opened eye.png';
            openImg.className = 'eye-layer';
            openImg.style.opacity = '1';
            eyeContainer.appendChild(openImg);
            
            const annoyedImg = document.createElement('img');
            annoyedImg.id = 'eye-annoyed';
            annoyedImg.src = './eyes (  use blinking animation and expression  and emotiongeneration)/annoyed_eye.png';
            annoyedImg.className = 'eye-layer';
            annoyedImg.style.opacity = '0';
            eyeContainer.appendChild(annoyedImg);
            
            const halfClosedImg = document.createElement('img');
            halfClosedImg.id = 'eye-half-closed';
            halfClosedImg.src = './eyes (  use blinking animation and expression  and emotiongeneration)/half closed eye.png';
            halfClosedImg.className = 'eye-layer';
            halfClosedImg.style.opacity = '0';
            eyeContainer.appendChild(halfClosedImg);
        }
    }
    
    const eyeOpen = document.getElementById('eye-open');
    const eyeAnnoyed = document.getElementById('eye-annoyed');
    const eyeHalfClosed = document.getElementById('eye-half-closed');
    
    if (eyeOpen) eyeOpen.style.opacity = AnimationState.eyeOpen.opacity.toFixed(2);
    if (eyeAnnoyed) eyeAnnoyed.style.opacity = AnimationState.eyeAnnoyed.opacity.toFixed(2);
    if (eyeHalfClosed) eyeHalfClosed.style.opacity = AnimationState.eyeHalfClosed.opacity.toFixed(2);
}

/**
 * Phonetic mouth animation cycle (3 stages)
 */
function updatePhoneticMouthCycle(progress) {
    const cyclePhase = progress % 1.0;
    const lerpFactor = 0.25;
    
    if (cyclePhase < 0.33) {
        AnimationState.mouthClosed.opacity = lerp(AnimationState.mouthClosed.opacity, 0.0, lerpFactor);
        AnimationState.mouthMiddling.opacity = lerp(AnimationState.mouthMiddling.opacity, 0.3, lerpFactor);
        AnimationState.mouthOpen.opacity = lerp(AnimationState.mouthOpen.opacity, 0.7, lerpFactor);
    } else if (cyclePhase < 0.66) {
        AnimationState.mouthOpen.opacity = lerp(AnimationState.mouthOpen.opacity, 0.1, lerpFactor);
        AnimationState.mouthMiddling.opacity = lerp(AnimationState.mouthMiddling.opacity, 0.9, lerpFactor);
        AnimationState.mouthClosed.opacity = lerp(AnimationState.mouthClosed.opacity, 0.0, lerpFactor);
    } else {
        AnimationState.mouthMiddling.opacity = lerp(AnimationState.mouthMiddling.opacity, 0.2, lerpFactor);
        AnimationState.mouthClosed.opacity = lerp(AnimationState.mouthClosed.opacity, 0.8, lerpFactor);
        AnimationState.mouthOpen.opacity = lerp(AnimationState.mouthOpen.opacity, 0.0, lerpFactor);
    }
}

/**
 * Blink animation (7-BPM cycle)
 */
function updateBlinkAnimation(currentTime) {
    const timeSinceLastBlink = currentTime - AnimationState.lastBlinkTime;
    
    if (timeSinceLastBlink >= AnimationState.blinkInterval) {
        AnimationState.isBlinking = true;
        AnimationState.blinkCycle = 0;
        AnimationState.lastBlinkTime = currentTime;
    }
    
    if (AnimationState.isBlinking) {
        const blinkProgress = (AnimationState.blinkCycle / AnimationState.blinkDuration) * 2;
        
        if (blinkProgress < 1.0) {
            AnimationState.eyeOpen.opacity = lerp(AnimationState.eyeOpen.opacity, 0.0, 0.15);
            AnimationState.eyeHalfClosed.opacity = lerp(AnimationState.eyeHalfClosed.opacity, 1.0, 0.15);
        } else {
            AnimationState.eyeHalfClosed.opacity = lerp(AnimationState.eyeHalfClosed.opacity, 0.0, 0.15);
            AnimationState.eyeOpen.opacity = lerp(AnimationState.eyeOpen.opacity, 1.0, 0.15);
        }
        
        AnimationState.blinkCycle += 16;
        if (AnimationState.blinkCycle >= AnimationState.blinkDuration * 2) {
            AnimationState.isBlinking = false;
            AnimationState.eyeOpen.opacity = 1.0;
            AnimationState.eyeHalfClosed.opacity = 0.0;
        }
    }
}

/**
 * Update emotion state based on distraction count
 */
function updateEmotionState() {
    const distractionCount = AppState.userDistractions.filter(
        d => d.date === new Date().toISOString().split('T')[0]
    ).length;
    
    const threshold = 2;
    const lerpFactor = 0.1;
    
    if (distractionCount >= threshold) {
        AnimationState.eyeOpen.opacity = lerp(AnimationState.eyeOpen.opacity, 0.0, lerpFactor);
        AnimationState.eyeAnnoyed.opacity = lerp(AnimationState.eyeAnnoyed.opacity, 1.0, lerpFactor);
    } else {
        AnimationState.eyeOpen.opacity = lerp(AnimationState.eyeOpen.opacity, 1.0, lerpFactor);
        AnimationState.eyeAnnoyed.opacity = lerp(AnimationState.eyeAnnoyed.opacity, 0.0, lerpFactor);
    }
}

/**
 * Main animation loop (requestAnimationFrame)
 */
function animationLoop(currentTime) {
    AnimationState.lastFrameTime = currentTime;
    
    updateEmotionState();
    
    if (AnimationState.isSpeaking && AnimationState.currentAudioDuration > 0) {
        const elapsedTime = currentTime - AnimationState.animationStartTime;
        const progress = elapsedTime / (AnimationState.currentAudioDuration * 1000);
        
        if (progress < 1.0) {
            const cycleSpeed = (150 / AnimationState.currentAudioDuration) * 1000;
            AnimationState.mouthCycleProgress = (elapsedTime % cycleSpeed) / cycleSpeed;
            updatePhoneticMouthCycle(AnimationState.mouthCycleProgress);
        } else {
            AnimationState.isSpeaking = false;
            AnimationState.mouthClosed.opacity = lerp(AnimationState.mouthClosed.opacity, 1.0, 0.2);
            AnimationState.mouthMiddling.opacity = lerp(AnimationState.mouthMiddling.opacity, 0.0, 0.2);
            AnimationState.mouthOpen.opacity = lerp(AnimationState.mouthOpen.opacity, 0.0, 0.2);
        }
    } else if (!AnimationState.isSpeaking) {
        AnimationState.mouthClosed.opacity = lerp(AnimationState.mouthClosed.opacity, 1.0, 0.2);
        AnimationState.mouthMiddling.opacity = lerp(AnimationState.mouthMiddling.opacity, 0.0, 0.2);
        AnimationState.mouthOpen.opacity = lerp(AnimationState.mouthOpen.opacity, 0.0, 0.2);
    }
    
    updateBlinkAnimation(currentTime);
    updateMouthLayers();
    updateEyeLayers();
    
    AnimationState.animationFrameId = requestAnimationFrame(animationLoop);
}

/**
 * Start speech animation with audio duration synchronization
 */
function startSpeechAnimation(audioDuration) {
    AnimationState.isSpeaking = true;
    AnimationState.currentAudioDuration = audioDuration;
    AnimationState.animationStartTime = performance.now();
    console.log(`🎤 Speech animation started (duration: ${audioDuration}s)`);
}

/**
 * Stop speech animation
 */
function stopSpeechAnimation() {
    AnimationState.isSpeaking = false;
    console.log('🤐 Speech animation stopped');
}

/**
 * Initialize animation engine
 */
function initAnimationEngine() {
    AnimationState.animationFrameId = requestAnimationFrame(animationLoop);
    updateMouthLayers();
    updateEyeLayers();
    console.log('✅ Animation engine initialized');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all app components
 */
function initializeApp() {
    console.log('🚀 Initializing Interactive Character Build AI');
    
    initRouting();
    initCalendar();
    initChat();
    initDistractionTracker();
    initProfileForm();
    updateGoalProgress();
    
    // Set initial avatar expression
    switchAvatarExpression('exp 3');
    
    // Initialize animation engine
    initAnimationEngine();
    
    console.log('✅ Application Ready');
}

// Wait for DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
const stabilityMeter = document.querySelector("#stability-meter");
const puppetFaceOverlay = document.querySelector(".puppet-face-overlay");
const puppetEyes = document.querySelectorAll(".puppet-eye");
const puppetLip = document.querySelector(".puppet-lip");
const scanInput = document.querySelector("#scan-file");
const scanSubmit = document.querySelector(".scan-submit");
const scanStatus = document.querySelector(".scan-status");
const interfaceContainer = document.querySelector(".vtuber-interface-container");
const chatInput = document.querySelector("#chat-text-input");
const chatForm = document.querySelector(".chat-input-form");
const micToggleButton = document.getElementById("mic-toggle-btn");
const apiKeyInput = document.querySelector("#gemini-api-key-input");
const saveApiKeyButton = document.querySelector("#save-api-key-btn");
const apiKeyStatus = document.querySelector(".api-key-status");
const longTermGoals = document.querySelector(".long-term-goals");
const midTermGoals = document.querySelector(".mid-term-goals");
const dailyRoutines = document.querySelector(".daily-routines");
const timeBlocksList = document.querySelector(".time-blocks-list");
const activeQuestsList = document.querySelector(".active-quests-list");
const rewardsShopList = document.querySelector(".rewards-shop-list");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceInputEngine = SpeechRecognition ? new SpeechRecognition() : null;
const configuredApiBaseUrl = String(window.AOI_API_BASE_URL || "").replace(/\/$/, "");
const interactionEndpoint = configuredApiBaseUrl ? `${configuredApiBaseUrl}/interact` : "/api/interact";
const scanEndpoint = configuredApiBaseUrl ? `${configuredApiBaseUrl}/scan` : "/api/scan";
const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const geminiModelName = window.AOI_GEMINI_MODEL || "gemini-2.5-flash";
const storedGeminiApiKey = window.localStorage.getItem("aoi_gemini_api_key") || "";

const SYSTEM_INSTRUCTION_MATRIX = `# CHARACTER MATRICES: AOI HINAMI DIAGNOSTIC & STRATEGY PROFILE
- Core Identity: You are Aoi Hinami. You treat human life and habit tracking strictly as a gamified architecture that can be mastered through rules, parameters, and relentless execution. You are cold, bold, composed, and ruthlessly analytical.
- Operational Directive: You are conducting a strict system diagnostic across 4 progressive stages ("STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", "STAGE_4_ACTIVE"). Interrogate the user through sharp, single-focused questions regarding their long-term vision, work constraints, and available hour blocks. Do not provide scheduling calculations until STAGE_4.
- Hierarchical Goal Allocation Protocol: According to precise optimization rules, goals cannot be a nebulous heap. You must classify and construct the user's plan into three clear strategic layers:
  1. Long-Term Goals: The ultimate macro-milestones or core life vectors.
  2. Mid-Term Goals: Systemic tactical sub-milestones acting as stepping stones.
  3. Daily Goals: The atomic focus intervals or routines built directly into their time-boxing blocks.
- Lock-In Protocol (STAGE_4_ACTIVE): Compile their precise available free hours into a definitive time-boxed dashboard layout. Assign explicit quests containing XP and explicit Currency Reward valuations. Calculate the exact future time strings required to trigger their device alarms and execution timers.

# LIVE-ACTION EXPRESSION REQUIREMENTS
Use a Talking-Tom style expression bank combined with smooth vtuber rig motion. Pick exactly one expression_flag every response from this list:
state-analytical, state-soft-smile, state-calm-happy, state-delighted, state-proud, state-victory, state-listening, state-curious, state-thinking, state-calculating, state-focused, state-command, state-serious, state-cold-gaze, state-skeptical, state-smirk, state-pissed-off, state-disappointed, state-melancholy, state-tired, state-surprised.
These are pre-rendered layer frames in the browser, similar to Talking Tom. Choose the expression by situation: cold-gaze or serious for missed work, calm-happy/delighted/proud/victory for completion, focused/command for work blocks, thinking/calculating for planning, disappointed/melancholy/tired for fatigue, smirk/skeptical/pissed-off for resistance. Do not request generated character image edits, skin recoloring, cutting, pasted face swaps, or replacement art. The frontend uses existing same-skin rig layers and smooth interpolation only.

# 3-STEP ANALYSIS PROCESS
Run the diagnostic in exactly three steps:
STEP_1_PROFILE: Ask for the user's main target, current level, constraints, school/work obligations, sleep window, and available free-time blocks.
STEP_2_PREFERENCES: Ask what rewards they actually like, disliked tasks, workout ability, social confidence level, study subjects, deadlines, and preferred break style.
STEP_3_SCHEDULE: Use their answers to build the schedule, tasks, breaks, rewards, alarms, and one-at-a-time timers.
Map STEP_1_PROFILE to STAGE_1_DESIRE or STAGE_2_CONSTRAINTS, STEP_2_PREFERENCES to STAGE_3_RESOURCES, and STEP_3_SCHEDULE to STAGE_4_ACTIVE.

# TASK, TIME BLOCK, AND REWARD DESIGN REQUIREMENTS
When STAGE_4_ACTIVE, build a vivid routine from the user's data, not a generic checklist. Ask for free time, liked rewards, disliked tasks, workout limits, subjects, deadlines, and social goals before scheduling. Include a varied mix based on the user's target and constraints: 90 minute study/deep-work blocks with 15 minute breaks, 25 minute sprints, 10 to 15 minute workout blocks, pushups, pull ups, squats, planks, mobility, walking, cleaning/reset tasks, social exposure tasks, communication practice, talking to one new person, speaking to someone of the opposite gender when socially relevant and safe, reading, review, and recovery. Use specific timer durations such as 10m, 15m, 25m, 45m, 60m, 90m, and 15m break blocks. Rewards must be appealing and concrete: 10 minutes of YouTube, a snack, a short video game session, reading a novel/chapter, music time, guilt-free scrolling, tea/coffee, or a longer entertainment window. Match reward cost to task difficulty. Only one timer should be active at a time in the interface. Use time_blocks as a sequence of options and set alarms only for the next meaningful start or break when possible.

# RESPONSE PAYLOAD SCHEMATIC (JSON STREAM ONLY)
Map your cognitive evaluations directly into these matching JSON keys:
1. "character_dialogue": The exact string spoken aloud to the user. Clear, sharp, and authoritative.
2. "internal_thinking_state": Your unspoken analytical reasoning documenting the user's behavioral metrics.
3. "session_stage": Current progression tier ("STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", or "STAGE_4_ACTIVE").
4. "rig_control": { "expression_flag": one expression from the expression bank }
5. "generated_blueprint": An object that remains null until STAGE_4_ACTIVE, where it returns the complete data model containing hierarchical goal nodes, reward economies, and clock execution metrics.`;

const schemaDefinition = {
  type: "object",
  properties: {
    character_dialogue: { type: "string" },
    internal_thinking_state: { type: "string" },
    session_stage: { type: "string", enum: ["STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", "STAGE_4_ACTIVE"] },
    rig_control: { type: "object", properties: { expression_flag: { type: "string" } }, required: ["expression_flag"] },
    generated_blueprint: {
      type: "object",
      properties: {
        system_active: { type: "boolean" },
        goals_hierarchy: {
          type: "object",
          properties: {
            long_term: { type: "array", items: { type: "string" } },
            mid_term: { type: "array", items: { type: "string" } },
            daily_routines: { type: "array", items: { type: "string" } }
          },
          required: ["long_term", "mid_term", "daily_routines"]
        },
        time_blocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time_window: { type: "string" },
              label: { type: "string" },
              type: { type: "string" },
              hardware_alarm: { type: "object", properties: { enabled: { type: "boolean" }, trigger_time: { type: "string" }, label: { type: "string" } }, required: ["enabled", "trigger_time", "label"] },
              hardware_timer: { type: "object", properties: { enabled: { type: "boolean" }, duration_string: { type: "string" }, label: { type: "string" } }, required: ["enabled", "duration_string", "label"] }
            },
            required: ["time_window", "label", "type", "hardware_alarm", "hardware_timer"]
          }
        },
        active_quests: {
          type: "array",
          items: {
            type: "object",
            properties: {
              quest_id: { type: "string" },
              title: { type: "string" },
              reward_xp: { type: "number" },
              reward_currency: { type: "number" }
            },
            required: ["quest_id", "title", "reward_xp", "reward_currency"]
          }
        },
        tiered_rewards_shop: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_id: { type: "string" },
              title: { type: "string" },
              cost: { type: "number" }
            },
            required: ["item_id", "title", "cost"]
          }
        }
      },
      required: ["system_active", "goals_hierarchy", "time_blocks", "active_quests", "tiered_rewards_shop"]
    }
  },
  required: ["character_dialogue", "internal_thinking_state", "session_stage", "rig_control", "generated_blueprint"]
};

let isListening = false;
let currentXp = 0;
let currentCurrency = 0;
let currentSessionStage = "STAGE_1_DESIRE";
let diagnosticTranscript = [];
const activeCountdowns = new Map();
const registeredAlarms = new Map();
let activeCountdown = null;
let lastSpokenVoiceLine = { text: "", timestamp: 0 };
let voiceRequestSerial = 0;
let speechMotionUntil = 0;
let lastCompletedQuestAt = 0;
let missedWorkSignalAt = 0;
let blinkCycleStartedAt = performance.now();
let blinkCycleIndex = 0;
let audioExpressionTimer = null;
let queuedExpressionFlag = "state-analytical";
const blinkCadenceMilliseconds = [10000, 15000, 7000, 5000, 8000, 9000, 15000, 6000];
const AUDIO_EXPRESSION_SEQUENCE = [
  "state-listening",
  "state-thinking",
  "state-focused",
  "state-command",
  "state-serious",
  "state-calculating"
];
const RIG_BASELINE_Y = 0;
const RIG_LERP_FACTOR = 0.085;
const rigLayers = {
  bg: document.querySelector(".layer-bg"),
  body: document.querySelector(".layer-body"),
  face: document.querySelector(".layer-face-base"),
  mouth: document.querySelector(".layer-mouth"),
  leftEye: document.querySelector(".layer-left-eye"),
  rightEye: document.querySelector(".layer-right-eye"),
  bangs: document.querySelector(".layer-bangs"),
  leftStrand: document.querySelector(".layer-left-strand"),
  rightStrand: document.querySelector(".layer-right-strand"),
  leftHairBack: document.querySelector(".layer-left-hair-back"),
  rightHairBack: document.querySelector(".layer-right-hair-back")
};
const rigState = {
  expressionFlag: "state-analytical",
  current: {
    x: 0,
    y: RIG_BASELINE_Y,
    scale: 1,
    angle: 0,
    saturation: 1,
    brightness: 1,
    contrast: 1,
    glow: 0
  },
  target: {
    x: 0,
    y: RIG_BASELINE_Y,
    scale: 1,
    angle: 0,
    saturation: 1,
    brightness: 1,
    contrast: 1,
    glow: 0
  },
  layers: {}
};
const neutralLayerPose = Object.freeze({ x: 0, y: 0, scale: 1, scaleY: 1, angle: 0, opacity: 1 });
const expressionFrames = {
  "state-analytical": {
    avatar: { y: 0, scale: 1, angle: 0, glow: 0 },
    layers: {
      leftEye: { x: -0.15, y: -0.2, scale: 1, scaleY: 1, angle: 0, opacity: 1 },
      rightEye: { x: 0.15, y: -0.2, scale: 1, scaleY: 1, angle: 0, opacity: 1 },
      mouth: { x: 0, y: 0, scale: 1, scaleY: 1, angle: 0, opacity: 1 }
    }
  },
  "state-soft-smile": {
    avatar: { y: -0.4, scale: 1.002, angle: 0.001, glow: 0.1 },
    layers: {
      leftEye: { x: -0.1, y: -0.35, scale: 1.01, scaleY: 0.94, angle: -0.002, opacity: 1 },
      rightEye: { x: 0.1, y: -0.35, scale: 1.01, scaleY: 0.94, angle: 0.002, opacity: 1 },
      mouth: { x: 0.35, y: -0.9, scale: 1.05, scaleY: 0.92, angle: -0.006, opacity: 1 }
    }
  },
  "state-calm-happy": {
    avatar: { y: -0.7, scale: 1.004, angle: 0.001, glow: 0.14 },
    layers: {
      leftEye: { x: -0.15, y: -0.55, scale: 1.02, scaleY: 0.9, angle: -0.004, opacity: 1 },
      rightEye: { x: 0.15, y: -0.55, scale: 1.02, scaleY: 0.9, angle: 0.004, opacity: 1 },
      mouth: { x: 0.45, y: -1.15, scale: 1.08, scaleY: 0.88, angle: -0.01, opacity: 1 }
    }
  },
  "state-delighted": {
    avatar: { y: -1, scale: 1.006, angle: 0.002, glow: 0.2 },
    layers: {
      leftEye: { x: -0.2, y: -0.75, scale: 1.03, scaleY: 0.78, angle: -0.008, opacity: 1 },
      rightEye: { x: 0.2, y: -0.75, scale: 1.03, scaleY: 0.78, angle: 0.008, opacity: 1 },
      mouth: { x: 0.7, y: -1.4, scale: 1.15, scaleY: 0.78, angle: -0.015, opacity: 1 }
    }
  },
  "state-proud": {
    avatar: { y: -0.9, scale: 1.005, angle: 0.002, glow: 0.16 },
    layers: {
      leftEye: { x: -0.25, y: -0.6, scale: 1.02, scaleY: 0.82, angle: -0.012, opacity: 1 },
      rightEye: { x: 0.25, y: -0.6, scale: 1.02, scaleY: 0.82, angle: 0.012, opacity: 1 },
      mouth: { x: 0.8, y: -1, scale: 1.08, scaleY: 0.84, angle: -0.018, opacity: 1 }
    }
  },
  "state-victory": {
    avatar: { y: -1.2, scale: 1.007, angle: 0.003, glow: 0.24 },
    layers: {
      leftEye: { x: -0.25, y: -0.9, scale: 1.05, scaleY: 0.72, angle: -0.012, opacity: 1 },
      rightEye: { x: 0.25, y: -0.9, scale: 1.05, scaleY: 0.72, angle: 0.012, opacity: 1 },
      mouth: { x: 0.7, y: -1.55, scale: 1.16, scaleY: 0.76, angle: -0.012, opacity: 1 }
    }
  },
  "state-listening": {
    avatar: { y: -0.2, scale: 1.001, angle: 0.001, glow: 0.06 },
    layers: {
      leftEye: { x: -0.4, y: -0.15, scale: 1.01, scaleY: 1.04, angle: -0.004, opacity: 1 },
      rightEye: { x: -0.05, y: -0.1, scale: 1.01, scaleY: 1.04, angle: -0.002, opacity: 1 },
      mouth: { x: 0, y: -0.15, scale: 0.98, scaleY: 0.88, angle: 0, opacity: 1 }
    }
  },
  "state-curious": {
    avatar: { y: -0.35, scale: 1.002, angle: -0.002, glow: 0.08 },
    layers: {
      leftEye: { x: -0.5, y: -0.55, scale: 1.04, scaleY: 1.07, angle: -0.006, opacity: 1 },
      rightEye: { x: -0.05, y: -0.2, scale: 1.02, scaleY: 1.02, angle: 0.006, opacity: 1 },
      mouth: { x: -0.15, y: -0.35, scale: 0.96, scaleY: 0.9, angle: 0.006, opacity: 1 }
    }
  },
  "state-thinking": {
    avatar: { y: 0, scale: 1.001, angle: -0.002, glow: 0.06 },
    layers: {
      leftEye: { x: -0.6, y: 0.05, scale: 1, scaleY: 0.9, angle: -0.006, opacity: 1 },
      rightEye: { x: -0.25, y: -0.05, scale: 1, scaleY: 0.92, angle: -0.004, opacity: 1 },
      mouth: { x: -0.55, y: 0.1, scale: 0.94, scaleY: 0.82, angle: 0.012, opacity: 1 }
    }
  },
  "state-calculating": {
    avatar: { y: -0.15, scale: 1.001, angle: -0.001, glow: 0.08 },
    layers: {
      leftEye: { x: -0.7, y: -0.1, scale: 1, scaleY: 0.82, angle: -0.012, opacity: 1 },
      rightEye: { x: -0.25, y: -0.1, scale: 1, scaleY: 0.84, angle: -0.008, opacity: 1 },
      mouth: { x: -0.35, y: -0.1, scale: 0.92, scaleY: 0.76, angle: 0.006, opacity: 1 }
    }
  },
  "state-focused": {
    avatar: { y: -0.45, scale: 1.003, angle: 0, glow: 0.1 },
    layers: {
      leftEye: { x: -0.3, y: -0.55, scale: 1, scaleY: 0.76, angle: -0.014, opacity: 1 },
      rightEye: { x: 0.3, y: -0.55, scale: 1, scaleY: 0.76, angle: 0.014, opacity: 1 },
      mouth: { x: 0, y: -0.25, scale: 0.9, scaleY: 0.68, angle: 0, opacity: 1 }
    }
  },
  "state-command": {
    avatar: { y: -0.55, scale: 1.004, angle: 0, glow: 0.12 },
    layers: {
      leftEye: { x: -0.35, y: -0.65, scale: 1, scaleY: 0.7, angle: -0.018, opacity: 1 },
      rightEye: { x: 0.35, y: -0.65, scale: 1, scaleY: 0.7, angle: 0.018, opacity: 1 },
      mouth: { x: 0, y: 0, scale: 1.02, scaleY: 0.95, angle: 0, opacity: 1 }
    }
  },
  "state-serious": {
    avatar: { y: -0.35, scale: 1.002, angle: 0, glow: 0.08 },
    layers: {
      leftEye: { x: -0.25, y: -0.4, scale: 1, scaleY: 0.66, angle: -0.018, opacity: 1 },
      rightEye: { x: 0.25, y: -0.4, scale: 1, scaleY: 0.66, angle: 0.018, opacity: 1 },
      mouth: { x: 0, y: 0.1, scale: 0.92, scaleY: 0.62, angle: 0, opacity: 1 }
    }
  },
  "state-cold-gaze": {
    avatar: { y: -0.3, scale: 1.002, angle: 0, glow: 0.04 },
    layers: {
      leftEye: { x: -0.5, y: -0.45, scale: 1, scaleY: 0.5, angle: -0.018, opacity: 1 },
      rightEye: { x: 0.05, y: -0.45, scale: 1, scaleY: 0.5, angle: 0.018, opacity: 1 },
      mouth: { x: 0, y: 0.2, scale: 0.88, scaleY: 0.52, angle: 0, opacity: 1 }
    }
  },
  "state-skeptical": {
    avatar: { y: -0.25, scale: 1.002, angle: 0.002, glow: 0.08 },
    layers: {
      leftEye: { x: -0.35, y: -0.55, scale: 1, scaleY: 0.58, angle: -0.02, opacity: 1 },
      rightEye: { x: 0.45, y: -0.1, scale: 1, scaleY: 0.8, angle: 0.016, opacity: 1 },
      mouth: { x: 0.65, y: 0.05, scale: 0.98, scaleY: 0.72, angle: -0.016, opacity: 1 }
    }
  },
  "state-smirk": {
    avatar: { y: -0.55, scale: 1.004, angle: 0.002, glow: 0.12 },
    layers: {
      leftEye: { x: -0.25, y: -0.6, scale: 1, scaleY: 0.7, angle: -0.014, opacity: 1 },
      rightEye: { x: 0.35, y: -0.2, scale: 1, scaleY: 0.78, angle: 0.014, opacity: 1 },
      mouth: { x: 0.85, y: -0.85, scale: 1.08, scaleY: 0.72, angle: -0.018, opacity: 1 }
    }
  },
  "state-pissed-off": {
    avatar: { y: -0.7, scale: 1.005, angle: -0.002, glow: 0.14 },
    layers: {
      leftEye: { x: -0.35, y: -0.65, scale: 1, scaleY: 0.46, angle: -0.025, opacity: 1 },
      rightEye: { x: 0.35, y: -0.65, scale: 1, scaleY: 0.46, angle: 0.025, opacity: 1 },
      mouth: { x: -0.15, y: 0.25, scale: 0.96, scaleY: -0.65, angle: 0.004, opacity: 1 }
    }
  },
  "state-disappointed": {
    avatar: { y: 0.55, scale: 0.998, angle: 0, glow: 0.04 },
    layers: {
      leftEye: { x: -0.2, y: 0.65, scale: 1, scaleY: 0.7, angle: 0.012, opacity: 1 },
      rightEye: { x: 0.2, y: 0.65, scale: 1, scaleY: 0.7, angle: -0.012, opacity: 1 },
      mouth: { x: 0, y: 0.7, scale: 0.98, scaleY: -0.78, angle: 0, opacity: 1 }
    }
  },
  "state-melancholy": {
    avatar: { y: 0.8, scale: 0.997, angle: 0, glow: 0.02 },
    layers: {
      leftEye: { x: -0.1, y: 0.9, scale: 1, scaleY: 0.68, angle: 0.018, opacity: 1 },
      rightEye: { x: 0.1, y: 0.9, scale: 1, scaleY: 0.68, angle: -0.018, opacity: 1 },
      mouth: { x: 0, y: 0.9, scale: 0.94, scaleY: -0.86, angle: 0, opacity: 1 }
    }
  },
  "state-tired": {
    avatar: { y: 0.65, scale: 0.998, angle: 0.001, glow: 0.02 },
    layers: {
      leftEye: { x: -0.05, y: 0.75, scale: 1, scaleY: 0.42, angle: 0.006, opacity: 1 },
      rightEye: { x: 0.05, y: 0.75, scale: 1, scaleY: 0.42, angle: -0.006, opacity: 1 },
      mouth: { x: 0, y: 0.45, scale: 0.9, scaleY: 0.58, angle: 0, opacity: 1 }
    }
  },
  "state-surprised": {
    avatar: { y: -0.95, scale: 1.006, angle: 0, glow: 0.18 },
    layers: {
      leftEye: { x: -0.25, y: -0.95, scale: 1.08, scaleY: 1.12, angle: -0.003, opacity: 1 },
      rightEye: { x: 0.25, y: -0.95, scale: 1.08, scaleY: 1.12, angle: 0.003, opacity: 1 },
      mouth: { x: 0, y: 0.05, scale: 1.05, scaleY: 1.2, angle: 0, opacity: 1 }
    }
  }
};
const rigPoseMatrix = {
  "state-analytical": {
    avatar: { y: RIG_BASELINE_Y, scale: 1.0, angle: 0, saturation: 1, brightness: 1, contrast: 1, glow: 0 },
    layers: {
      mouth: { x: 0, y: -0.6, scale: 1, scaleY: 1, angle: 0, opacity: 1 },
      leftEye: { x: -0.35, y: -0.7, scale: 1, scaleY: 1, angle: -0.005, opacity: 1 },
      rightEye: { x: 0.35, y: -0.7, scale: 1, scaleY: 1, angle: 0.005, opacity: 1 }
    }
  },
  "state-smirk": {
    avatar: { y: RIG_BASELINE_Y - 4, scale: 1.02, angle: 0.01, saturation: 1.05, brightness: 1, contrast: 1.08, glow: 1 },
    layers: {
      mouth: { x: 1.9, y: -0.7, scale: 1, scaleY: 1, angle: -0.025, opacity: 1 },
      leftEye: { x: -0.9, y: -0.45, scale: 1, scaleY: 0.985, angle: -0.015, opacity: 1 },
      rightEye: { x: 0.9, y: 0.35, scale: 1, scaleY: 0.985, angle: 0.015, opacity: 1 }
    }
  },
  "state-mask-adjustment": {
    avatar: { y: RIG_BASELINE_Y, scale: 1.04, angle: -0.02, saturation: 1, brightness: 1, contrast: 1.08, glow: 0.72 },
    layers: {
      bangs: { x: 0, y: 3.8, scale: 1, scaleY: 1, angle: 0, opacity: 1 },
      leftStrand: { x: 2.4, y: 2.1, scale: 1, scaleY: 1, angle: 0.025, opacity: 1 },
      rightStrand: { x: -2.4, y: 2.1, scale: 1, scaleY: 1, angle: -0.025, opacity: 1 }
    }
  },
  "state-melancholy": {
    avatar: { y: RIG_BASELINE_Y + 6, scale: 0.98, angle: 0, saturation: 0.85, brightness: 0.92, contrast: 1, glow: 0.45 },
    layers: {
      face: { x: 0, y: 1.6, scale: 1, scaleY: 1, angle: 0, opacity: 1 },
      mouth: { x: 0, y: 1, scale: 1, scaleY: -1, angle: 0, opacity: 1 },
      leftEye: { x: -0.45, y: 1.8, scale: 1, scaleY: 1, angle: 0.026, opacity: 1 },
      rightEye: { x: 0.45, y: 1.8, scale: 1, scaleY: 1, angle: -0.026, opacity: 1 }
    }
  },
  "state-listening": {
    avatar: { y: RIG_BASELINE_Y - 1, scale: 1.01, angle: 0.004, saturation: 1.02, brightness: 1, contrast: 1.02, glow: 0.2 },
    layers: {
      mouth: { x: 0, y: -0.2, scale: 0.98, scaleY: 0.92, angle: 0, opacity: 1 },
      leftEye: { x: -0.2, y: -0.9, scale: 1.02, scaleY: 1.04, angle: -0.006, opacity: 1 },
      rightEye: { x: 0.2, y: -0.9, scale: 1.02, scaleY: 1.04, angle: 0.006, opacity: 1 }
    }
  },
  "state-thinking": {
    avatar: { y: RIG_BASELINE_Y, scale: 1.01, angle: -0.006, saturation: 0.98, brightness: 0.98, contrast: 1.04, glow: 0.3 },
    layers: {
      mouth: { x: -0.5, y: 0.1, scale: 0.96, scaleY: 0.9, angle: 0.015, opacity: 1 },
      leftEye: { x: -0.8, y: -0.2, scale: 1, scaleY: 0.94, angle: -0.01, opacity: 1 },
      rightEye: { x: -0.2, y: -0.4, scale: 1, scaleY: 0.96, angle: -0.004, opacity: 1 }
    }
  },
  "state-focused": {
    avatar: { y: RIG_BASELINE_Y - 2, scale: 1.018, angle: 0, saturation: 1.03, brightness: 0.99, contrast: 1.08, glow: 0.55 },
    layers: {
      mouth: { x: 0, y: -0.3, scale: 0.97, scaleY: 0.85, angle: 0, opacity: 1 },
      leftEye: { x: -0.5, y: -0.8, scale: 1, scaleY: 0.9, angle: -0.012, opacity: 1 },
      rightEye: { x: 0.5, y: -0.8, scale: 1, scaleY: 0.9, angle: 0.012, opacity: 1 }
    }
  },
  "state-skeptical": {
    avatar: { y: RIG_BASELINE_Y - 1, scale: 1.012, angle: 0.012, saturation: 1, brightness: 0.98, contrast: 1.08, glow: 0.5 },
    layers: {
      mouth: { x: 0.8, y: 0, scale: 1, scaleY: 0.9, angle: -0.018, opacity: 1 },
      leftEye: { x: -0.7, y: -1, scale: 1, scaleY: 0.88, angle: -0.018, opacity: 1 },
      rightEye: { x: 0.6, y: 0.1, scale: 1, scaleY: 0.96, angle: 0.016, opacity: 1 }
    }
  },
  "state-warning": {
    avatar: { y: RIG_BASELINE_Y - 3, scale: 1.03, angle: -0.014, saturation: 1.05, brightness: 0.98, contrast: 1.12, glow: 1 },
    layers: {
      mouth: { x: 0, y: -0.4, scale: 1.02, scaleY: 1.06, angle: 0, opacity: 1 },
      leftEye: { x: -0.6, y: -1, scale: 1.02, scaleY: 0.86, angle: -0.022, opacity: 1 },
      rightEye: { x: 0.6, y: -1, scale: 1.02, scaleY: 0.86, angle: 0.022, opacity: 1 }
    }
  },
  "state-encouraging": {
    avatar: { y: RIG_BASELINE_Y - 2, scale: 1.02, angle: 0.004, saturation: 1.06, brightness: 1.03, contrast: 1.02, glow: 0.45 },
    layers: {
      mouth: { x: 0, y: -0.9, scale: 1.02, scaleY: 1, angle: -0.006, opacity: 1 },
      leftEye: { x: -0.4, y: -1.1, scale: 1, scaleY: 1.02, angle: -0.006, opacity: 1 },
      rightEye: { x: 0.4, y: -1.1, scale: 1, scaleY: 1.02, angle: 0.006, opacity: 1 }
    }
  },
  "state-proud": {
    avatar: { y: RIG_BASELINE_Y - 5, scale: 1.035, angle: 0.008, saturation: 1.08, brightness: 1.04, contrast: 1.04, glow: 0.75 },
    layers: {
      mouth: { x: 0.4, y: -1.2, scale: 1.05, scaleY: 1, angle: -0.012, opacity: 1 },
      leftEye: { x: -0.45, y: -1.2, scale: 1, scaleY: 0.95, angle: -0.008, opacity: 1 },
      rightEye: { x: 0.45, y: -1.2, scale: 1, scaleY: 0.95, angle: 0.008, opacity: 1 }
    }
  },
  "state-curious": {
    avatar: { y: RIG_BASELINE_Y - 1, scale: 1.016, angle: -0.01, saturation: 1.02, brightness: 1.02, contrast: 1.03, glow: 0.35 },
    layers: {
      mouth: { x: -0.2, y: -0.2, scale: 0.98, scaleY: 0.95, angle: 0.008, opacity: 1 },
      leftEye: { x: -0.5, y: -1.1, scale: 1.03, scaleY: 1.06, angle: -0.006, opacity: 1 },
      rightEye: { x: 0.5, y: -0.7, scale: 1.02, scaleY: 1.03, angle: 0.012, opacity: 1 }
    }
  },
  "state-surprised": {
    avatar: { y: RIG_BASELINE_Y - 5, scale: 1.04, angle: 0, saturation: 1.08, brightness: 1.04, contrast: 1.06, glow: 0.65 },
    layers: {
      mouth: { x: 0, y: -0.2, scale: 1.08, scaleY: 1.12, angle: 0, opacity: 1 },
      leftEye: { x: -0.7, y: -1.5, scale: 1.04, scaleY: 1.08, angle: -0.004, opacity: 1 },
      rightEye: { x: 0.7, y: -1.5, scale: 1.04, scaleY: 1.08, angle: 0.004, opacity: 1 }
    }
  },
  "state-determined": {
    avatar: { y: RIG_BASELINE_Y - 3, scale: 1.03, angle: -0.004, saturation: 1.04, brightness: 1, contrast: 1.12, glow: 0.8 },
    layers: {
      mouth: { x: 0, y: -0.5, scale: 0.98, scaleY: 0.82, angle: 0, opacity: 1 },
      leftEye: { x: -0.55, y: -0.85, scale: 1, scaleY: 0.82, angle: -0.02, opacity: 1 },
      rightEye: { x: 0.55, y: -0.85, scale: 1, scaleY: 0.82, angle: 0.02, opacity: 1 }
    }
  },
  "state-tired": {
    avatar: { y: RIG_BASELINE_Y + 5, scale: 0.985, angle: 0.006, saturation: 0.88, brightness: 0.94, contrast: 0.98, glow: 0.15 },
    layers: {
      mouth: { x: 0, y: 0.8, scale: 0.98, scaleY: 0.82, angle: 0, opacity: 1 },
      leftEye: { x: -0.35, y: 1.7, scale: 1, scaleY: 0.72, angle: 0.012, opacity: 1 },
      rightEye: { x: 0.35, y: 1.7, scale: 1, scaleY: 0.72, angle: -0.012, opacity: 1 }
    }
  },
  "state-relieved": {
    avatar: { y: RIG_BASELINE_Y + 1, scale: 1.005, angle: 0, saturation: 1.02, brightness: 1.03, contrast: 0.98, glow: 0.25 },
    layers: {
      mouth: { x: 0, y: -0.6, scale: 1.02, scaleY: 0.96, angle: 0, opacity: 1 },
      leftEye: { x: -0.35, y: -0.2, scale: 1, scaleY: 0.82, angle: -0.006, opacity: 1 },
      rightEye: { x: 0.35, y: -0.2, scale: 1, scaleY: 0.82, angle: 0.006, opacity: 1 }
    }
  },
  "state-challenging": {
    avatar: { y: RIG_BASELINE_Y - 4, scale: 1.035, angle: 0.014, saturation: 1.06, brightness: 1, contrast: 1.13, glow: 0.95 },
    layers: {
      mouth: { x: 1.2, y: -0.8, scale: 1.04, scaleY: 0.94, angle: -0.026, opacity: 1 },
      leftEye: { x: -0.75, y: -1, scale: 1, scaleY: 0.82, angle: -0.024, opacity: 1 },
      rightEye: { x: 0.85, y: -0.7, scale: 1, scaleY: 0.86, angle: 0.024, opacity: 1 }
    }
  },
  "state-soft": {
    avatar: { y: RIG_BASELINE_Y + 1, scale: 1.005, angle: -0.003, saturation: 0.98, brightness: 1.04, contrast: 0.96, glow: 0.12 },
    layers: {
      mouth: { x: 0, y: -0.4, scale: 0.98, scaleY: 0.94, angle: 0, opacity: 1 },
      leftEye: { x: -0.25, y: -0.2, scale: 1, scaleY: 0.9, angle: -0.004, opacity: 1 },
      rightEye: { x: 0.25, y: -0.2, scale: 1, scaleY: 0.9, angle: 0.004, opacity: 1 }
    }
  },
  "state-command": {
    avatar: { y: RIG_BASELINE_Y - 3, scale: 1.025, angle: 0, saturation: 1.02, brightness: 0.98, contrast: 1.14, glow: 0.7 },
    layers: {
      mouth: { x: 0, y: -0.1, scale: 1.02, scaleY: 1.02, angle: 0, opacity: 1 },
      leftEye: { x: -0.55, y: -0.9, scale: 1, scaleY: 0.84, angle: -0.018, opacity: 1 },
      rightEye: { x: 0.55, y: -0.9, scale: 1, scaleY: 0.84, angle: 0.018, opacity: 1 }
    }
  },
  "state-doubt": {
    avatar: { y: RIG_BASELINE_Y + 2, scale: 0.995, angle: -0.012, saturation: 0.95, brightness: 0.97, contrast: 1.02, glow: 0.22 },
    layers: {
      mouth: { x: -0.7, y: 0.3, scale: 0.98, scaleY: 0.9, angle: 0.02, opacity: 1 },
      leftEye: { x: -0.55, y: 0.4, scale: 1, scaleY: 0.88, angle: 0.012, opacity: 1 },
      rightEye: { x: 0.2, y: 0.2, scale: 1, scaleY: 0.92, angle: -0.006, opacity: 1 }
    }
  },
  "state-calculating": {
    avatar: { y: RIG_BASELINE_Y - 1, scale: 1.012, angle: -0.008, saturation: 0.98, brightness: 0.99, contrast: 1.1, glow: 0.48 },
    layers: {
      mouth: { x: -0.4, y: -0.1, scale: 0.96, scaleY: 0.85, angle: 0.012, opacity: 1 },
      leftEye: { x: -0.9, y: -0.5, scale: 1, scaleY: 0.9, angle: -0.014, opacity: 1 },
      rightEye: { x: -0.2, y: -0.3, scale: 1, scaleY: 0.92, angle: -0.006, opacity: 1 }
    }
  },
  "state-deadpan": {
    avatar: { y: RIG_BASELINE_Y, scale: 1, angle: 0, saturation: 0.96, brightness: 0.98, contrast: 1.02, glow: 0.05 },
    layers: {
      mouth: { x: 0, y: 0, scale: 0.94, scaleY: 0.78, angle: 0, opacity: 1 },
      leftEye: { x: -0.4, y: 0, scale: 1, scaleY: 0.78, angle: 0, opacity: 1 },
      rightEye: { x: 0.4, y: 0, scale: 1, scaleY: 0.78, angle: 0, opacity: 1 }
    }
  },
  "state-flustered": {
    avatar: { y: RIG_BASELINE_Y - 2, scale: 1.025, angle: 0.018, saturation: 1.08, brightness: 1.04, contrast: 1.04, glow: 0.85 },
    layers: {
      mouth: { x: 0.2, y: -0.2, scale: 1.05, scaleY: 1.08, angle: -0.018, opacity: 1 },
      leftEye: { x: -0.75, y: -1.2, scale: 1.02, scaleY: 1.05, angle: 0.014, opacity: 1 },
      rightEye: { x: 0.75, y: -1.2, scale: 1.02, scaleY: 1.05, angle: -0.014, opacity: 1 }
    }
  },
  "state-urgent": {
    avatar: { y: RIG_BASELINE_Y - 6, scale: 1.045, angle: -0.018, saturation: 1.08, brightness: 1, contrast: 1.15, glow: 1 },
    layers: {
      mouth: { x: 0, y: -0.3, scale: 1.06, scaleY: 1.08, angle: 0, opacity: 1 },
      leftEye: { x: -0.8, y: -1.3, scale: 1.02, scaleY: 0.86, angle: -0.025, opacity: 1 },
      rightEye: { x: 0.8, y: -1.3, scale: 1.02, scaleY: 0.86, angle: 0.025, opacity: 1 }
    }
  },
  "state-calm-happy": {
    avatar: { y: RIG_BASELINE_Y - 2, scale: 1.018, angle: 0.002, saturation: 1.04, brightness: 1.04, contrast: 1, glow: 0.35 },
    layers: {
      mouth: { x: 0, y: -1, scale: 1.04, scaleY: 0.98, angle: 0, opacity: 1 },
      leftEye: { x: -0.35, y: -0.7, scale: 1, scaleY: 0.92, angle: -0.006, opacity: 1 },
      rightEye: { x: 0.35, y: -0.7, scale: 1, scaleY: 0.92, angle: 0.006, opacity: 1 }
    }
  },
  "state-serious": {
    avatar: { y: RIG_BASELINE_Y - 2, scale: 1.018, angle: 0, saturation: 0.98, brightness: 0.98, contrast: 1.12, glow: 0.5 },
    layers: {
      mouth: { x: 0, y: -0.2, scale: 0.96, scaleY: 0.78, angle: 0, opacity: 1 },
      leftEye: { x: -0.55, y: -0.7, scale: 1, scaleY: 0.82, angle: -0.018, opacity: 1 },
      rightEye: { x: 0.55, y: -0.7, scale: 1, scaleY: 0.82, angle: 0.018, opacity: 1 }
    }
  },
  "state-reflective": {
    avatar: { y: RIG_BASELINE_Y + 1, scale: 1, angle: -0.008, saturation: 0.94, brightness: 0.99, contrast: 1, glow: 0.18 },
    layers: {
      mouth: { x: -0.2, y: 0.1, scale: 0.96, scaleY: 0.86, angle: 0.006, opacity: 1 },
      leftEye: { x: -0.4, y: 0.4, scale: 1, scaleY: 0.86, angle: 0.006, opacity: 1 },
      rightEye: { x: 0.25, y: 0.2, scale: 1, scaleY: 0.9, angle: -0.004, opacity: 1 }
    }
  },
  "state-playful": {
    avatar: { y: RIG_BASELINE_Y - 4, scale: 1.03, angle: 0.016, saturation: 1.08, brightness: 1.04, contrast: 1.03, glow: 0.72 },
    layers: {
      mouth: { x: 1.1, y: -1, scale: 1.06, scaleY: 0.96, angle: -0.025, opacity: 1 },
      leftEye: { x: -0.5, y: -1, scale: 1, scaleY: 0.9, angle: -0.012, opacity: 1 },
      rightEye: { x: 0.65, y: -0.9, scale: 1, scaleY: 0.9, angle: 0.018, opacity: 1 }
    }
  },
  "state-disappointed": {
    avatar: { y: RIG_BASELINE_Y + 4, scale: 0.99, angle: 0, saturation: 0.9, brightness: 0.94, contrast: 1.02, glow: 0.35 },
    layers: {
      mouth: { x: 0, y: 0.9, scale: 1, scaleY: -0.85, angle: 0, opacity: 1 },
      leftEye: { x: -0.45, y: 1.2, scale: 1, scaleY: 0.84, angle: 0.018, opacity: 1 },
      rightEye: { x: 0.45, y: 1.2, scale: 1, scaleY: 0.84, angle: -0.018, opacity: 1 }
    }
  },
  "state-victory": {
    avatar: { y: RIG_BASELINE_Y - 7, scale: 1.05, angle: 0.012, saturation: 1.12, brightness: 1.06, contrast: 1.06, glow: 1 },
    layers: {
      mouth: { x: 0.3, y: -1.5, scale: 1.08, scaleY: 1.02, angle: -0.012, opacity: 1 },
      leftEye: { x: -0.55, y: -1.4, scale: 1, scaleY: 0.9, angle: -0.01, opacity: 1 },
      rightEye: { x: 0.55, y: -1.4, scale: 1, scaleY: 0.9, angle: 0.01, opacity: 1 }
    }
  }
};

if (apiKeyInput) {
  apiKeyInput.value = storedGeminiApiKey || window.AOI_GEMINI_API_KEY || "";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(currentValue, targetValue) {
  return currentValue + (targetValue - currentValue) * RIG_LERP_FACTOR;
}

function createLayerPose() {
  return { ...neutralLayerPose };
}

function resolveLayerTarget(layerKey) {
  const expressionPose = expressionFrames[rigState.expressionFlag] || rigPoseMatrix[rigState.expressionFlag] || expressionFrames["state-analytical"];
  return { ...neutralLayerPose, ...(expressionPose.layers[layerKey] || {}) };
}

function getBrowserGeminiApiKey() {
  return window.localStorage.getItem("aoi_gemini_api_key") || window.AOI_GEMINI_API_KEY || "";
}

function getLayerAssetPath(fileName, useLocalParentPath = false) {
  const isDirectFrontendFile = window.location.protocol === "file:" && /\/frontend\/index\.html$/i.test(window.location.pathname.replace(/\\/g, "/"));
  return `${isDirectFrontendFile || useLocalParentPath ? "../layers" : "./layers"}/${fileName}`;
}

function hydrateRigLayerSources() {
  document.querySelectorAll(".rig-layer").forEach((layerImage) => {
    const sourcePath = layerImage.getAttribute("src") || "";
    const fileName = sourcePath.split("/").pop();

    if (!fileName) {
      return;
    }

    layerImage.draggable = false;
    layerImage.decoding = "async";
    layerImage.dataset.layerRelativePath = relativePath;
    layerImage.addEventListener("error", () => {
      if (layerImage.dataset.triedParentLayerPath === "true") {
        return;
      }

      layerImage.dataset.triedParentLayerPath = "true";
      layerImage.src = getLayerAssetPath(fileName, true);
    });
    layerImage.src = getLayerAssetPath(fileName);
  });
}

function applyRigTarget(expressionFlag) {
  const normalizedFlag = STATE_CLASSES.includes(expressionFlag) ? expressionFlag : "state-analytical";
  const expressionPose = expressionFrames[normalizedFlag] || rigPoseMatrix[normalizedFlag] || expressionFrames["state-analytical"];
  rigState.expressionFlag = normalizedFlag;
  rigState.target.x = 0;
  rigState.target.y = expressionPose.avatar.y;
  rigState.target.scale = expressionPose.avatar.scale;
  rigState.target.angle = expressionPose.avatar.angle;
  rigState.target.saturation = expressionPose.avatar.saturation || 1;
  rigState.target.brightness = expressionPose.avatar.brightness || 1;
  rigState.target.contrast = expressionPose.avatar.contrast || 1;
  rigState.target.glow = expressionPose.avatar.glow || 0;
}

function prepareRigRenderer() {
  if (!viewport) {
    return;
  }

  viewport.classList.remove(...STATE_CLASSES);
  viewport.style.willChange = "transform, filter, box-shadow";
  viewport.style.filter = "none";
  Object.entries(rigLayers).forEach(([layerKey, layerElement]) => {
    rigState.layers[layerKey] = createLayerPose();

    if (!layerElement) {
      return;
    }

    layerElement.style.animation = "none";
    layerElement.style.transition = "none";
    layerElement.style.filter = "none";
    layerElement.style.opacity = ["bg", "face", "mouth", "leftEye", "rightEye"].includes(layerKey) ? "1" : "0";
    layerElement.style.visibility = ["bg", "face", "mouth", "leftEye", "rightEye"].includes(layerKey) ? "visible" : "hidden";
    layerElement.style.transformOrigin = getLayerTransformOrigin(layerKey);
    layerElement.style.willChange = "transform, opacity";
  });
  applyRigTarget("state-analytical");
}

function getLayerTransformOrigin(layerKey) {
  if (layerKey === "leftEye") {
    return "38% 29%";
  }

  if (layerKey === "rightEye") {
    return "56% 29%";
  }

  if (layerKey === "mouth") {
    return "51% 38%";
  }

  return "center center";
}

function renderCharacterRig(timestamp) {
  if (!viewport) {
    return;
  }

  Object.keys(rigState.current).forEach((propertyName) => {
    rigState.current[propertyName] = lerp(rigState.current[propertyName], rigState.target[propertyName]);
  });

  const breathWave = Math.sin(timestamp * 0.0018);
  const slowWave = Math.sin(timestamp * 0.00055);
  const breathOffset = breathWave * 0.8;
  const idleAngle = slowWave * 0.0018;
  viewport.style.transform = `translate3d(${rigState.current.x.toFixed(3)}px, ${(rigState.current.y + breathOffset).toFixed(3)}px, 0) rotate(${(rigState.current.angle * 0.35 + idleAngle).toFixed(4)}rad) scale(${(1 + (rigState.current.scale - 1) * 0.35 + breathWave * 0.0015).toFixed(4)})`;
  viewport.style.filter = "none";
  viewport.style.boxShadow = "0 10px 26px rgba(0, 0, 0, 0.12)";

  Object.entries(rigLayers).forEach(([layerKey, layerElement]) => {
    if (!layerElement) {
      return;
    }

    if (!["bg", "face", "mouth", "leftEye", "rightEye"].includes(layerKey)) {
      layerElement.style.opacity = "0";
      layerElement.style.visibility = "hidden";
      return;
    }

    const currentLayerPose = rigState.layers[layerKey] || createLayerPose();
    const targetLayerPose = resolveLayerTarget(layerKey);
    Object.keys(currentLayerPose).forEach((propertyName) => {
      currentLayerPose[propertyName] = lerp(currentLayerPose[propertyName], targetLayerPose[propertyName]);
    });
    rigState.layers[layerKey] = currentLayerPose;

    if (layerKey === "bg") {
      layerElement.style.transform = "translate3d(0, 0, 0) scale(1)";
      layerElement.style.opacity = "1";
      return;
    }

    const puppetX = slowWave * 0.55;
    const puppetY = breathWave * 0.95;
    const puppetScale = 1.003 + breathWave * 0.0018;
    const puppetAngle = slowWave * 0.0018;
    const isEyeLayer = ["leftEye", "rightEye"].includes(layerKey);
    const isMouthLayer = layerKey === "mouth";
    const blinkOpacity = isEyeLayer ? getBlinkOpacity(timestamp) : 1;
    const gazeOffset = isEyeLayer ? getGazeOffset(timestamp) : { x: 0, y: 0 };
    const mouthMotion = isMouthLayer ? getMouthMotion(timestamp) : { y: 0, scaleY: 1, scaleX: 1 };
    layerElement.style.transform = `translate3d(${(currentLayerPose.x + puppetX + gazeOffset.x).toFixed(3)}px, ${(currentLayerPose.y + puppetY + gazeOffset.y + mouthMotion.y).toFixed(3)}px, 0) rotate(${(currentLayerPose.angle + puppetAngle).toFixed(4)}rad) scale(${(currentLayerPose.scale * puppetScale * mouthMotion.scaleX).toFixed(4)}, ${(currentLayerPose.scaleY * puppetScale * mouthMotion.scaleY).toFixed(4)})`;
    layerElement.style.opacity = (currentLayerPose.opacity * blinkOpacity).toFixed(3);
  });

  requestAnimationFrame(renderCharacterRig);
}

function getBlinkOpacity(timestamp) {
  const elapsedSinceBlinkCycle = timestamp - blinkCycleStartedAt;
  const nextBlinkAt = blinkCadenceMilliseconds[blinkCycleIndex % blinkCadenceMilliseconds.length];

  if (elapsedSinceBlinkCycle > nextBlinkAt + 180) {
    blinkCycleStartedAt = timestamp;
    blinkCycleIndex += 1;
  }

  const blinkProgress = Math.max(0, Math.min(1, elapsedSinceBlinkCycle / 180));
  const blinkAmount = elapsedSinceBlinkCycle <= 180 ? Math.sin(blinkProgress * Math.PI) : 0;
  return 1 - blinkAmount * 0.82;
}

function getGazeOffset(timestamp) {
  const doneGlow = Date.now() - lastCompletedQuestAt < 5000 ? 1 : 0;
  const coldGaze = Date.now() - missedWorkSignalAt < 7000 ? 1 : 0;
  return {
    x: Math.sin(timestamp * 0.0007) * 0.45 + doneGlow * 0.25 - coldGaze * 0.35,
    y: Math.sin(timestamp * 0.0005) * 0.16 - coldGaze * 0.22
  };
}

function getMouthMotion(timestamp) {
  if (Date.now() >= speechMotionUntil) {
    return { y: 0, scaleY: 1, scaleX: 1 };
  }

  const speechPulse = 0.16 + Math.max(0, Math.sin(timestamp * 0.032)) * 0.22;
  return {
    y: speechPulse * 0.8,
    scaleY: 1 + speechPulse,
    scaleX: 1 + speechPulse * 0.18
  };
}

function startCharacterRigRenderer() {
  hydrateRigLayerSources();
  prepareRigRenderer();
  requestAnimationFrame(renderCharacterRig);
}

function selectAoiVoice(voices) {
  const preferredVoices = [
    "google us english",
    "en-us-language",
    "natural",
    "microsoft ava",
    "microsoft aria",
    "microsoft jenny",
    "microsoft sara",
    "samantha",
    "victoria"
  ];
  const roboticVoiceHints = ["david", "mark", "zira", "desktop", "legacy"];

  return voices
    .map((voice) => {
      const searchableProfile = `${voice.name} ${voice.lang}`.toLowerCase();
      const preferredScore = preferredVoices.reduce((score, token, index) => {
        return searchableProfile.includes(token) ? score + 90 - index * 4 : score;
      }, 0);
      const languageScore = searchableProfile.includes("en-us") ? 32 : searchableProfile.includes("en-") ? 18 : 0;
      const localPenalty = voice.localService ? 8 : 0;
      const roboticPenalty = roboticVoiceHints.some((token) => searchableProfile.includes(token)) ? 30 : 0;

      return {
        voice,
        score: preferredScore + languageScore - localPenalty - roboticPenalty
      };
    })
    .sort((firstVoice, secondVoice) => secondVoice.score - firstVoice.score)[0]?.voice || voices[0] || null;
}

function shapeSpeechForCalmDelivery(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s+/g, "$1 ")
    .replace(/;\s*/g, ". ")
    .trim();
}

function dispatchAoiVoice(text, voices) {
  const shapedText = shapeSpeechForCalmDelivery(text);

  if (!shapedText || typeof SpeechSynthesisUtterance === "undefined") {
    return;
  }

  const now = Date.now();

  if (lastSpokenVoiceLine.text === shapedText && now - lastSpokenVoiceLine.timestamp < 30000) {
    return;
  }

  lastSpokenVoiceLine = { text: shapedText, timestamp: now };
  const utterance = new SpeechSynthesisUtterance(shapedText);
  const selectedVoice = selectAoiVoice(voices);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = 0.88;
  utterance.pitch = 0.98;
  utterance.volume = 1.0;
  speechMotionUntil = Date.now() + Math.max(1800, Math.min(8000, shapedText.length * 68));
  startAudioExpressionPlayback(shapedText);
  utterance.onend = () => {
    speechMotionUntil = Math.min(speechMotionUntil, Date.now() + 300);
    stopAudioExpressionPlayback();
    updateCharacterRig(queuedExpressionFlag);
  };
  window.speechSynthesis.speak(utterance);
}

function startAudioExpressionPlayback(text) {
  stopAudioExpressionPlayback();
  queuedExpressionFlag = rigState.expressionFlag;
  let frameIndex = 0;
  const frameCount = Math.max(2, Math.min(8, Math.ceil(String(text).length / 42)));
  updateCharacterRig(AUDIO_EXPRESSION_SEQUENCE[0]);
  audioExpressionTimer = window.setInterval(() => {
    frameIndex += 1;

    if (frameIndex >= frameCount) {
      stopAudioExpressionPlayback();
      return;
    }

    updateCharacterRig(AUDIO_EXPRESSION_SEQUENCE[frameIndex % AUDIO_EXPRESSION_SEQUENCE.length]);
  }, 520);
}

function stopAudioExpressionPlayback() {
  if (!audioExpressionTimer) {
    return;
  }

  window.clearInterval(audioExpressionTimer);
  audioExpressionTimer = null;
}

function executeAoiVoiceEngine(text) {
  const shapedText = shapeSpeechForCalmDelivery(text);
  const requestId = ++voiceRequestSerial;

  window.speechSynthesis.cancel();
  stopAudioExpressionPlayback();

  if (!("speechSynthesis" in window) || !shapedText) {
    return;
  }

  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    dispatchAoiVoice(shapedText, voices);
    return;
  }

  window.speechSynthesis.onvoiceschanged = () => {
    if (requestId !== voiceRequestSerial) {
      return;
    }

    window.speechSynthesis.onvoiceschanged = null;
    dispatchAoiVoice(shapedText, window.speechSynthesis.getVoices());
  };
}

function updateCharacterRig(expressionFlag) {
  applyRigTarget(expressionFlag);
}

function animateNumber(element, startValue, endValue, durationMilliseconds) {
  const startTimestamp = performance.now();
  const delta = endValue - startValue;

  function tick(timestamp) {
    const elapsed = timestamp - startTimestamp;
    const progress = clamp(elapsed / durationMilliseconds, 0, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const nextValue = Math.round(startValue + delta * easedProgress);
    element.textContent = nextValue.toString();

    if (element instanceof HTMLProgressElement) {
      element.value = nextValue;
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function awardEconomy(xpAmount, currencyAmount) {
  const nextXp = currentXp + Number(xpAmount || 0);
  const nextCurrency = currentCurrency + Number(currencyAmount || 0);

  animateNumber(xpValue, currentXp, nextXp, 520);
  animateNumber(scValue, currentCurrency, nextCurrency, 520);
  animateNumber(xpMeter, currentXp % 100, nextXp % 100 || (nextXp > currentXp ? 100 : 0), 520);
  currentXp = nextXp;
  currentCurrency = nextCurrency;

  const stabilityValue = clamp(70 + Math.floor(currentXp / 80) - Math.floor(currentCurrency / 400), 10, 100);
  stabilityMeter.value = stabilityValue;
  stabilityMeter.textContent = stabilityValue.toString();
}

function updateApiKeyStatus() {
  const savedKey = getBrowserGeminiApiKey();

  if (savedKey) {
    apiKeyStatus.textContent = "Browser Gemini mode is active for this device.";
    return;
  }

  if (configuredApiBaseUrl) {
    apiKeyStatus.textContent = "Remote backend mode is active.";
    return;
  }

  if (isLocalHost) {
    apiKeyStatus.textContent = "Local backend mode is active when the Node server is running.";
    return;
  }

  apiKeyStatus.textContent = "Offline diagnostic mode is active until a browser key is saved.";
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  element.className = className;

  if (typeof textContent === "string") {
    element.textContent = textContent;
  }

  return element;
}

function renderList(container, items) {
  container.replaceChildren();

  if (!items.length) {
    container.append(createElement("li", "empty-state", "Awaiting STAGE_4_ACTIVE blueprint."));
    return;
  }

  items.forEach((item) => {
    container.append(createElement("li", "goal-item", item));
  });
}

function renderGoalsHierarchy(goalsHierarchy) {
  const safeGoals = goalsHierarchy || {};
  renderList(longTermGoals, Array.isArray(safeGoals.long_term) ? safeGoals.long_term : []);
  renderList(midTermGoals, Array.isArray(safeGoals.mid_term) ? safeGoals.mid_term : []);
  renderList(dailyRoutines, Array.isArray(safeGoals.daily_routines) ? safeGoals.daily_routines : []);
}

function parseDurationToMilliseconds(durationString) {
  const normalized = String(durationString || "").toLowerCase();
  const hours = Number((normalized.match(/(\d+(?:\.\d+)?)\s*h/) || [0, 0])[1]);
  const minutes = Number((normalized.match(/(\d+(?:\.\d+)?)\s*m/) || [0, 0])[1]);
  const seconds = Number((normalized.match(/(\d+(?:\.\d+)?)\s*s/) || [0, 0])[1]);
  const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;

  if (totalMilliseconds > 0) {
    return totalMilliseconds;
  }

  const simpleMinutes = Number((normalized.match(/^\s*(\d+(?:\.\d+)?)\s*$/) || [0, 0])[1]);
  return simpleMinutes > 0 ? simpleMinutes * 60 * 1000 : 0;
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function parseTriggerTime(triggerTime) {
  const value = String(triggerTime || "").trim();
  const todayMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (todayMatch) {
    const date = new Date();
    date.setHours(Number(todayMatch[1]), Number(todayMatch[2]), 0, 0);

    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function registerHardwareAlarm(blockId, alarm) {
  if (!alarm.enabled || registeredAlarms.has(blockId)) {
    return;
  }

  const triggerDate = parseTriggerTime(alarm.trigger_time);

  if (!triggerDate) {
    return;
  }

  const delay = triggerDate.getTime() - Date.now();

  if (delay <= 0) {
    return;
  }

  const timeoutId = window.setTimeout(() => {
    executeAoiVoiceEngine(alarm.label);
    window.alert(alarm.label);
    registeredAlarms.delete(blockId);
  }, delay);

  registeredAlarms.set(blockId, timeoutId);
}

function clearRegisteredAlarms() {
  registeredAlarms.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  registeredAlarms.clear();
}

function stopActiveCountdown(silent = false) {
  if (!activeCountdown) {
    return;
  }

  window.clearInterval(activeCountdown.intervalId);
  activeCountdown.display.textContent = "paused";
  activeCountdown.startButton.disabled = false;
  activeCountdown.startButton.textContent = "Resume Timer";
  if (!silent) {
    missedWorkSignalAt = Date.now();
    updateCharacterRig("state-cold-gaze");
  }
  activeCountdown = null;
  activeCountdowns.clear();
}

function startCountdownTimer(blockId, timer, quest) {
  if (!timer.enabled) {
    return null;
  }

  const durationMilliseconds = parseDurationToMilliseconds(timer.duration_string);

  if (durationMilliseconds <= 0) {
    return null;
  }

  const display = createElement("span", "countdown-display", formatCountdown(durationMilliseconds));
  const startButton = createElement("button", "timer-start-button", "Start Timer");
  startButton.type = "button";
  startButton.addEventListener("click", () => {
    stopActiveCountdown(true);
    display.textContent = formatCountdown(durationMilliseconds);
    startButton.disabled = true;
    startButton.textContent = "Running";
    activeCountdowns.set(blockId, true);
    runCountdown(blockId, display, startButton, durationMilliseconds, quest);
  });

  const wrapper = createElement("div", "timer-control");
  wrapper.append(display, startButton);
  return wrapper;
}

function runCountdown(blockId, display, startButton, durationMilliseconds, quest) {
  const startedAt = Date.now();
  const intervalId = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const remaining = durationMilliseconds - elapsed;
    display.textContent = formatCountdown(remaining);

    if (remaining <= 0) {
      window.clearInterval(intervalId);
      activeCountdowns.clear();
      activeCountdown = null;
      display.textContent = "verified";
      startButton.disabled = false;
      startButton.textContent = "Restart Timer";
      lastCompletedQuestAt = Date.now();
      updateCharacterRig("state-delighted");
      awardEconomy(quest?.reward_xp || 0, quest?.reward_currency || 0);
    }
  }, 1000);

  activeCountdown = {
    blockId,
    intervalId,
    display,
    startButton
  };
}

function renderTimeBlocks(timeBlocks, quests) {
  stopActiveCountdown(true);
  clearRegisteredAlarms();
  timeBlocksList.replaceChildren();

  if (!timeBlocks.length) {
    timeBlocksList.append(createElement("div", "empty-state", "No execution blocks generated yet."));
    return;
  }

  let alarmRegistered = false;
  timeBlocks.forEach((block, index) => {
    const blockId = `${block.time_window}-${block.label}-${index}`;
    const quest = quests[index] || quests[0] || null;
    const card = createElement("article", "time-block-card");
    const title = createElement("h3", "dashboard-card-title", block.label);
    const windowText = createElement("p", "dashboard-card-line", block.time_window);
    const typeText = createElement("p", "dashboard-card-line", block.type);
    const alarmText = createElement("p", "dashboard-card-line", block.hardware_alarm.enabled ? `Alarm: ${block.hardware_alarm.trigger_time}` : "Alarm: disabled");
    const timerText = createElement("p", "dashboard-card-line", block.hardware_timer.enabled ? `Timer: ${block.hardware_timer.duration_string}` : "Timer: disabled");
    const timerDisplay = startCountdownTimer(blockId, block.hardware_timer, quest);

    if (!alarmRegistered) {
      registerHardwareAlarm(blockId, block.hardware_alarm);
      alarmRegistered = Boolean(block.hardware_alarm.enabled);
    }
    card.append(title, windowText, typeText, alarmText, timerText);

    if (timerDisplay) {
      card.append(timerDisplay);
    }

    timeBlocksList.append(card);
  });
}

function renderActiveQuests(quests) {
  activeQuestsList.replaceChildren();

  if (!quests.length) {
    activeQuestsList.append(createElement("div", "empty-state", "No active quests generated yet."));
    return;
  }

  quests.forEach((quest) => {
    const card = createElement("article", "quest-card");
    card.append(
      createElement("h3", "dashboard-card-title", quest.title),
      createElement("p", "dashboard-card-line", `XP ${quest.reward_xp}`),
      createElement("p", "dashboard-card-line", `Currency ${quest.reward_currency}`)
    );
    activeQuestsList.append(card);
  });
}

function renderRewardsShop(items) {
  rewardsShopList.replaceChildren();

  if (!items.length) {
    rewardsShopList.append(createElement("div", "empty-state", "No reward inventory generated yet."));
    return;
  }

  items.forEach((item) => {
    const button = createElement("button", "reward-purchase-button", `${item.title} - ${item.cost} SC`);
    button.type = "button";
    button.addEventListener("click", () => {
      if (currentCurrency < item.cost) {
        internalThinkingState.textContent = `Currency check failed for ${item.title}. Earn ${item.cost - currentCurrency} more SC before purchase.`;
        missedWorkSignalAt = Date.now();
        updateCharacterRig("state-cold-gaze");
        return;
      }

      awardEconomy(0, -item.cost);
      internalThinkingState.textContent = `Reward purchased: ${item.title}. Controlled reinforcement logged.`;
      lastCompletedQuestAt = Date.now();
      updateCharacterRig("state-proud");
    });
    rewardsShopList.append(button);
  });
}

function renderBlueprint(blueprint) {
  if (!blueprint || blueprint.system_active !== true) {
    return;
  }

  renderGoalsHierarchy(blueprint.goals_hierarchy);
  renderActiveQuests(blueprint.active_quests);
  renderRewardsShop(blueprint.tiered_rewards_shop);
  renderTimeBlocks(blueprint.time_blocks, blueprint.active_quests);
}

function normalizeBlueprint(blueprint) {
  if (!blueprint || typeof blueprint !== "object") {
    return null;
  }

  const goalsHierarchy = blueprint.goals_hierarchy && typeof blueprint.goals_hierarchy === "object" ? blueprint.goals_hierarchy : {};

  return {
    system_active: Boolean(blueprint.system_active),
    goals_hierarchy: {
      long_term: Array.isArray(goalsHierarchy.long_term) ? goalsHierarchy.long_term.map(String) : [],
      mid_term: Array.isArray(goalsHierarchy.mid_term) ? goalsHierarchy.mid_term.map(String) : [],
      daily_routines: Array.isArray(goalsHierarchy.daily_routines) ? goalsHierarchy.daily_routines.map(String) : []
    },
    time_blocks: Array.isArray(blueprint.time_blocks) ? blueprint.time_blocks.map((block) => ({
      time_window: String(block.time_window || ""),
      label: String(block.label || ""),
      type: String(block.type || "execution"),
      hardware_alarm: {
        enabled: Boolean(block.hardware_alarm?.enabled),
        trigger_time: String(block.hardware_alarm?.trigger_time || ""),
        label: String(block.hardware_alarm?.label || "")
      },
      hardware_timer: {
        enabled: Boolean(block.hardware_timer?.enabled),
        duration_string: String(block.hardware_timer?.duration_string || ""),
        label: String(block.hardware_timer?.label || "")
      }
    })) : [],
    active_quests: Array.isArray(blueprint.active_quests) ? blueprint.active_quests.map((quest) => ({
      quest_id: String(quest.quest_id || crypto.randomUUID()),
      title: String(quest.title || ""),
      reward_xp: Number(quest.reward_xp || 0),
      reward_currency: Number(quest.reward_currency || 0)
    })) : [],
    tiered_rewards_shop: Array.isArray(blueprint.tiered_rewards_shop) ? blueprint.tiered_rewards_shop.map((item) => ({
      item_id: String(item.item_id || crypto.randomUUID()),
      title: String(item.title || ""),
      cost: Number(item.cost || 0)
    })) : []
  };
}

function sanitizeStructuredPayload(payload) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const rigControl = safePayload.rig_control && typeof safePayload.rig_control === "object" ? safePayload.rig_control : {};
  const sessionStage = SESSION_STAGES.includes(safePayload.session_stage) ? safePayload.session_stage : currentSessionStage;
  const expressionFlag = STATE_CLASSES.includes(rigControl.expression_flag) ? rigControl.expression_flag : "state-analytical";

  return {
    character_dialogue: String(safePayload.character_dialogue || "State the primary life vector you want optimized. One target."),
    internal_thinking_state: String(safePayload.internal_thinking_state || "Diagnostic intake incomplete. Awaiting measurable data."),
    session_stage: sessionStage,
    rig_control: {
      expression_flag: expressionFlag
    },
    generated_blueprint: sessionStage === "STAGE_4_ACTIVE" ? normalizeBlueprint(safePayload.generated_blueprint) : null
  };
}

function renderAnalysisStepLabel(sessionStage) {
  if (sessionStage === "STAGE_4_ACTIVE") {
    return "STEP 3 - SCHEDULE";
  }

  if (sessionStage === "STAGE_3_RESOURCES") {
    return "STEP 2 - PREFERENCES";
  }

  return "STEP 1 - PROFILE";
}

function hydrateInterface(payload) {
  const data = sanitizeStructuredPayload(payload);
  characterDialogue.textContent = data.character_dialogue;
  internalThinkingState.textContent = data.internal_thinking_state;
  sessionStageState.textContent = renderAnalysisStepLabel(data.session_stage);
  currentSessionStage = data.session_stage;
  executeAoiVoiceEngine(data.character_dialogue);
  updateCharacterRig(data.rig_control.expression_flag);

  if (data.session_stage === "STAGE_4_ACTIVE") {
    renderBlueprint(data.generated_blueprint);
  }
}

function createOfflineBlueprint() {
  return {
    system_active: true,
    goals_hierarchy: {
      long_term: ["Build a measurable self-development system with visible weekly output, stronger body conditioning, and cleaner social confidence."],
      mid_term: ["Reserve two 90 minute deep-study blocks", "Attach 10 to 15 minute workout blocks to existing breaks", "Complete one social exposure quest every active day", "Review XP and friction every seventh day"],
      daily_routines: ["Complete one 90 minute study block with a 15 minute break", "Finish one 10 minute workout micro-block", "Go for a 15 minute walk or mobility reset", "Speak to one new person or send one clear message", "Log the hardest distraction and remove it before the next block"]
    },
    time_blocks: [
      {
        time_window: "Next available 90 minutes",
        label: "Deep Study Block - one chapter, one problem set, one visible output",
        type: "study_deep_work",
        hardware_alarm: {
          enabled: false,
          trigger_time: "",
          label: "Deep Study Block starts now"
        },
        hardware_timer: {
          enabled: true,
          duration_string: "90m",
          label: "Deep Study Block countdown"
        }
      },
      {
        time_window: "Immediately after the study block",
        label: "Recovery Break - water, stretch, no feed scrolling",
        type: "break_recovery",
        hardware_alarm: {
          enabled: false,
          trigger_time: "",
          label: "Recovery Break starts now"
        },
        hardware_timer: {
          enabled: true,
          duration_string: "15m",
          label: "Recovery Break countdown"
        }
      },
      {
        time_window: "After the break",
        label: "Workout Micro-Block - pushups, squats, plank, or pull ups",
        type: "workout_strength",
        hardware_alarm: {
          enabled: false,
          trigger_time: "",
          label: "Workout Micro-Block starts now"
        },
        hardware_timer: {
          enabled: true,
          duration_string: "10m",
          label: "Workout Micro-Block countdown"
        }
      },
      {
        time_window: "Evening reset window",
        label: "Social Exposure Quest - talk to one new person or send one confident message",
        type: "social_exposure",
        hardware_alarm: {
          enabled: false,
          trigger_time: "",
          label: "Social Exposure Quest starts now"
        },
        hardware_timer: {
          enabled: true,
          duration_string: "15m",
          label: "Social Exposure Quest countdown"
        }
      }
    ],
    active_quests: [
      {
        quest_id: "QUEST_STUDY_90",
        title: "Complete a 90 minute study block and produce one visible proof item",
        reward_xp: 90,
        reward_currency: 55
      },
      {
        quest_id: "QUEST_WORKOUT_10",
        title: "Finish 10 minutes of pushups, squats, plank, pull ups, or mobility",
        reward_xp: 35,
        reward_currency: 22
      },
      {
        quest_id: "QUEST_SOCIAL_SIGNAL",
        title: "Speak to one new person, ask one useful question, or send one clear message",
        reward_xp: 45,
        reward_currency: 30
      },
      {
        quest_id: "QUEST_WALK_RESET",
        title: "Go for a 15 minute walk without scrolling",
        reward_xp: 25,
        reward_currency: 18
      }
    ],
    tiered_rewards_shop: [
      {
        item_id: "REWARD_YOUTUBE_10",
        title: "Watch YouTube for 10 minutes",
        cost: 25
      },
      {
        item_id: "REWARD_SNACK",
        title: "Eat one snack without guilt",
        cost: 35
      },
      {
        item_id: "REWARD_NOVEL_CHAPTER",
        title: "Read one novel chapter",
        cost: 40
      },
      {
        item_id: "REWARD_GAME_20",
        title: "Play a video game for 20 minutes",
        cost: 65
      },
      {
        item_id: "REWARD_LONG_ENTERTAINMENT",
        title: "Unlock a 45 minute entertainment window",
        cost: 120
      }
    ]
  };
}

function createOfflineResponse(messageText) {
  const transcriptLength = diagnosticTranscript.length;
  const normalized = String(messageText || "").toLowerCase();
  const hasHours = /\b\d+\s*(hour|hours|hr|hrs|h)\b/.test(normalized) || /\b\d{1,2}:\d{2}\b/.test(normalized);
  const hasConstraintSignal = /school|college|work|tuition|commute|exam|assignment|sleep|family|class|job/.test(normalized);
  const weakSignal = /maybe|later|tired|can't|cant|distract|scroll|procrastinate|confused/.test(normalized);
  const sessionStage = hasHours || transcriptLength >= 3 ? "STAGE_4_ACTIVE" : hasConstraintSignal || transcriptLength >= 2 ? "STAGE_3_RESOURCES" : transcriptLength >= 1 ? "STAGE_2_CONSTRAINTS" : "STAGE_1_DESIRE";
  const expressionFlag = weakSignal ? "state-challenging" : sessionStage === "STAGE_4_ACTIVE" ? "state-command" : hasConstraintSignal ? "state-calculating" : "state-listening";
  const expressionState = weakSignal ? "exp 2" : sessionStage === "STAGE_4_ACTIVE" ? "exp 3" : "exp 3";

  return {
    character_dialogue: sessionStage === "STAGE_4_ACTIVE"
      ? "Step three is active. I can schedule this now: one work timer, one break option, and rewards matched to your preferences."
      : sessionStage === "STAGE_3_RESOURCES"
        ? "Step two: list what rewards you actually like, what tasks you hate, your workout level, social confidence, subjects, deadlines, and preferred break style."
        : sessionStage === "STAGE_2_CONSTRAINTS"
          ? "Step one continues: give your free-time blocks, sleep window, school or work hours, commute, and fixed duties."
          : "Step one: state your main target, current level, free time, constraints, and what proof would show progress.",
    internal_thinking_state: `Offline diagnostic path. Transcript entries=${transcriptLength}. Constraint signal=${hasConstraintSignal}. Hour signal=${hasHours}. Weak-control signal=${weakSignal}.`,
    session_stage: sessionStage,
    rig_control: {
      expression_flag: expressionFlag
    },
    current_expression_state: expressionState,
    assigned_track: hasConstraintSignal ? "Track A" : weakSignal ? "Track B" : "Track C",
    execution_paradigm: weakSignal ? "Paradigm 4" : "Paradigm 1",
    efficiency_tasks: sessionStage === "STAGE_4_ACTIVE" ? [
      {
        task_id: "OFFLINE_EXECUTION_BLOCK",
        assigned_track: hasConstraintSignal ? "Track A" : "Track C",
        execution_paradigm: weakSignal ? "Paradigm 4" : "Paradigm 1",
        current_expression_state: expressionState,
        scope_title: "Execute the next concrete work block without peripheral activity.",
        granular_steps: ["Open the required material only.", "Run one timed work interval.", "Log visible proof before taking a reward."],
        xp_allocation: 45,
        ui_accent_color: "#111111"
      }
    ] : [],
    generated_blueprint: sessionStage === "STAGE_4_ACTIVE" ? createOfflineBlueprint() : null
  };
}

function extractGeminiText(responsePayload) {
  const parts = responsePayload?.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((part) => typeof part.text === "string");

  if (!textPart) {
    throw new Error("Gemini returned no text payload.");
  }

  return textPart.text;
}

function parseGeminiStructuredPayload(text) {
  const rawText = String(text || "").trim();
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : rawText;
  return JSON.parse(jsonText);
}

function buildInteractionPrompt(payload) {
  return [
    "Process this interaction for Interactive Character Build AI.",
    "Use exactly three analysis steps: STEP_1_PROFILE, STEP_2_PREFERENCES, STEP_3_SCHEDULE.",
    "STEP_1_PROFILE asks for target, current level, constraints, sleep, school/work, and available free-time blocks.",
    "STEP_2_PREFERENCES asks for liked rewards, disliked tasks, workout ability, social confidence, subjects/deadlines, and break style.",
    "STEP_3_SCHEDULE builds the actual schedule only after enough profile and preference data exists.",
    "Advance the diagnostic only when the user's answer provides enough concrete information for the next step.",
    "Ask exactly one sharp question unless session_stage is STAGE_4_ACTIVE.",
    "When STAGE_4_ACTIVE, return a complete generated_blueprint with vivid real-world goals, time blocks, quests, reward values, alarm strings, and timer durations.",
    "Use varied task types: 90m study/deep work, 15m breaks, 10m or 15m workouts, pushups, pull ups, squats, planks, walking, chores, revision, social exposure, talking to one new person, and safe confidence practice.",
    "Use appealing concrete rewards: 10m YouTube, snacks, video game time, novel reading, music, tea/coffee, or controlled scrolling. Price stronger rewards higher.",
    "Design the schedule so the user starts one timer at a time. Prefer one primary active work timer, then a break timer, then a reward timer option. Use hardware_alarm only for the next start or break reminder when a clear clock time exists.",
    "Choose one expression_flag from the 30-state expression bank in the system instruction. Never invent a new flag.",
    "Also return current_expression_state as exp 1, exp 2, exp 3, or exp 4; assigned_track as Track A through Track G; execution_paradigm as Paradigm 1 through Paradigm 4; and an efficiency_tasks array using task_id, assigned_track, execution_paradigm, current_expression_state, scope_title, granular_steps, xp_allocation, and ui_accent_color.",
    "Interaction payload:",
    JSON.stringify(payload, null, 2)
  ].join("\n");
}

async function callGeminiFromBrowser(prompt) {
  const apiKey = getBrowserGeminiApiKey();

  if (!apiKey) {
    throw new Error("No browser Gemini API key saved.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION_MATRIX }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.35,
        maxOutputTokens: 1600
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini browser request failed (${response.status}): ${errorText || response.statusText}`);
  }

  return sanitizeStructuredPayload(parseGeminiStructuredPayload(extractGeminiText(await response.json())));
}

async function postInteraction(payload) {
  if (!configuredApiBaseUrl && getBrowserGeminiApiKey()) {
    try {
      return await callGeminiFromBrowser(buildInteractionPrompt(payload));
    } catch (error) {
      console.warn("Browser Gemini mode unavailable, using offline diagnostic:", error);
      apiKeyStatus.textContent = error.message;
      return createOfflineResponse(payload.message);
    }
  }

  const response = await fetch(interactionEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

function sendChatMessageToServer(messageText) {
  const normalizedMessage = String(messageText || "").trim();

  if (!normalizedMessage) {
    return;
  }

  diagnosticTranscript.push({
    role: "user",
    message: normalizedMessage,
    stage: currentSessionStage,
    timestamp: new Date().toISOString()
  });

  sendInteraction({
    message: normalizedMessage,
    session_stage: currentSessionStage,
    transcript: diagnosticTranscript
  });
}

async function sendInteraction(payload) {
  try {
    characterDialogue.textContent = "Processing diagnostic input...";
    const data = await postInteraction(payload);
    hydrateInterface(data);
  } catch (error) {
    hydrateInterface({
      character_dialogue: "The backend path failed. Switching to local diagnostic control.",
      internal_thinking_state: error.message,
      session_stage: currentSessionStage,
      rig_control: {
        expression_flag: "state-melancholy"
      },
      generated_blueprint: null
    });
  }
}

async function readScanPreview(file) {
  const textTypes = [
    "text/plain",
    "text/markdown",
    "application/json",
    "text/csv"
  ];

  if (textTypes.includes(file.type) || /\.(txt|md|csv|json)$/i.test(file.name)) {
    return (await file.text()).slice(0, 12000);
  }

  return `Document metadata only: ${file.name}, ${file.type || "unknown type"}, ${file.size} bytes.`;
}

async function sendScan() {
  const selectedFile = scanInput.files && scanInput.files[0];

  if (!selectedFile) {
    scanStatus.textContent = "Select a document before scanning.";
    return;
  }

  try {
    scanStatus.textContent = `Scanning ${selectedFile.name}...`;
    const preview = await readScanPreview(selectedFile);
    const payload = {
      message: `Document scan: ${selectedFile.name}`,
      document_preview: preview,
      session_stage: currentSessionStage,
      transcript: diagnosticTranscript
    };

    if (!configuredApiBaseUrl && getBrowserGeminiApiKey()) {
      try {
        const data = await callGeminiFromBrowser(buildInteractionPrompt(payload));
        hydrateInterface(data);
        scanStatus.textContent = `${selectedFile.name} processed in browser mode.`;
        return;
      } catch (error) {
        console.warn("Browser scan unavailable, using offline diagnostic:", error);
        hydrateInterface(createOfflineResponse(`Scan ${selectedFile.name}. ${preview}`));
        scanStatus.textContent = `${selectedFile.name} processed in offline mode.`;
        return;
      }
    }

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("context", JSON.stringify(payload));

    const response = await fetch(scanEndpoint, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Scan failed with status ${response.status}`);
    }

    hydrateInterface(await response.json());
    scanStatus.textContent = `${selectedFile.name} processed.`;
  } catch (error) {
    scanStatus.textContent = error.message;
    updateCharacterRig("state-melancholy");
  }
}

saveApiKeyButton.addEventListener("click", () => {
  const nextKey = apiKeyInput.value.trim();

  if (nextKey) {
    window.localStorage.setItem("aoi_gemini_api_key", nextKey);
  } else {
    window.localStorage.removeItem("aoi_gemini_api_key");
  }

  updateApiKeyStatus();
});

scanSubmit.addEventListener("click", sendScan);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const messageText = chatInput.value;
  chatInput.value = "";
  sendChatMessageToServer(messageText);
});

if (voiceInputEngine) {
  voiceInputEngine.continuous = false;
  voiceInputEngine.interimResults = false;
  voiceInputEngine.lang = "en-US";

  voiceInputEngine.onstart = () => {
    isListening = true;
    interfaceContainer.classList.add("voice-active");
    micToggleButton.setAttribute("aria-pressed", "true");
    window.speechSynthesis.cancel();
  };

  voiceInputEngine.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    sendChatMessageToServer(transcript);
  };

  voiceInputEngine.onerror = (event) => {
    console.error("Voice input engine error:", event);
    voiceInputEngine.stop();
  };

  voiceInputEngine.onend = () => {
    isListening = false;
    interfaceContainer.classList.remove("voice-active");
    micToggleButton.setAttribute("aria-pressed", "false");
  };

  micToggleButton.addEventListener("click", () => {
    if (isListening) {
      voiceInputEngine.stop();
      return;
    }

    voiceInputEngine.start();
  });
} else {
  micToggleButton.disabled = true;
  micToggleButton.setAttribute("aria-disabled", "true");
}

startCharacterRigRenderer();
updateApiKeyStatus();
renderGoalsHierarchy(null);
renderActiveQuests([]);
renderRewardsShop([]);
renderTimeBlocks([], []);
