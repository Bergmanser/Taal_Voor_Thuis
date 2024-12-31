import { doc, getDoc, setDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";

const MAX_PAUSED_QUIZZES = 3;
const SAVE_INTERVAL = 2; // Save every 2 questions
const AUTOSAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
let initializationInProgress = false;

class ActivityTracker {
    constructor() {
        this.lastActivity = Date.now();
        this.isActive = true;
        this.inactiveThreshold = 20000; // 20 seconds
        this.totalInactiveTime = 0;
        this.questionStartTimes = new Map();
        this.questionTimes = new Map();

        this.setupEventListeners();
        this._isPausing = false;
        this._isResuming = false;
    }

    setupEventListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => this.recordActivity());
        });

        // Check activity status every second
        setInterval(() => this.checkActivity(), 1000);
    }

    recordActivity() {
        this.lastActivity = Date.now();
        if (!this.isActive) {
            this.totalInactiveTime += Date.now() - this.lastActivity;
            this.isActive = true;
        }
    }

    checkActivity() {
        const now = Date.now();
        if (now - this.lastActivity > this.inactiveThreshold) {
            this.isActive = false;
        }
    }

    startQuestionTimer(questionIndex) {
        if (!this.questionTimes.has(questionIndex)) {
            this.questionStartTimes.set(questionIndex, Date.now());
        }
    }

    stopQuestionTimer(questionIndex) {
        if (this.questionStartTimes.has(questionIndex)) {
            const activeTime = this.getQuestionActiveTime(questionIndex);
            this.questionTimes.set(questionIndex, activeTime);
            this.questionStartTimes.delete(questionIndex);
        }
    }

    getQuestionActiveTime(questionIndex) {
        const startTime = this.questionStartTimes.get(questionIndex);
        if (!startTime) return 0;

        const totalTime = Date.now() - startTime;
        return Math.max(0, totalTime - this.totalInactiveTime);
    }
}

class QuizStateManager {
    constructor(quizId, userId) {
        if (!quizId || !userId) {
            throw new Error("Quiz ID and User ID are required");
        }
        this.quizId = quizId;
        this.userId = userId;
        this.state = {
            currentQuestionIndex: 0,
            userResponses: {},
            attempts: {},
            feedback: {},
            quizData: [],
            startTime: Date.now(),
            lastUpdated: null,
            quizTitle: "",
            status: "active",
            selectedOptionIndex: null,
            partialScores: {
                firstAttemptCorrect: 0,
                totalCorrect: 0,
            },
        };
        this.initialized = false;
        this.questionsSinceLastSave = 0;
        this.activityTracker = new ActivityTracker();
    }

    startQuestionTimer() {
        this.activityTracker.startQuestionTimer(this.state.currentQuestionIndex);
    }

    stopQuestionTimer() {
        this.activityTracker.stopQuestionTimer(this.state.currentQuestionIndex);
    }

    getQuestionTime(questionIndex) {
        return this.activityTracker.getQuestionActiveTime(questionIndex);
    }

    isUserActive() {
        return this.activityTracker.isActive;
    }

    getTotalInactiveTime() {
        return this.activityTracker.totalInactiveTime;
    }

    async initialize(quizTitle) {
        if (initializationInProgress) {
            console.log("Initialization already in progress");
            return false;
        }

        initializationInProgress = true;

        try {
            console.log(`Initializing QuizStateManager for quizId: ${this.quizId}`);
            this.state.quizTitle = quizTitle || "Untitled Quiz";

            // Load existing state with retry
            let savedState = null;
            let attempts = 0;
            const maxAttempts = 3;

            while (!savedState && attempts < maxAttempts) {
                try {
                    savedState = await this.loadState();
                    if (savedState) {
                        console.log("Successfully loaded saved state on attempt", attempts + 1);
                        break;
                    }
                } catch (error) {
                    console.warn(`Failed to load state on attempt ${attempts + 1}:`, error);
                }
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (savedState) {
                await this.restoreQuizState(savedState);
            } else {
                const quizData = await this.fetchQuizDataFromFirestore(this.quizId);
                if (!quizData) throw new Error("Quiz data could not be fetched.");
                this.state.quizData = quizData.Questions;
                this.state.quizTitle = quizData.Title;
            }

            // Bind elements after state is initialized
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.bindExistingElements();
                });
            } else {
                this.bindExistingElements();
            }

            this.initialized = true;
            console.log("QuizStateManager initialized successfully");
            return true;
        } catch (error) {
            console.error("Error initializing QuizStateManager:", error);
            throw error;
        } finally {
            initializationInProgress = false;
        }
    }

    // New helper method for validating saved state
    isValidSavedState(state) {
        if (!state) return false;

        // Check structure but be more lenient
        const hasRequiredFields = [
            'currentQuestionIndex',
            'quizData',
            'lastUpdated'
        ].every(field => state.hasOwnProperty(field));

        if (!hasRequiredFields) return false;

        // Validate quiz data more carefully
        if (state.quizData) {
            if (!Array.isArray(state.quizData)) return false;
            if (state.quizData.length === 0) return false;

            // Check first question structure as sample
            const firstQuestion = state.quizData[0];
            if (!firstQuestion || !firstQuestion.Text || !Array.isArray(firstQuestion.Options)) {
                return false;
            }
        }

        return true;
    }

    // New method to ensure state consistency
    async ensureStateConsistency() {
        // Wait for all state operations to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify quiz data is loaded
        if (!this.state.quizData || !Array.isArray(this.state.quizData)) {
            throw new Error("Quiz data not properly initialized");
        }

        // Ensure all required state properties exist
        const requiredProperties = [
            'currentQuestionIndex',
            'userResponses',
            'attempts',
            'feedback'
        ];

        requiredProperties.forEach(prop => {
            if (!this.state.hasOwnProperty(prop)) {
                this.state[prop] = prop === 'currentQuestionIndex' ? 0 : {};
            }
        });
    }

    async checkExistingState() {
        try {
            console.log("Checking existing quiz state...");
            let hasValidState = false;

            // First check localStorage since it's faster
            const localState = localStorage.getItem(this.getStorageKey());
            let parsedLocalState = null;

            if (localState) {
                try {
                    parsedLocalState = JSON.parse(localState);
                    console.log("Found localStorage state:", parsedLocalState);

                    // Enhanced validation including progress check for active states
                    if (parsedLocalState &&
                        parsedLocalState.currentQuestionIndex !== undefined &&
                        parsedLocalState.userResponses &&
                        parsedLocalState.attempts &&
                        (
                            // Check for paused state
                            parsedLocalState.state === 'paused' ||
                            // Check for active state with progress
                            (parsedLocalState.state === 'active' &&
                                parsedLocalState.userResponses &&
                                Object.keys(parsedLocalState.userResponses).length > 0)
                        ) &&
                        !parsedLocalState.emergencySave // Check it's not an emergency save
                    ) {
                        hasValidState = true;
                        console.log("Valid state found in localStorage");
                    }
                } catch (e) {
                    console.error("Error parsing localStorage state:", e);
                }
            }

            // Then check Firestore
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const firestoreState = userDoc.data()?.quizzes?.[this.quizId];

            if (firestoreState) {
                // If we have a paused state in Firestore, it takes precedence
                if (firestoreState.state === 'paused') {
                    console.log("Found paused state in Firestore, using this");
                    return true;
                }

                // Check for active state with progress in Firestore
                if (firestoreState.state === 'active' &&
                    firestoreState.userResponses &&
                    Object.keys(firestoreState.userResponses).length > 0) {
                    console.log("Found active state with progress in Firestore");
                    hasValidState = true;
                }

                // If the Firestore state is more recent, use it instead
                if (firestoreState.lastUpdated && parsedLocalState?.lastUpdated) {
                    const firestoreTime = new Date(firestoreState.lastUpdated).getTime();
                    const localTime = new Date(parsedLocalState.lastUpdated).getTime();

                    if (firestoreTime > localTime) {
                        // Update localStorage with Firestore state
                        localStorage.setItem(this.getStorageKey(), JSON.stringify({
                            ...firestoreState,
                            lastUpdated: new Date().toISOString()
                        }));
                        hasValidState = true;
                        console.log("Using more recent Firestore state");
                    }
                }
            }

            // If either state is marked as finished, don't auto-start
            if ((parsedLocalState?.state === 'finished' || firestoreState?.state === 'finished')) {
                console.log("Quiz marked as finished, preventing auto-start");
                return false;
            }

            return hasValidState;
        } catch (error) {
            console.error("Error checking existing state:", error);
            return false;
        }
    }

    async ensureValidState() {
        // If we have a paused state in Firestore, use that
        const userRef = doc(db, "studentdb", this.userId);
        const userDoc = await getDoc(userRef);
        const firestoreState = userDoc.data()?.quizzes?.[this.quizId];

        if (firestoreState?.state === 'paused') {
            this.state = {
                ...this.state,
                ...firestoreState,
                lastUpdated: new Date().toISOString()
            };
            return;
        }

        // Otherwise, use localStorage if valid
        const localState = localStorage.getItem(this.getStorageKey());
        if (localState) {
            const parsedState = JSON.parse(localState);
            if (parsedState && parsedState.currentQuestionIndex !== undefined) {
                this.state = {
                    ...this.state,
                    ...parsedState,
                    lastUpdated: new Date().toISOString()
                };
                return;
            }
        }

        // If no valid state found, ensure we have clean state
        this.state = {
            ...this.state,
            currentQuestionIndex: 0,
            lastUpdated: new Date().toISOString()
        };
    }

    // Factory function at the module level
    static async create(quizId, userId, quizTitle = "") {
        try {
            console.log('Creating QuizStateManager instance...');
            const manager = new QuizStateManager(quizId, userId);
            await manager.initialize(quizTitle);
            return manager;
        } catch (error) {
            console.error('Error creating QuizStateManager:', error);
            throw error;
        }
    }

    // Generate a unique key for this quiz and user
    getStorageKey() {
        return `quizState_${this.userId}_${this.quizId}`;
    }

    // Initialize the quiz state
    bindExistingElements() {
        try {
            this.pauseButton = document.getElementById('pause-quiz-button');
            console.log('Pause button found:', this.pauseButton);

            this.pausePopup = document.getElementById('pause-popup');
            console.log('Pause popup found:', this.pausePopup);

            this.confirmPauseBtn = document.getElementById('confirm-pause');
            this.cancelPauseBtn = document.getElementById('cancel-pause');
            this.pauseMessage = document.getElementById('pause-message');

            if (this.pausePopup) {
                this.closeBtn = this.pausePopup.querySelector('.close-btn');
            }

            if (this.pauseButton && this.pausePopup && this.confirmPauseBtn &&
                this.cancelPauseBtn && this.closeBtn && this.pauseMessage) {
                this.setupEventListeners();
                console.log('All pause elements found, setting up event listeners');
            } else {
                console.warn('Missing elements:', {
                    pauseButton: !!this.pauseButton,
                    pausePopup: !!this.pausePopup,
                    confirmBtn: !!this.confirmPauseBtn,
                    cancelBtn: !!this.cancelPauseBtn,
                    closeBtn: !!this.closeBtn,
                    message: !!this.pauseMessage
                });
            }
        } catch (error) {
            console.error('Error binding pause elements:', error);
        }
    }

    setupEventListeners() {
        if (!this.pauseButton || !this.pausePopup) {
            console.error('Required elements not found for event listeners');
            return;
        }

        // Pause button click handler
        this.pauseButton.addEventListener('click', async (e) => {
            try {
                console.log('Handling pause click');
                e.preventDefault();
                e.stopPropagation();

                // Get current progress before showing popup
                const progress = this.calculateProgress();
                const existingState = await this.getExistingPausedState();

                // Update popup content based on state
                if (existingState) {
                    const existingProgress = existingState.progress || {
                        completedQuestions: 0,
                        totalQuestions: 0,
                        progressPercentage: 0
                    };
                    console.log('Existing pause state found:', existingProgress);
                }

                // Show popup and update status
                this.pausePopup.classList.remove('hidden');
                await this.updatePauseStatus();
                setTimeout(() => {
                    this.pausePopup.classList.add('show');
                }, 10);
            } catch (error) {
                console.error('Error handling pause click:', error);
            }
        });

        // Close button handler
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                console.log('Close button clicked');
                e.preventDefault();
                this.hidePausePopup();
            });
        }

        // Cancel button handler
        if (this.cancelPauseBtn) {
            this.cancelPauseBtn.addEventListener('click', (e) => {
                console.log('Cancel button clicked');
                e.preventDefault();
                this.hidePausePopup();
            });
        }

        // Confirm pause button handler
        if (this.confirmPauseBtn) {
            this.confirmPauseBtn.addEventListener('click', async (e) => {
                try {
                    console.log('Confirm pause clicked');
                    e.preventDefault();
                    await this.confirmPause();
                } catch (error) {
                    console.error('Error confirming pause:', error);
                    const errorElement = document.getElementById('error-message');
                    if (errorElement) {
                        errorElement.textContent = error.message || "Failed to pause quiz. Please try again.";
                        errorElement.style.display = 'block';
                    }
                }
            });
        }

        // Resume functionality for paused quizzes
        if (this.state.status === 'paused') {
            const continueBtn = document.getElementById('continue-quiz-btn');
            if (continueBtn) {
                continueBtn.addEventListener('click', async (e) => {
                    try {
                        e.preventDefault();
                        console.log('Handling resume click');

                        const activeState = await this.resumeQuiz();
                        if (activeState) {
                            await this.restoreQuizState(activeState);
                            await this.updatePauseStatus();
                            console.log('Quiz resumed successfully');
                        }
                    } catch (error) {
                        console.error('Error handling resume click:', error);
                        const errorElement = document.getElementById('error-message');
                        if (errorElement) {
                            errorElement.textContent = "Failed to resume quiz. Please try again.";
                            errorElement.style.display = 'block';
                        }
                    }
                });
            }
        }

        // Outside popup click handler
        this.pausePopup.addEventListener('click', (e) => {
            if (e.target === this.pausePopup) {
                console.log('Outside popup clicked');
                this.hidePausePopup();
            }
        });

        // Handle keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.pausePopup.classList.contains('hidden')) {
                console.log('Escape key pressed, closing popup');
                this.hidePausePopup();
            }
        });

        // Handle window beforeunload when quiz is paused
        window.addEventListener('beforeunload', (e) => {
            if (this.state.status === 'paused') {
                console.log('Page unload detected while quiz is paused');
                // No need to show confirmation dialog as state is already saved
                return;
            }
        });
    }

    async fetchQuizDataFromFirestore(quizId) {
        try {
            console.log(`Fetching quiz data for quizId: ${quizId}`);
            const docRef = doc(db, "quizzes", quizId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const quizDoc = docSnap.data();
                console.log("Quiz data retrieved from Firestore:", quizDoc);
                return quizDoc; // Return the entire document
            } else {
                console.error("No quiz data found for this quizId.");
                return null;
            }
        } catch (error) {
            console.error("Error fetching quiz data from Firestore:", error);
            return null;
        }
    }

    bindExistingElements() {
        try {
            this.pauseButton = document.getElementById('pause-quiz-button');
            console.log('Pause button found:', this.pauseButton);

            this.pausePopup = document.getElementById('pause-popup');
            console.log('Pause popup found:', this.pausePopup);

            this.confirmPauseBtn = document.getElementById('confirm-pause');
            this.cancelPauseBtn = document.getElementById('cancel-pause');
            this.pauseMessage = document.getElementById('pause-message');

            if (this.pausePopup) {
                this.closeBtn = this.pausePopup.querySelector('.close-btn');
            }

            if (this.pauseButton && this.pausePopup && this.confirmPauseBtn &&
                this.cancelPauseBtn && this.closeBtn && this.pauseMessage) {
                this.setupEventListeners();
                console.log('All pause elements found, setting up event listeners');
            } else {
                console.warn('Missing elements:', {
                    pauseButton: !!this.pauseButton,
                    pausePopup: !!this.pausePopup,
                    confirmBtn: !!this.confirmPauseBtn,
                    cancelBtn: !!this.cancelPauseBtn,
                    closeBtn: !!this.closeBtn,
                    message: !!this.pauseMessage
                });
            }
        } catch (error) {
            console.error('Error binding pause elements:', error);
        }
    }

    // Update setupEventListeners to handle null checks and add more logging
    setupEventListeners() {
        if (!this.pauseButton || !this.pausePopup) {
            console.error('Required elements not found for event listeners');
            return;
        }

        // Pause button click handler
        this.pauseButton.addEventListener('click', (e) => {
            console.log('Pause button clicked');
            e.preventDefault(); // Prevent any default behavior
            e.stopPropagation(); // Stop event bubbling
            this.pausePopup.classList.remove('hidden');
            this.updatePauseStatus(); // Make sure status is updated before showing
            setTimeout(() => {
                this.pausePopup.classList.add('show');
            }, 10);
        });

        // Setup other button handlers
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                console.log('Close button clicked');
                e.preventDefault();
                this.hidePausePopup();
            });
        }

        if (this.cancelPauseBtn) {
            this.cancelPauseBtn.addEventListener('click', (e) => {
                console.log('Cancel button clicked');
                e.preventDefault();
                this.hidePausePopup();
            });
        }

        if (this.confirmPauseBtn) {
            this.confirmPauseBtn.addEventListener('click', (e) => {
                console.log('Confirm button clicked');
                e.preventDefault();
                this.confirmPause();
            });
        }

        // Outside click handler
        this.pausePopup.addEventListener('click', (e) => {
            if (e.target === this.pausePopup) {
                console.log('Outside popup clicked');
                this.hidePausePopup();
            }
        });
    }

    // In QuizStateManager class
    async updateQuestionIndex(newIndex) {
        this.state.currentQuestionIndex = newIndex;
        this.state.selectedOptionIndex = null;
        await this.saveQuizState();
    }

    hidePausePopup() {
        this.pausePopup.classList.remove('show');
        setTimeout(() => this.pausePopup.classList.add('hidden'), 300);
    }

    async updatePauseStatus() {
        try {
            const pausedCount = await this.getPausedQuizCount();
            const remainingPauses = MAX_PAUSED_QUIZZES - pausedCount;

            console.log('Current paused count:', pausedCount);

            // Update UI counters
            const pauseCount = document.getElementById('pause-count');
            const pausesRemaining = document.getElementById('pauses-remaining');

            if (pauseCount) pauseCount.textContent = remainingPauses;
            if (pausesRemaining) pausesRemaining.textContent = remainingPauses;

            // Get current quiz pause state first
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const quizzes = userDoc.data()?.quizzes || {};

            // Log full quiz data
            console.log('All quizzes:', quizzes);

            const currentQuiz = quizzes[this.quizId];
            const isCurrentQuizPaused = currentQuiz?.state === 'paused' || currentQuiz?.status === 'paused';

            // Only proceed with warning if at limit AND not previously paused
            if (pausedCount >= MAX_PAUSED_QUIZZES && !isCurrentQuizPaused) {
                const pausedQuizzes = Object.entries(quizzes)
                    .map(([id, quiz]) => ({
                        ...quiz,
                        quizId: id,
                        title: quiz.title || quiz.quizTitle || 'Onbekende quiz'
                    }))
                    .filter(quiz => quiz.state === 'paused' || quiz.status === 'paused');

                // Log filtered paused quizzes
                console.log('Paused quizzes:', pausedQuizzes);

                // Sort by lastUpdated
                const sortedQuizzes = pausedQuizzes.sort((a, b) =>
                    new Date(a.lastUpdated || 0) - new Date(b.lastUpdated || 0)
                );

                // Log sorted quizzes
                console.log('Sorted paused quizzes:', sortedQuizzes);

                const oldestQuiz = sortedQuizzes[0];
                console.log('Oldest quiz to be removed:', oldestQuiz);

                if (!oldestQuiz) {
                    this.pauseMessage.innerHTML = `
                        <div class="warning-message">
                            <div class="warning-icon">⚠️</div>
                            <p>Er is een fout opgetreden bij het vinden van de oudste gepauzeerde quiz.</p>
                        </div>
                    `;
                    return;
                }

                const quizTitle = oldestQuiz.title ||
                    oldestQuiz.quizTitle ||
                    `Quiz ${oldestQuiz.quizId}` ||
                    'Onbekende quiz';

                this.pauseMessage.innerHTML = `
                    De maximale hoeveelheid van gepauzeerde quizzen is bereikt.
                    <div class="warning-message">
                        <div class="warning-icon">⚠️</div>
                        <p>Als deze quiz word gepauzeerd, zal er vooruitgang verloren worden bij: 
                            <strong>${quizTitle}</strong>
                        </p>
                    </div>
                `;
            } else {
                // Different message if quiz is already paused
                this.pauseMessage.innerHTML = `
                    Deze quiz ${isCurrentQuizPaused ? 'opnieuw ' : ''}pauzeren? 
                    ${!isCurrentQuizPaused ? `Er kunnen nog
                    <strong style="color: #dc3545">${remainingPauses}</strong> 
                    ${remainingPauses === 1 ? 'quiz' : 'quizzen'} gepauzeerd worden.` : ''}
                `;
            }
        } catch (error) {
            console.error('Error in updatePauseStatus:', error);
            this.pauseMessage.innerHTML = `
                <div class="warning-message">
                    <div class="warning-icon">⚠️</div>
                    <p>Er is een fout opgetreden bij het laden van de quiz status.</p>
                </div>
            `;
        }
    }

    async updatePauseCount() {
        try {
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const quizzes = userDoc.data()?.quizzes || {};

            const pausedQuizzes = Object.values(quizzes).filter(quiz =>
                quiz.state === 'paused' || quiz.status === 'paused'
            );

            const remainingPauses = MAX_PAUSED_QUIZZES - pausedQuizzes.length;

            // Update UI
            const pauseCount = document.getElementById('pause-count');
            const pausesRemaining = document.getElementById('pauses-remaining');

            if (pauseCount) pauseCount.textContent = remainingPauses;
            if (pausesRemaining) pausesRemaining.textContent = remainingPauses;

            return remainingPauses;
        } catch (error) {
            console.error('Error updating pause count:', error);
            return 0;
        }
    }

    handleBeforeUnload(event) {
        this.saveQuizState();
        event.preventDefault();
        event.returnValue = 'Are you sure you want to leave? Your progress will be saved.';
    }

    async getPausedQuizCount() {
        try {
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const quizzes = userDoc.data()?.quizzes || {};

            return Object.values(quizzes)
                .filter((quiz) => quiz &&
                    (quiz.status === "paused" || quiz.state === "paused"))
                .length;
        } catch (error) {
            console.error('Error getting paused quiz count:', error);
            return 0;
        }
    }

    async getOldestPausedQuiz() {
        try {
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const quizzes = userDoc.data()?.quizzes || {};

            // Ensure filtering handles null values gracefully
            return Object.values(quizzes)
                .filter((quiz) => quiz && quiz.state === "paused") // Filter non-null quizzes
                .sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated))[0];
        } catch (error) {
            console.error("Error getting oldest paused quiz:", error);
            return null; // Ensure fallback behavior
        }
    }

    async updateQuizState(newState) {
        try {
            console.log(`Updating quiz state to: ${newState}`);

            // Update both state properties
            this.state.state = newState;
            this.state.status = newState;

            const stateData = {
                state: newState,
                status: newState,
                lastUpdated: new Date().toISOString()
            };

            // Update Firestore
            const userRef = doc(db, "studentdb", this.userId);
            await updateDoc(userRef, {
                [`quizzes.${this.quizId}.state`]: newState,
                [`quizzes.${this.quizId}.status`]: newState,
                [`quizzes.${this.quizId}.lastUpdated`]: stateData.lastUpdated
            });

            // Update localStorage with complete state
            const currentState = localStorage.getItem(this.getStorageKey());
            if (currentState) {
                const updatedState = {
                    ...JSON.parse(currentState),
                    ...stateData
                };
                localStorage.setItem(this.getStorageKey(), JSON.stringify(updatedState));
            }

            // If quiz is finished, update pause counter
            if (newState === 'finished') {
                await this.updatePauseStatus();
                // Clear local storage for this quiz
                localStorage.removeItem(this.getStorageKey());
            }

            console.log(`Quiz state updated to ${newState}`);
            return true;
        } catch (error) {
            console.error('Error updating quiz state:', error);
            return false;
        }
    }

    calculateProgress() {
        try {
            const { userResponses, attempts, quizData } = this.state;
            if (!quizData || !quizData.length) {
                return {
                    completedQuestions: 0,
                    totalQuestions: 0,
                    progressPercentage: 0,
                    lastCompletedQuestion: 0
                };
            }

            // Use Set to ensure unique counting of completed questions
            const completedQuestionIndices = new Set();

            // Add questions with valid responses (including special -1 marker for incorrect)
            Object.keys(userResponses).forEach(index => {
                if (userResponses[index] !== undefined) {
                    completedQuestionIndices.add(parseInt(index));
                }
            });

            // Add questions attempted twice (if not already counted)
            Object.entries(attempts || {}).forEach(([index, questionAttempts]) => {
                if (questionAttempts.length >= 2 && !completedQuestionIndices.has(parseInt(index))) {
                    completedQuestionIndices.add(parseInt(index));
                }
            });

            // Calculate metrics with safety bounds
            const completedQuestions = Math.min(completedQuestionIndices.size, quizData.length);
            const totalQuestions = quizData.length;
            const progressPercentage = Math.min(
                Math.floor((completedQuestions / totalQuestions) * 100),
                100
            );

            // Calculate last completed question (keeping original logic with Set data)
            const lastCompletedQuestion = completedQuestionIndices.size > 0 ?
                Math.max(...Array.from(completedQuestionIndices)) + 1 : 0;

            const progress = {
                completedQuestions,
                totalQuestions,
                progressPercentage,
                lastCompletedQuestion
            };

            console.log('Progress calculated:', progress);
            return progress;

        } catch (error) {
            console.error('Error calculating progress:', error);
            return {
                completedQuestions: 0,
                totalQuestions: this.state.quizData?.length || 0,
                progressPercentage: 0,
                lastCompletedQuestion: 0
            };
        }
    }

    // Save the current state to both localStorage and Firestore
    async saveQuizState(force = false) {
        if (!this.initialized) return;

        try {
            const currentState = {
                ...this.state,
                lastUpdated: new Date().toISOString()
            };

            // Always save to localStorage for immediate access
            localStorage.setItem(this.getStorageKey(), JSON.stringify(currentState));

            // Throttle Firestore saves unless forced
            if (!force && Date.now() - this._lastFirestoreSave < 5000) {
                return;
            }

            // Save minimal state to Firestore with progress
            const minimalState = {
                currentQuestionIndex: this.state.currentQuestionIndex || 0,
                status: this.state.status || "active",
                state: this.state.state || "active",
                lastUpdated: currentState.lastUpdated,
                userResponses: this.state.userResponses || {},
                attempts: this.state.attempts || {},
                progress: this.calculateProgress() || { completedQuestions: 0, progressPercentage: 0 },
            };

            const userRef = doc(db, "studentdb", this.userId);
            await updateDoc(userRef, {
                [`quizzes.${this.quizId}`]: minimalState
            });

            this._lastFirestoreSave = Date.now();
        } catch (error) {
            console.error("Error saving quiz state:", error);
            // Add backup on error
            localStorage.setItem(
                `${this.getStorageKey()}_backup`,
                JSON.stringify(this.state)
            );
        }
    }

    async saveAttempts(questionIndex, attempt, feedback) {
        try {
            // Update local state
            if (!this.state.attempts[questionIndex]) {
                this.state.attempts[questionIndex] = [];
            }
            if (!this.state.feedback[questionIndex]) {
                this.state.feedback[questionIndex] = [];
            }

            this.state.attempts[questionIndex].push(attempt);
            this.state.feedback[questionIndex].push({
                ...feedback,
                timestamp: new Date().toISOString()
            });

            // Save to localStorage
            localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));

            // Update Firestore with minimal data
            const userRef = doc(db, "studentdb", this.userId);
            await updateDoc(userRef, {
                [`quizzes.${this.quizId}.attempts`]: this.state.attempts,
                [`quizzes.${this.quizId}.feedback`]: this.state.feedback,
                [`quizzes.${this.quizId}.lastUpdated`]: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('Error saving attempts:', error);
            return false;
        }
    }

    // Load quiz state from storage
    async loadState() {
        try {
            console.log("Loading quiz state with enhanced validation...");
            let loadedState = null;
            let stateSource = null;

            // 1. First check Firestore
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const firestoreState = userDoc.data()?.quizzes?.[this.quizId];

            // 2. Check localStorage
            const localState = localStorage.getItem(this.getStorageKey());
            const parsedLocalState = localState ? JSON.parse(localState) : null;

            // Validation helpers
            const isValidTimestamp = (timestamp) => {
                try {
                    const date = new Date(timestamp);
                    return date instanceof Date && !isNaN(date);
                } catch {
                    return false;
                }
            };

            const getStateProgress = (state) => {
                if (!state) return 0;
                return (
                    (state.currentQuestionIndex || 0) +
                    Object.keys(state.attempts || {}).length +
                    Object.keys(state.userResponses || {}).length
                );
            };

            // 3. State Selection Logic
            if (firestoreState?.state === 'paused') {
                // Validate paused state from Firestore
                if (this.validateStateSource(firestoreState, 'firestore')) {
                    console.log("Using validated paused state from Firestore");
                    loadedState = firestoreState;
                    stateSource = 'firestore';
                } else {
                    console.log("Invalid paused state in Firestore");
                }
            } else {
                // Compare states based on progress and timestamps
                const isValidFirestore = firestoreState && this.validateStateSource(firestoreState, 'firestore');
                const isValidLocal = parsedLocalState && this.validateStateSource(parsedLocalState, 'localStorage');

                const firestoreProgress = isValidFirestore ? getStateProgress(firestoreState) : 0;
                const localProgress = isValidLocal ? getStateProgress(parsedLocalState) : 0;

                const firestoreTimestamp = isValidTimestamp(firestoreState?.lastUpdated)
                    ? new Date(firestoreState.lastUpdated)
                    : null;
                const localTimestamp = isValidTimestamp(parsedLocalState?.lastUpdated)
                    ? new Date(parsedLocalState.lastUpdated)
                    : null;

                // Choose the most complete state
                if (firestoreProgress > localProgress) {
                    console.log("Using Firestore state (more progress)");
                    loadedState = firestoreState;
                    stateSource = 'firestore';
                } else if (localProgress > firestoreProgress) {
                    console.log("Using localStorage state (more progress)");
                    loadedState = parsedLocalState;
                    stateSource = 'localStorage';
                } else {
                    // Equal progress, use most recent
                    if (firestoreTimestamp && localTimestamp) {
                        if (firestoreTimestamp > localTimestamp) {
                            console.log("Using Firestore state (more recent)");
                            loadedState = firestoreState;
                            stateSource = 'firestore';
                        } else {
                            console.log("Using localStorage state (more recent)");
                            loadedState = parsedLocalState;
                            stateSource = 'localStorage';
                        }
                    } else {
                        // Default to Firestore if timestamps are invalid
                        loadedState = firestoreState || parsedLocalState;
                        stateSource = firestoreState ? 'firestore' : 'localStorage';
                    }
                }
            }

            // 4. Handle Fresh Start or Reattempt
            if (loadedState?.state === 'finished') {
                console.log("Previous attempt was finished, starting fresh");
                return null;
            }

            // 5. Validate and Enhance Selected State
            if (loadedState) {
                // Ensure we have complete quiz data
                if (stateSource === 'firestore') {
                    const quizDoc = await getDoc(doc(db, "quizzes", this.quizId));
                    if (!quizDoc.exists()) {
                        console.warn("Quiz document not found");
                        return null;
                    }
                    loadedState = {
                        ...loadedState,
                        quizData: quizDoc.data()?.Questions || [],
                        quizTitle: quizDoc.data()?.Title || ""
                    };
                }

                // Final validation of the complete state
                if (!this.validateStateSource(loadedState, stateSource)) {
                    console.warn("Final state validation failed, starting fresh");
                    return null;
                }

                // 6. Synchronize Storage
                // Update localStorage with the most recent valid state
                localStorage.setItem(this.getStorageKey(), JSON.stringify({
                    ...loadedState,
                    lastUpdated: new Date().toISOString()
                }));

                console.log(`Loaded valid state from ${stateSource}:`, loadedState);
                return loadedState;
            }

            console.log("No valid state found, starting fresh");
            return null;

        } catch (error) {
            console.error("Error loading state:", error);
            return null;
        }
    }

    async saveAttemptWithPersistence(questionIndex, selectedOption, isCorrect) {
        try {
            const timestamp = new Date().toISOString();
            const attemptData = {
                selectedOption,
                correct: isCorrect,
                timestamp
            };

            // Update local state
            if (!this.state.attempts[questionIndex]) {
                this.state.attempts[questionIndex] = [];
            }
            this.state.attempts[questionIndex].push(selectedOption);

            if (!this.state.feedback[questionIndex]) {
                this.state.feedback[questionIndex] = [];
            }
            this.state.feedback[questionIndex].push(attemptData);

            // Immediately save to both storages
            const stateToSave = {
                ...this.state,
                lastUpdated: timestamp
            };

            // Save to localStorage immediately
            localStorage.setItem(this.getStorageKey(), JSON.stringify(stateToSave));

            // Save to Firestore immediately
            const userRef = doc(db, "studentdb", this.userId);
            await updateDoc(userRef, {
                [`quizzes.${this.quizId}.attempts.${questionIndex}`]: this.state.attempts[questionIndex],
                [`quizzes.${this.quizId}.feedback.${questionIndex}`]: this.state.feedback[questionIndex],
                [`quizzes.${this.quizId}.lastUpdated`]: timestamp
            });

            return true;
        } catch (error) {
            console.error('Error saving attempt:', error);
            return false;
        }
    }

    // Helper methods
    validateStateStructure(state) {
        const requiredFields = [
            'currentQuestionIndex',
            "status",
            "state",
            "lastUpdated",
            'attempts',
            'userResponses',
            'quizData'
        ];

        // return requiredFields.every(field => {
        //     const value = state[field];
        //     if (field === 'currentQuestionIndex') {
        //         return typeof value === 'number' && value >= 0;
        //     }
        //     if (field === 'quizData') {
        //         return Array.isArray(value);
        //     }
        //     return typeof value === 'object';
        // });

        const isFieldValid = (key, value) => {
            if (requiredFields.includes(key) && value === undefined) {
                console.error(`Missing required field: ${key}`);
                return false;
            }
            return true;
        };

        return Object.entries(state).every(([key, value]) => isFieldValid(key, value));
    }

    validateStateSource(state, source) {
        if (!state || typeof state !== 'object') return false;

        // Base validation
        if (state.state === 'finished' || state.status === 'finished') {
            return false;
        }

        // Common validation
        const hasRequiredProps = this.validateStateStructure(state);
        if (!hasRequiredProps) return false;

        // Progress validation
        const hasProgress = state.currentQuestionIndex > 0 ||
            Object.keys(state.attempts || {}).length > 0 ||
            Object.keys(state.userResponses || {}).length > 0 ||
            (source === 'firestore' && state.state === 'paused');

        // Add timestamp validation from old isValidState
        const isRecentEnough = new Date(state.lastUpdated) > new Date(Date.now() - 24 * 60 * 60 * 1000);

        return hasProgress && isRecentEnough;
    }

    async getCompleteFirestoreState(firestoreState) {
        const quizDoc = await getDoc(doc(db, "quizzes", this.quizId));
        return {
            ...firestoreState,
            quizData: quizDoc.data().Questions,
            quizTitle: quizDoc.data().Title
        };
    }

    // Restore quiz state into the current session
    async restoreQuizState(state) {
        try {
            console.log('Restoring quiz state:', state);

            // Validate that we have quiz data
            if (!state || !state.quizData || !Array.isArray(state.quizData)) {
                console.error('Invalid quiz data in state:', state);
                throw new Error('Invalid quiz data structure');
            }

            // Deep clone to prevent reference issues
            const attempts = JSON.parse(JSON.stringify(state.attempts || {}));
            const feedback = JSON.parse(JSON.stringify(state.feedback || {}));
            const userResponses = JSON.parse(JSON.stringify(state.userResponses || {}));
            const quizData = JSON.parse(JSON.stringify(state.quizData || []));

            // Restore base state with validation
            this.state = {
                ...this.state,
                ...state,
                currentQuestionIndex: state.currentQuestionIndex || 0,
                attempts,
                feedback,
                userResponses,
                quizData,
                partialScores: { ...this.state.partialScores, ...state.partialScores },
                startTime: state.startTime || Date.now(),
                lastUpdated: state.lastUpdated || new Date().toISOString(),
                quizTitle: state.quizTitle || "Untitled Quiz",
                status: state.status || "active",
                selectedOptionIndex: null
            };

            // Validate question data structure
            if (!this.state.quizData.every(q => q && typeof q.Text === 'string' && Array.isArray(q.Options))) {
                console.error('Invalid question structure in quiz data');
                throw new Error('Invalid question data structure');
            }

            // Revalidate and restore twice-incorrect states
            Object.keys(attempts).forEach(questionIndex => {
                questionIndex = parseInt(questionIndex);
                const questionAttempts = attempts[questionIndex] || [];
                const questionFeedback = feedback[questionIndex] || [];

                // If question was attempted twice and both were incorrect
                if (questionAttempts.length >= 2) {
                    const allIncorrect = questionFeedback.every(f => !f.correct);
                    if (allIncorrect) {
                        // Mark as completed with special value
                        this.state.userResponses[questionIndex] = -1;
                    }
                }

                // Ensure we have valid feedback entries
                if (questionAttempts.length > 0 && (!questionFeedback.length || questionFeedback.length !== questionAttempts.length)) {
                    this.state.feedback[questionIndex] = questionAttempts.map((attempt, idx) => ({
                        selectedOption: attempt,
                        correct: attempt === this.state.quizData[questionIndex].CorrectOption,
                        timestamp: new Date().toISOString()
                    }));
                }
            });

            // Clean up any invalid states
            this.state.quizData.forEach((_, index) => {
                if (this.state.userResponses[index] === undefined) {
                    // Only delete feedback and attempts if they don't represent a valid twice-incorrect state
                    if (!(this.state.attempts[index]?.length >= 2)) {
                        delete this.state.feedback[index];
                        delete this.state.attempts[index];
                    }
                }
            });

            console.log('Successfully restored quiz state:', {
                currentQuestionIndex: this.state.currentQuestionIndex,
                questionsCount: this.state.quizData.length,
                attempts: this.state.attempts,
                userResponses: this.state.userResponses
            });

            return true;
        } catch (error) {
            console.error('Error restoring quiz state:', error);
            return false;
        }
    }

    async clearQuizState() {
        try {
            // Clear localStorage
            localStorage.removeItem(this.getStorageKey());
            localStorage.removeItem(`quizCompleted_${this.quizId}`);

            // Update Firestore
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const quizzes = userDoc.data()?.quizzes || {};

            if (quizzes[this.quizId]) {
                await updateDoc(userRef, {
                    [`quizzes.${this.quizId}`]: {
                        state: 'finished',
                        status: 'finished',
                        lastUpdated: new Date().toISOString()
                    }
                });
            }

            // Reset state manager
            this.state = {
                ...this.state,
                currentQuestionIndex: 0,
                userResponses: {},
                attempts: {},
                feedback: {},
                startTime: new Date(),
                selectedOptionIndex: null
            };
        } catch (error) {
            console.error('Error clearing quiz state:', error);
        }
    }

    // Enhanced validation for paused state
    validatePauseState(state) {
        if (!state || typeof state !== "object") return false;

        const requiredFields = [
            "state",
            "status",
            "progress",
            "lastUpdated",
            "currentQuestionIndex",
            "quizData",
        ];

        for (const field of requiredFields) {
            if (!(field in state)) {
                console.error(`Paused state is missing required field: ${field}`);
                return false;
            }
        }

        // Check specific fields for valid types
        if (state.state !== "paused" || state.status !== "paused") {
            console.error("Invalid state or status in paused state");
            return false;
        }

        if (!state.progress || typeof state.progress.completedQuestions !== "number") {
            console.error("Invalid or missing progress in paused state");
            return false;
        }

        if (!Array.isArray(state.quizData)) {
            console.error("Invalid or missing quizData in paused state");
            return false;
        }

        return true;
    }


    async getExistingPausedState() {
        try {
            const userDoc = await getDoc(doc(db, "studentdb", this.userId));
            const quizzes = userDoc.data()?.quizzes || {};
            const pausedState = quizzes[this.quizId];

            if (pausedState?.state === "paused") {
                console.log("Found paused state:", pausedState);
                return pausedState;
            }

            console.warn("No paused state found for this quiz");
            return null;
        } catch (error) {
            console.error("Error retrieving paused state:", error);
            return null;
        }
    }

    async clearState() {
        try {
            await this.updateQuizState('finished');
            localStorage.removeItem(this.getStorageKey());
            console.log("Quiz state cleared.");
        } catch (error) {
            console.error("Error clearing quiz state:", error);
        }
    }

    async clearLocalState() {
        localStorage.removeItem(this.getStorageKey());
        console.log("Local quiz state cleared.");
    }

    async clearAndResetQuiz() {
        try {
            // Clear both storages completely
            localStorage.removeItem(this.getStorageKey());
            localStorage.removeItem(`quizCompleted_${this.quizId}`);

            // Reset Firestore to clean state
            const userRef = doc(db, "studentdb", this.userId);
            await updateDoc(userRef, {
                [`quizzes.${this.quizId}`]: {
                    state: 'active',
                    status: 'active',
                    startTime: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    attempts: {},
                    feedback: {},
                    userResponses: {},
                    progress: null  // Explicitly remove progress
                }
            });

            // Reset state manager's internal state
            this.state = {
                currentQuestionIndex: 0,
                userResponses: {},
                attempts: {},
                feedback: {},
                quizData: this.state.quizData,
                startTime: new Date(),
                lastUpdated: new Date(),
                quizTitle: this.state.quizTitle,
                status: "active",
                selectedOptionIndex: null,
                partialScores: {
                    firstAttemptCorrect: 0,
                    totalCorrect: 0,
                },
            };

            return true;
        } catch (error) {
            console.error('Error resetting quiz:', error);
            return false;
        }
    }

    // Record an attempt for the current question
    recordAttempt(selectedOption, isCorrect) {
        const currentIndex = this.state.currentQuestionIndex;

        if (!this.state.attempts[currentIndex]) this.state.attempts[currentIndex] = [];
        if (!this.state.feedback[currentIndex]) this.state.feedback[currentIndex] = [];

        // Add attempt and feedback
        this.state.attempts[currentIndex].push(selectedOption);
        this.state.feedback[currentIndex].push({ selectedOption, correct: isCorrect });

        // Update partial scores
        const scores = this.calculatePartialScores();
        this.state.partialScores.firstAttemptCorrect = scores.firstAttemptCorrect;
        this.state.partialScores.totalCorrect = scores.totalCorrect;

        // Periodic save
        this.questionsSinceLastSave++;
        if (this.questionsSinceLastSave >= SAVE_INTERVAL) {
            this.saveQuizState();
            this.questionsSinceLastSave = 0;
        }
    }

    // Calculate partial scores
    calculatePartialScores() {
        const feedback = this.state.feedback;
        const attempts = this.state.attempts;
        const quizData = this.state.quizData;

        let firstAttemptCorrect = 0;
        let totalCorrect = 0;

        quizData.forEach((_, index) => {
            const questionFeedback = feedback[index] || [];
            const questionAttempts = attempts[index] || [];

            if (questionFeedback.length > 0) {
                if (questionAttempts.length === 1 && questionFeedback[0].correct) {
                    firstAttemptCorrect++;
                }
                if (questionFeedback.some((attempt) => attempt.correct)) {
                    totalCorrect++;
                }
            }
        });

        return {
            firstAttemptCorrect,
            totalCorrect,
        };
    }

    // Periodic save setup
    setupPeriodicSave() {
        setInterval(() => {
            if (this.initialized) this.saveQuizState();
        }, AUTOSAVE_INTERVAL);
    }

    // Pause the quiz
    async pauseQuiz() {
        await this.saveQuizState();
        console.log("Quiz paused.");
    }

    async resumeQuiz() {
        try {
            console.log("Attempting to resume quiz...");

            // 1. Try Firestore first
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const firestoreState = userDoc.data()?.quizzes?.[this.quizId];

            // 2. Check localStorage as backup
            const localState = localStorage.getItem(this.getStorageKey());
            const parsedLocalState = localState ? JSON.parse(localState) : null;

            // 3. Choose the most recent valid state
            let pausedState = null;
            if (firestoreState?.pausedAt && parsedLocalState?.pausedAt) {
                // Compare timestamps and choose most recent
                const firestoreTimestamp = new Date(firestoreState.pausedAt);
                const localTimestamp = new Date(parsedLocalState.pausedAt);
                pausedState = firestoreTimestamp > localTimestamp ? firestoreState : parsedLocalState;
            } else {
                pausedState = firestoreState?.pausedAt ? firestoreState : parsedLocalState;
            }

            if (!pausedState || pausedState.state !== 'paused') {
                console.error("No valid paused state found");
                throw new Error("No paused state found");
            }

            // 4. Validate the pause state
            if (!this.validatePauseState(pausedState)) {
                console.error("Invalid pause state:", pausedState);
                throw new Error("Invalid pause state");
            }

            // 5. Restore and save the active state
            const activeState = {
                ...pausedState,
                state: "active",
                status: "active",
                lastUpdated: new Date().toISOString(),
                resumeHistory: [
                    ...(pausedState.resumeHistory || []),
                    { timestamp: new Date().toISOString(), pausedAt: pausedState.pausedAt },
                ],
            };

            // Save the active state
            localStorage.setItem(this.getStorageKey(), JSON.stringify(activeState));
            await updateDoc(doc(db, "studentdb", this.userId), {
                [`quizzes.${this.quizId}`]: activeState,
            });

            console.log("Quiz resumed successfully with state:", activeState);
            return activeState;

        } catch (error) {
            console.error("Error resuming quiz:", error);
            throw error;
        }
    }

    async removeOldestPausedQuiz() {
        try {
            const userRef = doc(db, "studentdb", this.userId);
            const userDoc = await getDoc(userRef);
            const quizzes = userDoc.data()?.quizzes || {};

            // First check if current quiz is already paused
            const currentQuiz = quizzes[this.quizId];
            const isCurrentQuizPaused = currentQuiz?.state === 'paused' || currentQuiz?.status === 'paused';

            if (isCurrentQuizPaused) {
                console.log('Quiz was al gepauzeerd, geen verwijdering nodig');
                return {
                    success: true,
                    quizTitle: currentQuiz.title || currentQuiz.quizTitle || 'Onbekende quiz',
                    wasCurrentQuiz: true,
                    alreadyPaused: true
                };
            }

            // Map and filter paused quizzes
            const pausedQuizzes = Object.entries(quizzes)
                .map(([id, quiz]) => ({
                    ...quiz,
                    quizId: id,
                    title: quiz.title || quiz.quizTitle || 'Onbekende quiz',
                    lastUpdated: quiz.lastUpdated || new Date(0).toISOString()
                }))
                .filter(quiz => quiz.state === 'paused' || quiz.status === 'paused')
                .sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

            const oldestQuiz = pausedQuizzes[0];

            if (!oldestQuiz) {
                throw new Error('Geen gepauzeerde quiz gevonden');
            }

            console.log('Oudste gepauzeerde quiz gevonden:', oldestQuiz);

            // Check if trying to pause current quiz again
            if (oldestQuiz.quizId === this.quizId) {
                return {
                    success: true,
                    quizTitle: oldestQuiz.title,
                    wasCurrentQuiz: true,
                    alreadyPaused: true
                };
            }

            // Delete using deleteField()
            await updateDoc(userRef, {
                [`quizzes.${oldestQuiz.quizId}`]: deleteField()
            });

            // Clean up localStorage
            localStorage.removeItem(`quizState_${this.userId}_${oldestQuiz.quizId}`);
            console.log(`Quiz "${oldestQuiz.title}" volledig verwijderd uit Firestore`);

            return {
                success: true,
                quizTitle: oldestQuiz.title,
                wasCurrentQuiz: false,
                alreadyPaused: false
            };
        } catch (error) {
            console.error('Fout bij verwijderen oudste quiz:', error);
            throw error;
        }
    }

    async confirmPause() {
        if (this._isPausing) {
            console.log('Pauze proces is al bezig');
            return;
        }
        this._isPausing = true;

        try {
            console.log("Start pauze bevestiging...");

            // 1. Load latest state
            const latestState = JSON.parse(localStorage.getItem(this.getStorageKey()) || "null");
            if (latestState) {
                console.log("Laatste staat geladen van localStorage:", latestState);
                this.state = { ...this.state, ...latestState };
            }

            const currentProgress = this.calculateProgress();
            console.log('Huidige voortgang voor pauze:', currentProgress);

            // 2. Validate against existing paused state
            const existingPausedState = await this.getExistingPausedState();
            if (existingPausedState) {
                const existingProgress = existingPausedState.progress || {
                    completedQuestions: 0,
                    totalQuestions: 0,
                    progressPercentage: 0,
                };

                if (currentProgress.completedQuestions < existingProgress.completedQuestions) {
                    throw new Error("Kan niet pauzeren met minder voortgang dan eerder opgeslagen.");
                }
            }

            // 3. Handle pause limit
            const pausedCount = await this.getPausedQuizCount();
            if (pausedCount >= MAX_PAUSED_QUIZZES) {
                console.warn(`Maximum aantal gepauzeerde quizzen (${MAX_PAUSED_QUIZZES}) bereikt.`);
                const removeResult = await this.removeOldestPausedQuiz();

                if (removeResult.alreadyPaused) {
                    // Current quiz was already paused, just update state
                    console.log('Quiz was al gepauzeerd, voortgang wordt opgeslagen');
                } else if (removeResult.wasCurrentQuiz) {
                    console.log('Quiz was al gepauzeerd, staat wordt bijgewerkt');
                } else {
                    // Show information about removed quiz
                    this.showToast(
                        `"${removeResult.quizTitle}" is verwijderd om ruimte te maken voor deze pauze.`,
                        'warning'
                    );
                }
            }

            // 4. Prepare pause state
            const pauseState = {
                ...this.state,
                state: "paused",
                status: "paused",
                lastUpdated: new Date().toISOString(),
                progress: currentProgress,
                pauseHistory: [
                    ...(this.state.pauseHistory || []),
                    {
                        timestamp: new Date().toISOString(),
                        progress: currentProgress
                    },
                ],
            };

            // 5. Save to localStorage first
            localStorage.setItem(this.getStorageKey(), JSON.stringify(pauseState));
            localStorage.setItem(`${this.getStorageKey()}_backup`, JSON.stringify(pauseState));

            // 6. Save to Firestore with retries
            const userRef = doc(db, "studentdb", this.userId);
            let saved = false;

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await updateDoc(userRef, { [`quizzes.${this.quizId}`]: pauseState });
                    saved = true;
                    console.log("Quiz status succesvol opgeslagen in Firestore.");
                    break;
                } catch (error) {
                    console.warn(`Poging ${attempt} om op te slaan mislukt:`, error);
                    if (attempt === 3) throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }

            // 7. Cleanup and redirect
            if (saved) {
                localStorage.removeItem(`${this.getStorageKey()}_backup`);

                // Different message if quiz was already paused
                const wasAlreadyPaused = existingPausedState?.state === 'paused';
                this.showToast(
                    wasAlreadyPaused ?
                        'Quiz voortgang opgeslagen' :
                        'Quiz succesvol gepauzeerd'
                );

                this.hidePausePopup();

                setTimeout(() => {
                    window.location.href = "student_dashboard.html";
                }, 300);
            }

        } catch (error) {
            console.error("Fout bij bevestigen van pauze:", error);

            // Emergency save
            try {
                const emergencyState = {
                    ...this.state,
                    state: "paused",
                    status: "paused",
                    lastUpdated: new Date().toISOString(),
                    emergencySave: true,
                };
                localStorage.setItem(`${this.getStorageKey()}_emergency`, JSON.stringify(emergencyState));
            } catch (saveError) {
                console.error("Noodopslag mislukt:", saveError);
            }

            // Show error to user
            const errorElement = document.getElementById("error-message");
            if (errorElement) {
                errorElement.textContent = "Er is een fout opgetreden bij het pauzeren van de quiz. Probeer het opnieuw.";
                errorElement.style.display = "block";
            }

            throw error;
        } finally {
            this._isPausing = false;
        }
    }

    async showToast(message, type = 'success') {
        // Create toast elements
        const toast = document.createElement('div');
        toast.className = 'toast';

        const content = document.createElement('div');
        content.className = 'toast-content';

        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕';

        const text = document.createElement('span');
        text.textContent = message;

        const progress = document.createElement('div');
        progress.className = 'toast-progress';

        // Build toast structure
        content.appendChild(icon);
        content.appendChild(text);
        toast.appendChild(content);
        toast.appendChild(progress);

        // Handle existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Show new toast
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        // Remove after animation
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Handle completing a question
    async handleQuestionCompleted() {
        this.questionsSinceLastSave++;
        if (this.questionsSinceLastSave >= SAVE_INTERVAL) {
            await this.saveQuizState();
            this.questionsSinceLastSave = 0;
        }
    }

    // Enforce pause limits and cleanup old paused states
    async enforcePauseLimit() {
        const userRef = doc(db, "studentdb", this.userId);
        const userDoc = await getDoc(userRef);
        const quizzes = userDoc.data()?.quizzes || {};

        const pausedQuizzes = Object.entries(quizzes)
            .filter(([_, quiz]) => quiz.state === "paused")
            .sort(([, a], [, b]) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

        if (pausedQuizzes.length >= MAX_PAUSED_QUIZZES) {
            const [oldestQuizId] = pausedQuizzes[0];
            delete quizzes[oldestQuizId];
            await setDoc(userRef, { quizzes }, { merge: true });
            console.log(`Oldest paused quiz removed: ${oldestQuizId}`);
        }
    }

    async handlePauseClick() {
        try {
            console.log('Handling pause click');
            // Get current progress before showing popup
            const progress = this.calculateProgress();
            const existingState = await this.getExistingPausedState();

            // Update popup content based on state
            if (existingState) {
                const existingProgress = existingState.progress || {
                    completedQuestions: 0,
                    totalQuestions: 0,
                    progressPercentage: 0
                };
                console.log('Existing pause state found:', existingProgress);
            }

            // Show popup with current status
            this.pausePopup.classList.remove('hidden');
            await this.updatePauseStatus(); // Already implemented
            setTimeout(() => {
                this.pausePopup.classList.add('show');
            }, 10);
        } catch (error) {
            console.error('Error handling pause click:', error);
        }
    }

    async handleResumeClick() {
        try {
            console.log('Handling resume click');
            const activeState = await this.resumeQuiz();

            if (activeState) {
                // Restore the quiz state
                await this.restoreQuizState(activeState);

                // Update UI to reflect resumed state
                this.updatePauseStatus();
                console.log('Quiz resumed successfully');
            }
        } catch (error) {
            console.error('Error handling resume click:', error);
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.textContent = "Failed to resume quiz. Please try again.";
                errorElement.style.display = 'block';
            }
        }
    }

}

// Factory function to create a new QuizStateManager instance
export const createQuizStateManager = async (quizId, userId, quizTitle = "") => {
    return await QuizStateManager.create(quizId, userId, quizTitle);
};