import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";
import { createQuizStateManager } from "./quiz_state_manager.js";

// Get quiz ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');
const QUIZ_COMPLETED_KEY = `quizCompleted_${quizId}`;

// State Management
let stateManager = null;

// Feedback messages
const feedbackMessages = {
    correct: ["Correct!", "Dat klopt!", "Goed gedaan!"],
    firstIncorrect: ["Dat is fout", "Incorrect", "Probeer het opnieuw!"],
    secondIncorrect: ["Helaas, dat is nog steeds fout", "Niet correct", "Blijf oefenen!"]
};

const handlePageRefresh = async () => {
    try {
        const quizOverlay = document.getElementById('quizOverlay');
        // Ensure quizOverlay exists and is visible before proceeding
        if (quizOverlay && quizOverlay.classList.contains('show')) {
            if (stateManager) {
                console.log("Quiz overlay active, marking quiz as finished...");
                await stateManager.updateQuizState('finished');
            }
            // Redirect to the dashboard
            window.location.href = 'student_dashboard.html';
        } else {
            console.log("Quiz overlay not active, no action taken on refresh.");
        }
    } catch (error) {
        console.error("Error handling page refresh:", error);
    }
};

const handleInitialResume = async () => {
    try {
        if (!stateManager) return;

        const existingState = await stateManager.getExistingPausedState();
        if (existingState?.state === 'paused') {
            console.log('Found paused state, preparing resume');

            // Update UI to show resume option
            const startButton = document.getElementById('start-quiz-button');
            if (startButton) {
                startButton.textContent = 'Continue Quiz';
                startButton.classList.add('resume-button');

                // Replace click handler
                startButton.onclick = async () => {
                    try {
                        await stateManager.handleResumeClick();
                        // Continue with normal quiz flow
                        displayQuestion();
                    } catch (error) {
                        console.error('Error resuming quiz:', error);
                    }
                };
            }
        }
    } catch (error) {
        console.error('Error handling initial resume:', error);
    }
};

const initializeQuiz = async () => {
    try {
        console.log('Initializing quiz...');
        if (!quizId) throw new Error('Quiz ID is missing');

        // Wait for Firebase Auth to initialize
        await new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                if (user) {
                    resolve(user);
                } else {
                    reject(new Error('User not authenticated'));
                }
            });
        });

        const userId = auth.currentUser.uid;
        stateManager = await createQuizStateManager(quizId, userId);

        if (!stateManager) {
            throw new Error('State Manager creation failed');
        }

        await handleInitialResume();

        console.log('StateManager initialized:', stateManager);

        // Check if this is a fresh start (like after retry)
        const isFreshStart = !stateManager.state.startTime ||
            (new Date() - new Date(stateManager.state.startTime)) < 1000;

        if (isFreshStart) {
            console.log('Fresh quiz start detected');
            await fetchQuizData(quizId);
        } else {
            // Check for existing state and handle auto-start
            const hasExistingState = await stateManager.checkExistingState();
            if (hasExistingState) {
                console.log('Found existing state, preparing auto-start...');

                // Load state and verify it's valid for auto-start
                const loadedState = await stateManager.loadState();
                const shouldAutoStart = loadedState &&
                    loadedState.state !== 'finished' &&
                    loadedState.status !== 'finished' &&
                    (
                        loadedState.currentQuestionIndex > 0 ||
                        Object.keys(loadedState.attempts || {}).length > 0 ||
                        Object.keys(loadedState.userResponses || {}).length > 0 ||
                        loadedState.state === 'paused'
                    );

                if (shouldAutoStart) {
                    console.log('Valid active state loaded, triggering auto-start...');
                    // Wait for DOM to be fully ready
                    await new Promise(resolve => {
                        if (document.readyState === 'complete') {
                            resolve();
                        } else {
                            window.addEventListener('load', resolve);
                        }
                    });

                    const startButton = document.getElementById('start-quiz-button');
                    if (startButton) {
                        console.log('Triggering auto-start...');
                        setTimeout(() => startButton.click(), 100);
                    } else {
                        console.error("'start-quiz-button' not found");
                    }
                } else {
                    console.log('State loaded but not eligible for auto-start');
                    await fetchQuizData(quizId);
                }
            } else {
                console.log('No existing state found, waiting for user to start quiz');
                await fetchQuizData(quizId);
            }
        }

        // Ensure we have quiz data
        if (!stateManager.state.quizData || stateManager.state.quizData.length === 0) {
            await fetchQuizData(quizId);
        }

        displayQuestion();

    } catch (error) {
        console.error('Error initializing quiz:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Failed to initialize quiz: ${error.message}`;
            errorElement.style.display = 'block';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem(QUIZ_COMPLETED_KEY) === 'true') {
        console.log('Quiz was completed, redirecting to dashboard');
        localStorage.removeItem(QUIZ_COMPLETED_KEY);
        window.location.href = 'student_dashboard.html';
        return;
    }

    if (quizId) {
        const errorElement = document.getElementById('error-message');

        initializeQuiz().catch(error => {
            console.error('Failed to initialize quiz:', error);
            if (errorElement) {
                errorElement.textContent = `Failed to initialize quiz: ${error.message}`;
                errorElement.style.display = 'block';
            }
        });
    } else {
        console.error('No quiz ID provided in URL');
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'No quiz ID provided';
            errorElement.style.display = 'block';
        }
    }

    // Warn the user before leaving if quiz state is active and unsaved
    window.addEventListener('beforeunload', (event) => {
        const quizOverlay = document.getElementById('quizOverlay');
        if (stateManager &&
            stateManager.state.status === "active" &&
            !localStorage.getItem(QUIZ_COMPLETED_KEY) &&
            quizOverlay && !quizOverlay.classList.contains('hidden')) {
            // Prompt user with a warning message
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return event.returnValue;
        }
    });

    // Handle the page unload logic explicitly
    window.addEventListener('unload', async () => {
        const quizOverlay = document.getElementById('quizOverlay');
        if (quizOverlay && quizOverlay.classList.contains('show')) {
            try {
                await handlePageRefresh();
            } catch (error) {
                console.error('Error during page unload:', error);
            }
        }
    });

});

// Modify fetchQuizData function
const fetchQuizData = async (quizId) => {
    try {
        if (!stateManager) {
            throw new Error("StateManager instance is not created.");
        }

        if (!stateManager.initialized) {
            throw new Error("StateManager is not initialized.");
        }

        console.log(`Fetching quiz data for quizId: ${quizId}`);
        const docRef = doc(db, "quizzes", quizId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const quizDoc = docSnap.data();
            console.log("Quiz data retrieved from Firestore:", quizDoc);

            // Update state manager with quiz data
            stateManager.state.quizTitle = quizDoc.Title;
            stateManager.state.quizData = quizDoc.Questions;

            // Update UI
            const titleElement = document.getElementById('quiz-title');
            if (titleElement) {
                titleElement.innerText = quizDoc.Title;
            }

            // Save state after getting fresh data
            await stateManager.saveQuizState();

            return true;
        } else {
            console.error("No quiz data found in Firestore.");
            return false;
        }
    } catch (error) {
        console.error("Error fetching quiz data:", error);
        throw error; // Re-throw to be handled by the calling function
    }
};

// Clear state from localStorage
export const clearState = async (quizId) => {
    try {
        if (!stateManager) {
            throw new Error("StateManager not initialized");
        }
        await stateManager.clearState();
        console.log(`State cleared for quiz: ${quizId}`);
    } catch (error) {
        console.error('Error clearing state:', error);
    }
};

const displayQuestion = async () => {
    try {
        // Check initialization status
        if (!stateManager || !stateManager.initialized) {
            console.log("Wachten op initialisatie...");
            await new Promise(resolve => setTimeout(resolve, 100));
            return displayQuestion(); // Retry
        }

        const { currentQuestionIndex, quizData, attempts, feedback, userResponses } = stateManager.state;

        // Enhanced state validation
        if (!quizData || !Array.isArray(quizData)) {
            console.error('Ongeldige quiz data:', { quizData });
            throw new Error('Quiz data is niet correct geladen');
        }

        if (currentQuestionIndex === undefined || currentQuestionIndex < 0) {
            console.error('Ongeldige vraag index:', currentQuestionIndex);
            throw new Error('Ongeldige vraag index');
        }

        const question = quizData[currentQuestionIndex];
        if (!question) {
            console.error('Vraag niet gevonden voor index:', currentQuestionIndex);
            throw new Error('Vraag niet gevonden');
        }

        if (typeof question.Text !== 'string' || !Array.isArray(question.Options)) {
            console.error('Ongeldige vraag data:', question);
            throw new Error('Ongeldige vraag structuur');
        }

        // Update question text and tracker
        const questionText = document.getElementById('question-text');
        const questionTracker = document.getElementById('question-tracker');

        if (!questionText || !questionTracker) {
            throw new Error('Vereiste UI elementen niet gevonden');
        }

        questionText.innerText = `${currentQuestionIndex + 1}. ${question.Text}`;
        questionTracker.innerText = `${currentQuestionIndex + 1} / ${quizData.length}`;

        // Handle options container
        const optionsContainer = document.getElementById('options-container');
        if (!optionsContainer) {
            throw new Error('Options container niet gevonden');
        }
        optionsContainer.innerHTML = '';

        // Create options elements
        question.Options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'proto-option';
            optionElement.innerText = `${String.fromCharCode(65 + index)}. ${option}`;

            // Attach click handler only if question isn't completed
            const isQuestionCompleted = userResponses[currentQuestionIndex] !== undefined ||
                (attempts[currentQuestionIndex]?.length >= 2);

            if (!isQuestionCompleted) {
                optionElement.onclick = () => selectOption(index);
            }

            // Handle previous attempts styling
            const questionFeedback = feedback[currentQuestionIndex] || [];
            questionFeedback.forEach(attempt => {
                if (attempt.selectedOption === index) {
                    optionElement.classList.add(attempt.correct ? 'proto-correct' : 'proto-incorrect');
                }
            });

            // Show correct answer for completed questions
            if (isQuestionCompleted && index === question.CorrectOption) {
                optionElement.classList.add('proto-correct');
            }

            // Apply completed question styling
            if (isQuestionCompleted) {
                optionElement.style.pointerEvents = 'none';
                optionElement.style.opacity = '0.6';
            }

            optionsContainer.appendChild(optionElement);
        });

        // Handle button states
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');

        if (!prevButton || !nextButton) {
            throw new Error('Navigatie knoppen niet gevonden');
        }

        prevButton.disabled = currentQuestionIndex === 0;
        nextButton.disabled = stateManager.state.selectedOptionIndex === null &&
            userResponses[currentQuestionIndex] === undefined;

        // Handle hint and answer visibility
        const dialogueHint = document.getElementById('dialogue-hint');
        const dialogueAnswer = document.getElementById('dialogue-answer');

        if (dialogueHint && dialogueAnswer) {
            // Hide both initially
            dialogueHint.classList.add('hidden');
            dialogueAnswer.classList.add('hidden');

            // Show for completed questions
            if (userResponses[currentQuestionIndex] !== undefined ||
                (attempts[currentQuestionIndex]?.length >= 2)) {
                showHint();
                showAnswer();
            }
        }

        // Update next button text
        nextButton.innerText = currentQuestionIndex === quizData.length - 1 ?
            'Voltooi Quiz' : 'Volgende';
        nextButton.onclick = handleNextButtonClick;

    } catch (error) {
        console.error('Fout bij het weergeven van de vraag:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Er is een fout opgetreden bij het laden van de vraag. Vernieuw de pagina om het opnieuw te proberen.';
            errorElement.style.display = 'block';
        }

        // Show toast notification for error
        if (stateManager?.showDutchToast) {
            stateManager.showDutchToast(
                'Fout bij het laden van de vraag. Probeer het opnieuw.',
                'error'
            );
        }
    }
};

const selectOption = async (index) => {
    try {
        if (!stateManager || !stateManager.initialized) {
            console.error('StateManager not initialized');
            return;
        }

        const currentIndex = stateManager.state.currentQuestionIndex;
        const attempts = stateManager.state.attempts;

        if (attempts[currentIndex] && attempts[currentIndex].length >= 2) return;

        stateManager.state.selectedOptionIndex = index;
        await stateManager.saveQuizState(true); // Immediate save

        const options = document.getElementsByClassName('proto-option');
        Array.from(options).forEach((option, idx) => {
            if (!option.classList.contains('proto-correct') &&
                !option.classList.contains('proto-incorrect')) {
                option.classList.remove('proto-selected');
            }
            if (idx === index && !option.classList.contains('proto-incorrect')) {
                option.classList.add('proto-selected');
            }
        });

        const nextButton = document.getElementById('next-button');
        if (nextButton) nextButton.disabled = false;

    } catch (error) {
        console.error('Error in selectOption:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Error selecting option: ${error.message}`;
            errorElement.style.display = 'block';
        }
    }
};

const handleNextButtonClick = async () => {
    try {
        const { currentQuestionIndex, userResponses, attempts } = stateManager.state;

        if (userResponses[currentQuestionIndex] !== undefined ||
            (attempts[currentQuestionIndex] && attempts[currentQuestionIndex].length >= 2)) {
            await moveToNextQuestion();
        } else {
            checkAnswer(stateManager.state.selectedOptionIndex);
            clearSelectedClass();
        }
    } catch (error) {
        console.error('Error handling next button:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Error processing next question. Please try again.';
            errorElement.style.display = 'block';
        }
    }
};

const checkAnswer = async (index) => {
    try {
        const { currentQuestionIndex, quizData } = stateManager.state;
        const question = quizData[currentQuestionIndex];
        const isCorrect = question.CorrectOption === index;

        // Record attempt in state manager
        await stateManager.saveAttempts(currentQuestionIndex, index, {
            selectedOption: index,
            correct: isCorrect
        });

        const optionElements = document.getElementsByClassName('proto-option');
        const selectedOptionElement = optionElements[index];

        if (isCorrect) {
            // Handle correct answer
            selectedOptionElement.classList.add('proto-correct');
            showFeedback('correct');
            showAnswer();
            disableOptions(optionElements);
            stateManager.state.userResponses[currentQuestionIndex] = index;
            moveToNextQuestion();
        } else {
            // Handle incorrect answer
            selectedOptionElement.classList.add('proto-incorrect');
            // Add wiggle animation
            selectedOptionElement.classList.add('wiggle');
            // Remove wiggle class after animation completes
            selectedOptionElement.addEventListener('animationend', () => {
                selectedOptionElement.classList.remove('wiggle');
            }, { once: true });

            const attemptCount = stateManager.state.attempts[currentQuestionIndex].length;

            if (attemptCount >= 2) {
                // Show correct answer after second attempt
                const correctOptionElement = optionElements[question.CorrectOption];
                correctOptionElement.classList.add('proto-correct');
                showFeedback('secondIncorrect');
                showAnswer();
                disableOptions(optionElements);
                document.getElementById('next-button').disabled = false;
            } else {
                // First incorrect attempt
                showFeedback('firstIncorrect');
                showHint();
                document.getElementById('next-button').disabled = true;
            }
        }

        stateManager.saveQuizState();

    } catch (error) {
        console.error('Error checking answer:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Error checking answer. Please try again.';
            errorElement.style.display = 'block';
        }
    }
};

const showFeedback = (status) => {
    const feedbackMessage = feedbackMessages[status][Math.floor(Math.random() * feedbackMessages[status].length)];
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `proto-feedback-message ${status}`;
    feedbackElement.innerText = feedbackMessage;
    document.body.appendChild(feedbackElement);

    feedbackElement.style.opacity = 0;

    setTimeout(() => {
        feedbackElement.style.opacity = 1;
        setTimeout(() => {
            feedbackElement.style.opacity = 0;
            setTimeout(() => {
                document.body.removeChild(feedbackElement);
            }, 5000);
        }, 5000);
    }, 10);
};

const disableOptions = (optionElements) => {
    Array.from(optionElements).forEach((option) => {
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.6';
    });
};

const clearSelectedClass = () => {
    if (stateManager) {
        stateManager.state.selectedOptionIndex = null;
    }
    const options = document.getElementsByClassName('proto-option');
    Array.from(options).forEach(option => option.classList.remove('proto-selected'));
};

// const logCurrentScore = () => {
//     const scores = stateManager.calculatePartialScores();
//     console.log(`Score without hints: ${scores.firstAttemptCorrect}`);
//     console.log(`Score with hints: ${scores.totalCorrect}`);
// };

const moveToNextQuestion = async () => {
    try {
        const { currentQuestionIndex, quizData } = stateManager.state;
        stateManager.stopQuestionTimer(currentQuestionIndex);

        if (currentQuestionIndex < quizData.length - 1) {
            await stateManager.saveQuizState(true); // Save current state

            stateManager.state.currentQuestionIndex++;
            stateManager.state.selectedOptionIndex = null;
            clearSelectedClass();

            await stateManager.saveQuizState(true); // Save new state
            displayQuestion();
            stateManager.startQuestionTimer();

            // Keep handleQuestionCompleted for periodic saves
            await stateManager.handleQuestionCompleted();
        } else {
            await endQuiz();
        }
    } catch (error) {
        console.error('Error moving to next question:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Error moving to next question. Please try again.';
            errorElement.style.display = 'block';
        }
    }
}

const showHint = () => {
    const { currentQuestionIndex, quizData } = stateManager.state;
    const hintElement = document.getElementById('dialogue-hint');
    if (hintElement && quizData[currentQuestionIndex]) {
        hintElement.innerText = quizData[currentQuestionIndex].Hint;
        hintElement.classList.remove('hidden');
    }
};

const showAnswer = () => {
    const { currentQuestionIndex, quizData } = stateManager.state;
    const answerElement = document.getElementById('dialogue-answer');
    if (answerElement && quizData[currentQuestionIndex]) {
        answerElement.innerText = quizData[currentQuestionIndex].CorrectOptionDescription;
        answerElement.classList.remove('hidden');
        document.getElementById('next-button').disabled = false;
    }
};

const endQuiz = async () => {
    try {
        if (!stateManager || !stateManager.state) {
            throw new Error('State manager not properly initialized');
        }

        // Calculate scores and total time
        const endTime = new Date();
        const totalTime = endTime - stateManager.state.startTime;
        const scores = stateManager.calculatePartialScores();

        console.log('Scores calculated:', scores);

        // Stop timer for the last question
        stateManager.stopQuestionTimer(stateManager.state.currentQuestionIndex);

        // Update state to finished
        await stateManager.updateQuizState('finished');

        // Prepare quiz data for saving
        const quizData = {
            title: stateManager.state.quizTitle,
            state: 'finished',
            status: 'finished',
            time: formatTime(totalTime),
            timeInMs: totalTime,
            scoreWithoutHints: scores.firstAttemptCorrect,
            scoreWithHints: scores.totalCorrect,
            totalQuestions: stateManager.state.quizData.length,
            dateCompleted: new Date().toISOString(),
            questionAnalytics: generateQuestionAnalytics(),
            quizId: stateManager.quizId,
            userId: stateManager.userId,
            groupId: stateManager.state.quizData?.QuizGroupId || "1000",
            type: stateManager.state.quizData?.QuizType || "anders"
        };

        console.log('Quiz data prepared:', quizData);

        // Save data to Firestore
        const result = await updateQuizInFirestore(quizData);
        console.log('Quiz data saved successfully:', result);

        // Clear local state for retry functionality
        localStorage.removeItem(stateManager.getStorageKey());
        localStorage.setItem(QUIZ_COMPLETED_KEY, 'true');

        // Show completion modal
        showQuizModal(
            scores.totalCorrect,
            scores.firstAttemptCorrect,
            quizData.time,
            scores.totalCorrect,
            stateManager.state.quizData.length
        );
    } catch (error) {
        console.error('Error ending quiz:', error);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Error completing quiz: ${error.message}`;
            errorElement.style.display = 'block';
        }
    }
};

const generateQuestionAnalytics = () => {
    const analytics = {};
    const { attempts, feedback, quizData } = stateManager.state;

    quizData.forEach((_, index) => {
        // Initialize default analytics for each question
        analytics[index] = {
            attemptCount: 0,
            correctOnFirst: false,
            timeSpent: stateManager.getQuestionTime(index) || 0,
            attempts: []
        };

        // Only add attempt data if it exists
        if (attempts[index] && Array.isArray(attempts[index])) {
            analytics[index].attemptCount = attempts[index].length;

            // Safely check feedback
            if (feedback[index] && Array.isArray(feedback[index])) {
                analytics[index].correctOnFirst = feedback[index][0]?.correct || false;

                // Map attempts with safe access
                analytics[index].attempts = attempts[index].map((attempt, i) => ({
                    selectedOption: attempt,
                    correct: feedback[index][i]?.correct || false,
                    timestamp: feedback[index][i]?.timestamp || new Date().toISOString()
                }));
            }
        }
    });

    // Add timing information
    analytics.totalInactiveTime = stateManager.getTotalInactiveTime() || 0;
    analytics.totalActiveTime = calculateTotalActiveTime(
        stateManager.state.startTime || Date.now(),
        stateManager.getTotalInactiveTime() || 0
    );

    return analytics;
};

// Helper function to calculate total active time
const calculateTotalActiveTime = (startTime, inactiveTime) => {
    const totalTime = Date.now() - startTime;
    return Math.max(0, totalTime - inactiveTime);
};

const updateQuizInFirestore = async (quizData) => {
    try {
        if (!stateManager || !stateManager.userId || !stateManager.quizId) {
            throw new Error('Missing required state manager data');
        }

        console.log('Initial quizData:', quizData);

        // Fetch original quiz data to get metadata
        const quizRef = doc(db, "quizzes", stateManager.quizId);
        const quizSnap = await getDoc(quizRef);
        const originalQuiz = quizSnap.exists() ? quizSnap.data() : null;

        console.log('Original quiz data:', originalQuiz);
        const userRef = doc(db, "studentdb", stateManager.userId);

        // Create complete quiz data object with metadata from original quiz
        const completeQuizData = {
            dateTime: quizData.dateCompleted || new Date().toISOString(),
            title: quizData.title || originalQuiz?.Title || "",
            state: quizData.state || "finished",
            status: quizData.status || "finished", // Keep both synchronized
            time: quizData.time || "0:00",
            timeInMs: quizData.timeInMs || 0,
            scoreWithHints: quizData.scoreWithHints || 0,
            scoreWithoutHints: quizData.scoreWithoutHints || 0,
            totalQuestions: quizData.totalQuestions || 0,
            questionAnalytics: quizData.questionAnalytics || {},
            groupId: originalQuiz?.QuizGroupId || "1000",
            type: originalQuiz?.QuizType || "anders",
            userId: stateManager.userId,
            quizId: stateManager.quizId,
            lastUpdated: new Date().toISOString()
        };

        // Get existing data
        const docSnap = await getDoc(userRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};

        // Prepare update data while preserving other quizzes
        const updateData = {
            quizzes: {
                ...existingData.quizzes,
                [stateManager.quizId]: completeQuizData
            }
        };

        // Update with merge to preserve other data
        await setDoc(userRef, updateData, { merge: true });

        // Update pause status if needed
        if (completeQuizData.state === 'finished') {
            await stateManager.updatePauseStatus();
        }

        console.log('Successfully updated quiz data in Firestore');
        return true;
    } catch (error) {
        console.error('Error updating quiz in Firestore:', error);
        throw error;
    }
};

const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
};

document.getElementById('prev-button').onclick = async () => {
    try {
        const { currentQuestionIndex } = stateManager.state;
        if (currentQuestionIndex > 0) {
            // Save current state before moving
            await stateManager.saveQuizState(true);

            stateManager.state.currentQuestionIndex--;
            stateManager.state.selectedOptionIndex = null;

            // Save new state immediately
            await stateManager.saveQuizState(true);

            clearSelectedClass();
            displayQuestion();
        }
    } catch (error) {
        console.error('Error handling previous button:', error);
    }
};

// Next button handler
document.getElementById('next-button').onclick = handleNextButtonClick;

// Clear button handler
document.getElementById('clear-button').onclick = async () => {
    try {
        await stateManager.updateQuizState('finished');
        alert('Quiz state cleared.');
        window.location.reload();
    } catch (error) {
        console.error('Error clearing state:', error);
    }
};

const initializeQuizOverlay = () => {
    const quizOverlay = document.getElementById('quiz-overlay');
    if (quizOverlay) {
        quizOverlay.classList.add('hidden');
        quizOverlay.style.display = 'none';
    }
};

// Call it in your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    initializeQuizOverlay();
    if (quizId) {
        initializeQuiz().catch(error => {
            console.error('Failed to initialize quiz:', error);
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.textContent = `Failed to initialize quiz: ${error.message}`;
                errorElement.style.display = 'block';
            }
        });
    }
});

function showQuizModal(scoreWithHints, scoreWithoutHints, totalTime, correctQuestions, totalQuestions) {
    localStorage.setItem(QUIZ_COMPLETED_KEY, 'true');

    // Hide navigation buttons
    const navButtons = document.querySelectorAll('.nav-buttons-container, #pause-quiz-button, #word-list-button');
    navButtons.forEach(button => button.style.display = 'none');

    // Update scores and display
    document.querySelector('#scoreWithHints').textContent = scoreWithHints;
    document.querySelector('#scoreWithoutHints').textContent = scoreWithoutHints;
    document.querySelector('#totalTime').textContent = totalTime;
    document.querySelector('#correctQuestions').textContent = correctQuestions;
    document.querySelector('#totalQuestions').textContent = totalQuestions;

    // Set colors
    setCircleColor('#scoreWithHintsCircle', scoreWithHints);
    setCircleColor('#scoreWithoutHintsCircle', scoreWithoutHints);
    setSummaryColor(correctQuestions, totalQuestions);

    // Show overlay
    const overlay = document.querySelector('#quizOverlay');
    overlay.style.display = 'flex';
    overlay.classList.add('show');

    // Add close button listener
    const closeButton = document.querySelector('#close-button');
    if (closeButton) {
        closeButton.addEventListener('click', closeQuizModal);
    }
}

if (localStorage.getItem('quizCompleted') === 'true') {
    window.location.href = 'student_dashboard.html';
    localStorage.removeItem('quizCompleted'); // Clean up
}

async function closeQuizModal() {
    console.log("Close button clicked");
    $('#quizOverlay').hide();

    // State should already be finished, but ensure it
    if (stateManager) {
        await stateManager.updateQuizState('finished');
    }

    window.location.href = "student_dashboard.html";
}

function setCircleColor(circleId, score) {
    const circle = document.querySelector(circleId);
    const coloredRing = circle.querySelector('.proto-colored-ring');

    // Remove existing classes
    circle.classList.remove('perfect-score', 'proto-pulsating-glow');
    coloredRing.style.borderColor = 'transparent';

    // Remove existing crown
    const existingCrown = circle.querySelector('.proto-olive-crown');
    if (existingCrown) {
        existingCrown.remove();
    }

    // Set ring color based on score
    if (score >= 5.5 && score < 10) {
        coloredRing.style.borderColor = 'green';
    } else if (score < 5.5) {
        coloredRing.style.borderColor = 'crimson';
    }

    // Add perfect score effects only if score is 10
    if (score === 10) {
        circle.classList.add('perfect-score');
        coloredRing.style.borderColor = 'gold';

        // Create glow container
        const glowContainer = document.createElement('div');
        glowContainer.classList.add('proto-pulsating-glow');
        circle.appendChild(glowContainer);

        // Add crown
        const crown = document.createElement('img');
        crown.src = '../public/assets/images/olive_crown.png';
        crown.classList.add('proto-olive-crown');
        crown.alt = 'Olive Crown';
        circle.appendChild(crown);
    }
}

function setSummaryColor(correctQuestions, totalQuestions) {
    const summary = $('#correctQuestions');
    if (correctQuestions >= totalQuestions / 2) {
        summary.css('color', 'green');
    } else {
        summary.css('color', 'crimson');
    }
}
