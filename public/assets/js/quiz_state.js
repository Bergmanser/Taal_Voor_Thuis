// console.log("quiz_state.js file loaded");
// import { saveStateToLocalStorage, loadStateFromLocalStorage, clearStateFromLocalStorage } from './local_storage.js';
// import { logEvent } from './utils.js';

// // Centralized quiz state management
// const quizState = {
//     startTime: null,
//     endTime: null,
//     isPaused: false,
//     pauseStartTime: null,
//     totalPauseDuration: 0,
//     idleTime: 0,
//     focusLossEvents: 0,
//     questionInteractions: {},
//     advancedTrackingData: {},
//     readingTimeSpent: 0,
//     skippedReading: false,
//     totalTimeSpent: 0,
//     deviceType: null,
//     powerStateChanges: [],
//     tabSwitches: 0,
//     currentQuestionIndex: 0,
//     userResponses: {},
//     attempts: {},
//     feedback: {},
//     correctQuestions: 0,
// };

// export default quizState;

// // // Initialize tracking activities after user consent
// // export function initializeTracking() {
// //     console.log("Initializing tracking based on user consent...");

// //     if (quizState.userConsent?.basic) {
// //         // Start basic tracking
// //         startIdleTimeTracking();
// //         setupStateEventListeners();
// //         console.log("Basic tracking started.");
// //     }

// //     if (quizState.userConsent?.advanced) {
// //         // Start advanced tracking
// //         setupAdvancedTracking();
// //         console.log("Advanced tracking started.");
// //     }
// // }

// function initializeTracking() {
//     console.log("Initializing tracking...");

//     // Initialize device type tracking
//     if (!quizState.deviceType) {
//         const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
//         quizState.deviceType = isMobile ? 'mobile' : 'desktop';
//         logEvent(`Device type identified: ${quizState.deviceType}`);
//     }

//     // Start idle time tracking
//     startIdleTimeTracking();

//     // Initialize other advanced tracking features if needed
//     if ('getBattery' in navigator) {
//         navigator.getBattery().then(battery => {
//             battery.addEventListener('chargingchange', () => {
//                 recordAdvancedTracking('powerStateChange', { isCharging: battery.charging });
//             });
//             logEvent('Battery state initialized');
//         });
//     }

//     // Start tracking tab visibility changes
//     document.addEventListener('visibilitychange', handleVisibilityChange);

//     // Network status tracking
//     window.addEventListener('online', () => recordAdvancedTracking('networkStatusChange', { status: 'online' }));
//     window.addEventListener('offline', () => recordAdvancedTracking('networkStatusChange', { status: 'offline' }));
// }



// // Save state to localStorage
// export function saveState() {
//     const state = {
//         ...quizState,
//         startTime: quizState.startTime.getTime(),
//     };
//     logEvent("Saving state to localStorage", state);
//     saveStateToLocalStorage(state);
// }

// // Load state from localStorage
// export function loadState() {
//     const state = loadStateFromLocalStorage();
//     if (state) {
//         quizState.startTime = new Date(state.startTime);
//         Object.assign(quizState, state);
//         logEvent("State loaded from localStorage", quizState);
//     } else {
//         quizState.startTime = new Date();
//         quizState.correctQuestions = 0;
//         logEvent("No previous state found, starting new quiz", quizState);
//     }
// }

// // Clear state from localStorage
// export function clearState() {
//     logEvent("Clearing state from localStorage");
//     clearStateFromLocalStorage();
//     Object.assign(quizState, {
//         startTime: null,
//         endTime: null,
//         isPaused: false,
//         pauseStartTime: null,
//         totalPauseDuration: 0,
//         idleTime: 0,
//         focusLossEvents: 0,
//         questionInteractions: {},
//         advancedTrackingData: {},
//         readingTimeSpent: 0,
//         skippedReading: false,
//         totalTimeSpent: 0,
//         deviceType: null,
//         powerStateChanges: [],
//         tabSwitches: 0,
//         currentQuestionIndex: 0,
//         userResponses: {},
//         attempts: {},
//         feedback: {},
//         correctQuestions: 0,
//     });
//     logEvent("State cleared", quizState);
// }

// // Pause the quiz
// export function pauseQuiz() {
//     quizState.isPaused = true;
//     quizState.pauseStartTime = new Date();
//     stopIdleTimeTracking();
//     logEvent('Quiz paused', { pauseStartTime: quizState.pauseStartTime, currentState: quizState });
//     saveState(); // Save the state when pausing
// }

// // Resume the quiz
// export function resumeQuiz() {
//     const pauseDuration = (new Date() - quizState.pauseStartTime) / 1000;
//     quizState.totalPauseDuration += pauseDuration;
//     quizState.isPaused = false;
//     startIdleTimeTracking();
//     logEvent('Quiz resumed', { resumeTime: new Date(), pauseDuration, currentState: quizState });
//     saveState(); // Save the state when resuming
// }

// // Setup event listeners for state management
// export function setupStateEventListeners() {
//     const debouncedResetIdleTime = debounce(resetIdleTime, 300);
//     logEvent("Setting up state event listeners", { deviceType: quizState.deviceType });

//     if (quizState.deviceType === 'desktop') {
//         document.addEventListener('mousemove', debouncedResetIdleTime);
//         document.addEventListener('keypress', debouncedResetIdleTime);
//     } else {
//         document.addEventListener('touchstart', debouncedResetIdleTime);
//         document.addEventListener('touchmove', debouncedResetIdleTime);
//     }

//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     window.addEventListener('online', () => recordAdvancedTracking('networkStatusChange', { status: 'online' }));
//     window.addEventListener('offline', () => recordAdvancedTracking('networkStatusChange', { status: 'offline' }));

//     if ('getBattery' in navigator) {
//         navigator.getBattery().then(battery => {
//             battery.addEventListener('chargingchange', () => {
//                 recordAdvancedTracking('powerStateChange', { isCharging: battery.charging });
//                 logEvent('Battery charging state changed', { isCharging: battery.charging });
//             });
//         });
//     }
// }

// // Initialize the consent system
// export function initializeConsentSystem() {
//     const savedConsent = localStorage.getItem('userConsent');
//     if (savedConsent) {
//         quizState.userConsent = JSON.parse(savedConsent);
//         logEvent("User consent loaded", quizState.userConsent);
//         initializeTracking();
//     } else {
//         logEvent("User consent not found, showing consent modal");
//         showConsentModal();
//     }
// }

// // Initialize question tracking
// export function initializeQuestionTracking(questionIndex) {
//     quizState.questionInteractions[questionIndex] = {
//         startTime: new Date(),
//         endTime: null,
//         timeSpent: 0,
//         attempts: 0,
//         hintUsed: false,
//         idleTime: 0,
//         focusLossEvents: 0,
//         interactions: [],
//         scrollBehavior: [],
//         mousePath: [],
//     };
//     logEvent(`Started tracking question ${questionIndex + 1}`, quizState.questionInteractions[questionIndex]);
// }

// // Record question interaction
// export function recordQuestionInteraction(questionIndex, interactionType, details = {}) {
//     const interaction = quizState.questionInteractions[questionIndex];
//     interaction.interactions.push({
//         type: interactionType,
//         timestamp: new Date(),
//         ...details,
//     });
//     logEvent(`Recorded interaction for question ${questionIndex + 1}: ${interactionType}`, { interaction, details });
// }

// // Finalize question tracking
// export function finalizeQuestionTracking(questionIndex) {
//     const interaction = quizState.questionInteractions[questionIndex];
//     interaction.endTime = new Date();
//     interaction.timeSpent = (interaction.endTime - interaction.startTime) / 1000 - interaction.idleTime;
//     logEvent(`Finished tracking question ${questionIndex + 1}`, interaction);
// }

// // Utility Functions

// function debounce(func, wait) {
//     let timeout;
//     return function (...args) {
//         const context = this;
//         clearTimeout(timeout);
//         timeout = setTimeout(() => func.apply(context, args), wait);
//     };
// }

// function resetIdleTime() {
//     quizState.idleTime = 0;
//     logEvent("Idle time reset", quizState.idleTime);
// }

// function stopIdleTimeTracking() {
//     logEvent("Idle time tracking stopped");
//     // Logic to stop idle time tracking
// }

// function startIdleTimeTracking() {
//     logEvent("Idle time tracking started");
//     // Logic to start idle time tracking
// }

// function handleVisibilityChange() {
//     if (document.visibilityState === 'hidden') {
//         quizState.focusLossEvents++;
//         logEvent('Focus lost', { focusLossEvents: quizState.focusLossEvents, timestamp: new Date() });
//     }
// }

// function recordAdvancedTracking(eventType, eventData) {
//     if (quizState.userConsent?.advanced) {
//         quizState.advancedTrackingData[eventType] = quizState.advancedTrackingData[eventType] || [];
//         quizState.advancedTrackingData[eventType].push({
//             timestamp: new Date(),
//             ...eventData,
//         });
//         logEvent(`Advanced tracking recorded: ${eventType}`, eventData);
//     }
// }
