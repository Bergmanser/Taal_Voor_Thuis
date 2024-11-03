import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";
import { uploadQuizSummary } from "./quiz.js";

// State Management
export let currentQuestionIndex = 0;
export let userResponses = {};
export let attempts = {};
export let feedback = {};
export let startTime = new Date();
let quizData = [];
let selectedOptionIndex = null;
let questionStartTime;
let quizSummary = {};
let correctQuestions = 0;

// Feedback messages
const feedbackMessages = {
    correct: ["Correct!", "Dat klopt!", "Goed gedaan!"],
    firstIncorrect: ["Dat is fout", "Incorrect", "Probeer het opnieuw!"],
    secondIncorrect: ["Helaas, dat is nog steeds fout", "Niet correct", "Blijf oefenen!"]
};

// Save state to localStorage
export const saveState = (quizId) => {
    const state = {
        currentQuestionIndex,
        userResponses,
        attempts,
        feedback,
        selectedOptionIndex,
        startTime: startTime.getTime(),
        questionStartTime: questionStartTime.getTime(),  // Track time spent on question
        correctQuestions
    };
    localStorage.setItem(`quizState_${quizId}`, JSON.stringify(state));
    console.log("State saved to localStorage for quiz:", quizId, state);
};

// Selectively save state only when necessary
// const selectiveSaveState = (quizId) => {
//     // Save state when necessary, like moving to the next question or answering one
//     saveState(quizId);
// };

// Load state from (local)storage
const loadState = async (quizId) => {
    // Attempt to load from local storage first
    let state = JSON.parse(localStorage.getItem(`quizState_${quizId}`));

    if (!state) {
        console.log("No local storage data found, attempting to load from Firestore");
        try {
            const userDocRef = doc(db, "studentdb", auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            const quizData = userDoc.data().quizzes[quizId];

            if (quizData && quizData.state === 'paused') {
                console.log("Paused state found in Firestore, loading quiz state...");
                state = quizData;
            } else {
                console.log("No paused state found in Firestore");
            }
        } catch (error) {
            console.error("Error fetching paused state from Firestore: ", error);
        }
    }

    if (state) {
        currentQuestionIndex = state.currentQuestionIndex;
        userResponses = state.userResponses;
        attempts = state.attempts;
        feedback = state.feedback;
        selectedOptionIndex = state.selectedOptionIndex;
        startTime = new Date(state.startTime);
        questionStartTime = new Date(state.questionStartTime);
        correctQuestions = state.correctQuestions || 0;
        console.log("State loaded from storage for quiz:", quizId, state);

        // Automatically click the start quiz button if state is available
        const startButton = document.getElementById('start-quiz-button');
        if (startButton) {
            startButton.click();
        } else {
            console.error("'start-quiz-button' not found");
        }
    } else {
        console.log("No previous state found for quiz:", quizId);
        startTime = new Date();
        questionStartTime = new Date();
        correctQuestions = 0;
    }
};

// Clear state from localStorage
export const clearState = (quizId) => {
    localStorage.removeItem(`quizState_${quizId}`);
    console.log(`State cleared from localStorage for quiz: ${quizId}`);
    currentQuestionIndex = 0;
    attempts = {};
    feedback = {};
    userResponses = {};
    correctQuestions = 0;
};

// Fetch quiz data
const fetchQuizData = async (quizId) => {
    try {
        console.log(`Fetching quiz data for quizId: ${quizId}`);
        const docRef = doc(db, "quizzes", quizId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const quizDoc = docSnap.data();
            console.log("Quiz data retrieved from Firestore:", quizDoc);
            quizData = quizDoc.Questions;
            console.log("Quiz questions:", quizData);
            document.getElementById('quiz-title').innerText = quizDoc.Title;
            quizData.Title = quizDoc.Title;
            quizData.QuizGroupId = quizDoc.QuizGroupId;
            quizData.QuizType = quizDoc.QuizType;
            loadState();
            displayQuestion();
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error fetching document: ", error);
    }
};

export const displayQuestion = () => {
    const question = quizData[currentQuestionIndex];
    document.getElementById('question-text').innerText = currentQuestionIndex + 1 + ". " + question.Text
    document.getElementById('question-tracker').innerText = `${currentQuestionIndex + 1} / ${quizData.length}`;
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    question.Options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'proto-option';
        optionElement.innerText = `${String.fromCharCode(65 + index)}. ${option}`;
        optionElement.onclick = () => selectOption(index);

        if (feedback[currentQuestionIndex]) {
            feedback[currentQuestionIndex].forEach(attempt => {
                if (attempt.index === index) {
                    if (attempt.correct) {
                        optionElement.classList.add('proto-correct');
                    } else {
                        optionElement.classList.add('proto-incorrect');
                    }
                }
            });
        }

        if (userResponses[currentQuestionIndex] !== undefined || (attempts[currentQuestionIndex] && attempts[currentQuestionIndex].length >= 2)) {
            optionElement.style.pointerEvents = 'none';
            optionElement.style.opacity = '0.6';
        }

        optionsContainer.appendChild(optionElement);
    });

    document.getElementById('prev-button').disabled = currentQuestionIndex === 0;
    document.getElementById('next-button').disabled = selectedOptionIndex === null && userResponses[currentQuestionIndex] === undefined;

    document.getElementById('dialogue-hint').classList.add('hidden');
    document.getElementById('dialogue-answer').classList.add('hidden');

    if (userResponses[currentQuestionIndex] !== undefined && attempts[currentQuestionIndex]) {
        showHint();
        showAnswer();
    }

    if (currentQuestionIndex === quizData.length - 1) {
        document.getElementById('next-button').innerText = 'Finish Quiz';
    } else {
        document.getElementById('next-button').innerText = 'Next';
    }

    document.getElementById('next-button').onclick = handleNextButtonClick;

    questionStartTime = new Date()
    console.log("Question start time recorded:", questionStartTime);
};

const selectOption = (index) => {
    if (attempts[currentQuestionIndex] && attempts[currentQuestionIndex].length >= 2) {
        return;
    }

    selectedOptionIndex = index;
    const options = document.getElementsByClassName('proto-option');
    Array.from(options).forEach((option, idx) => {
        if (!option.classList.contains('proto-correct') && !option.classList.contains('proto-incorrect')) {
            option.classList.remove('proto-selected');
        }
        if (idx === index) {
            option.classList.add('proto-selected');
        }
    });

    document.getElementById('next-button').disabled = false;
    saveState();
};

const handleNextButtonClick = () => {
    if (userResponses[currentQuestionIndex] !== undefined || (attempts[currentQuestionIndex] && attempts[currentQuestionIndex].length >= 2)) {
        moveToNextQuestion();
    } else {
        checkAnswer(selectedOptionIndex);
        clearSelectedClass();
    }
};

const checkAnswer = (index) => {
    const question = quizData[currentQuestionIndex];
    if (!attempts[currentQuestionIndex]) {
        attempts[currentQuestionIndex] = [];
    }

    attempts[currentQuestionIndex].push(index);
    const optionElements = document.getElementsByClassName('proto-option');
    const selectedOptionElement = optionElements[index];

    if (question.CorrectOption === index) {
        feedback[currentQuestionIndex] = feedback[currentQuestionIndex] || [];
        feedback[currentQuestionIndex].push({ index, correct: true });
        userResponses[currentQuestionIndex] = index;
        selectedOptionElement.classList.add('proto-correct');
        logEvent(`Question ${currentQuestionIndex + 1}: Correct on attempt ${attempts[currentQuestionIndex].length}`);
        disableOptions(optionElements);
        showFeedback('correct');
        showAnswer();
        correctQuestions++;
        saveState();
        moveToNextQuestion();
    } else {
        feedback[currentQuestionIndex] = feedback[currentQuestionIndex] || [];
        feedback[currentQuestionIndex].push({ index, correct: false });
        selectedOptionElement.classList.add('proto-incorrect');
        logEvent(`Question ${currentQuestionIndex + 1}: Incorrect on attempt ${attempts[currentQuestionIndex].length}`);

        if (attempts[currentQuestionIndex].length === 2) {
            const correctOptionIndex = question.CorrectOption;
            const correctOptionElement = optionElements[correctOptionIndex];
            correctOptionElement.classList.add('proto-correct');
            feedback[currentQuestionIndex].push({ index: correctOptionIndex, correct: true });
            userResponses[currentQuestionIndex] = index;
            document.getElementById('next-button').disabled = false;
            showFeedback('secondIncorrect');
            showAnswer();
            saveState();
        } else {
            showFeedback('firstIncorrect');
            showHint();
            document.getElementById('next-button').disabled = true;
        }

        if (attempts[currentQuestionIndex].length >= 2) {
            disableOptions(optionElements);
        }

        saveState();
    }

    if (attempts[currentQuestionIndex].length === 1) {
        console.log(`Question ${currentQuestionIndex + 1}: Answered ${index === question.CorrectOption ? 'correctly' : 'incorrectly'} on first attempt.`);
    } else if (attempts[currentQuestionIndex].length === 2) {
        console.log(`Question ${currentQuestionIndex + 1}: Answered ${index === question.CorrectOption ? 'correctly' : 'incorrectly'} on second attempt. Previous attempt: ${attempts[currentQuestionIndex][0]}`);
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
    const options = document.getElementsByClassName('proto-option');
    Array.from(options).forEach(option => option.classList.remove('proto-selected'));
};

const logCurrentScore = () => {
    const scoreWithHints = calculateScoreWithHints();
    const scoreWithoutHints = calculateScoreWithoutHints();
    console.log(`Current score with hints: ${scoreWithHints}`);
    console.log(`Current score without hints: ${scoreWithoutHints}`);
};

const moveToNextQuestion = () => {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        selectedOptionIndex = null;
        clearSelectedClass();
        displayQuestion();
    } else {
        endQuiz();
    }
};

const showHint = () => {
    console.log(`Showing hint for question ${currentQuestionIndex + 1}`);
    document.getElementById('dialogue-hint').innerText = quizData[currentQuestionIndex].Hint;
    document.getElementById('dialogue-hint').classList.remove('hidden');
};

const showAnswer = () => {
    console.log(`Showing answer for question ${currentQuestionIndex + 1}`);
    document.getElementById('dialogue-answer').innerText = quizData[currentQuestionIndex].CorrectOptionDescription;
    document.getElementById('dialogue-answer').classList.remove('hidden');
    document.getElementById('next-button').disabled = false;
};

const endQuiz = async () => {
    const endTime = new Date();
    const totalTime = endTime - startTime;
    const scoreWithHints = calculateScoreWithHints();
    const scoreWithoutHints = calculateScoreWithoutHints();

    quizSummary = {
        title: quizData.Title,
        groupId: quizData.QuizGroupId,
        type: quizData.QuizType,
        state: 'finished',
        time: formatTime(totalTime),
        scoreWithoutHints,
        scoreWithHints,
        correctQuestions,
        totalQuestions: quizData.length,
        dateTime: new Date().toISOString()
    };

    await uploadQuizSummary(quizSummary);
    clearPausedState(quizId);  // Clear paused state for this quiz
    showQuizModal(scoreWithHints, scoreWithoutHints, quizSummary.time, correctQuestions, quizData.length);
};

// Clear paused state in Firestore and local storage
const clearPausedState = async (quizId) => {
    try {
        // Clear paused state from Firestore
        const userDocRef = doc(db, "studentdb", auth.currentUser.uid);
        await updateDoc(userDocRef, {
            [`quizzes.${quizId}`]: {
                state: "finished"
            }
        });
        // Clear local storage
        localStorage.removeItem(`quizState_${quizId}`);
        console.log(`Paused state cleared for quiz: ${quizId}`);
    } catch (error) {
        console.error("Error clearing paused state: ", error);
    }
};

const calculateScoreWithHints = () => {
    const totalQuestions = quizData.length;
    const correctAnswers = correctQuestions;
    return formatScore((correctAnswers / totalQuestions) * 9 + 1);
};

const calculateScoreWithoutHints = () => {
    const totalQuestions = quizData.length;
    let correctFirstAttempt = 0;
    for (let i = 0; i < totalQuestions; i++) {
        if (attempts[i] && attempts[i].length === 1 && feedback[i] && feedback[i][0].correct) {
            correctFirstAttempt++;
        }
    }
    return formatScore((correctFirstAttempt / totalQuestions) * 9 + 1);
};

const formatScore = (score) => {
    return Math.round(score * 10) / 10;
};

const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
};

const logEvent = (message) => {
    console.log(message);
};

document.getElementById('prev-button').onclick = () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        selectedOptionIndex = null;
        clearSelectedClass();
        displayQuestion();
    }
};

document.getElementById('next-button').onclick = handleNextButtonClick;

document.getElementById('clear-button').onclick = () => {
    clearState();
    alert('Local storage cleared.');
    window.location.reload();
};

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');
if (quizId) {
    fetchQuizData(quizId);
}
startTime = new Date();
document.getElementById('quiz-overlay').classList.add('hidden');
document.getElementById('quiz-overlay').style.display = 'none';

window.onload = () => {
    if (quizId) {
        loadState();
        displayQuestion();
    }
};

function showQuizModal(scoreWithHints, scoreWithoutHints, totalTime, correctQuestions, totalQuestions) {
    $('#scoreWithHints').text(scoreWithHints);
    $('#scoreWithoutHints').text(scoreWithoutHints);
    $('#totalTime').text(totalTime);
    $('#correctQuestions').text(correctQuestions);
    $('#totalQuestions').text(totalQuestions);

    setCircleColor('#scoreWithHintsCircle', scoreWithHints);
    setCircleColor('#scoreWithoutHintsCircle', scoreWithoutHints);
    setSummaryColor(correctQuestions, totalQuestions);

    $('#quizOverlay').show();

    const closeButton = document.getElementById('close-button');
    if (closeButton) {
        console.log("Close button found, adding event listener.");
        closeButton.addEventListener('click', closeQuizModal);
    } else {
        console.error("Close button not found.");
    }
}

function closeQuizModal() {
    console.log("Close button clicked");
    $('#quizOverlay').hide();
    window.location.href = "student_dashboard.html";
}

function setCircleColor(circleId, score) {
    const circle = $(circleId);
    const coloredRing = circle.find('.colored-ring');
    circle.removeClass('gold-ring pulsating-glow');
    circle.find('.olive-crown').remove();
    coloredRing.css('border-color', 'transparent');

    if (score === 10) {
        circle.addClass('gold-ring pulsating-glow');
        circle.append('<img src="../public/assets/images/olive_crown.png" class="olive-crown" alt="Olive Crown">');
        coloredRing.css('border-color', 'gold');
    } else if (score >= 5.5 && score <= 9.9) {
        coloredRing.css('border-color', 'green');
    } else {
        coloredRing.css('border-color', 'crimson');
    }
}

function setSummaryColor(correctQuestions, totalQuestions) {
    const summary = $('#correctQuestions');
    if (correctQuestions >= totalQuestions / 2) {
        summary.css('color', 'green');
    } else {
        summary.css('color', 'crimson');
    }
};
