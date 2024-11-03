// // Quiz Logic Functions

// import {
//     savePausedQuizState,
//     checkPausedQuizLimit,
//     deleteOldestPausedQuiz,
//     saveStateToLocalStorage,
//     loadStateFromLocalStorage,
//     clearStateFromLocalStorage
// } from "./services.js";
// import {
//     renderQuestion,
//     renderQuizSummaryModal,
//     setRandomBackground
// } from "./uiRenderer.js";

// // Quiz state management variables
// let currentQuestionIndex = 0;
// let userResponses = {};
// let attempts = {};
// let startTime;
// let quizData;
// let currentUserUid; // Added variable for currentUserUid

// /**
//  * Initialize the quiz state
//  * @param {Object} data - The quiz data to initialize
//  * @param {string} userUid - The current user's UID
//  */
// export const initializeQuizState = (data, userUid) => {
//     quizData = data;
//     currentUserUid = userUid;
//     currentQuestionIndex = 0;
//     userResponses = {};
//     attempts = {};
//     startTime = new Date();

//     const savedState = loadStateFromLocalStorage(quizData.id);
//     if (savedState) {
//         currentQuestionIndex = savedState.currentQuestionIndex;
//         userResponses = savedState.userResponses;
//         attempts = savedState.attempts;
//         startTime = new Date() - savedState.sessionLength;
//     }

//     // Set a random background image
//     setRandomBackground();

//     // Render the first question or the resumed question
//     renderQuestion(quizData, currentQuestionIndex);
// };

// /**
//  * Pause the quiz and save the state
//  */
// export const pauseQuiz = async () => {
//     try {
//         const pausedData = {
//             title: quizData.Title,
//             currentQuestionIndex,
//             userResponses,
//             attempts,
//             dateTime: new Date().toISOString(),
//             sessionLength: new Date() - startTime,
//         };
//         await savePausedQuizState(currentUserUid, pausedData);
//         saveStateToLocalStorage(quizData.id, pausedData);
//         console.log("Quiz paused successfully.");
//     } catch (error) {
//         console.error("Error pausing quiz:", error);
//     }
// };

// /**
//  * Resume the quiz from a paused state
//  */
// export const resumeQuiz = () => {
//     const savedState = loadStateFromLocalStorage(quizData.id);
//     if (savedState) {
//         currentQuestionIndex = savedState.currentQuestionIndex;
//         userResponses = savedState.userResponses;
//         attempts = savedState.attempts;
//         startTime = new Date() - savedState.sessionLength;
//         renderQuestion(quizData, currentQuestionIndex);
//         console.log("Quiz resumed from paused state.");
//     } else {
//         console.log("No paused state found, starting new quiz.");
//         initializeQuizState(quizData, currentUserUid);
//     }
// };

// /**
//  * Handle the selection of an answer option
//  * @param {number} optionIndex - The index of the selected option
//  */
// export const handleOptionSelect = (optionIndex) => {
//     if (!attempts[currentQuestionIndex]) {
//         attempts[currentQuestionIndex] = [];
//     }
//     attempts[currentQuestionIndex].push(optionIndex);

//     const question = quizData.Questions[currentQuestionIndex];
//     if (question.CorrectOption === optionIndex) {
//         userResponses[currentQuestionIndex] = optionIndex;
//         console.log(`Question ${currentQuestionIndex + 1}: Correct`);
//     } else {
//         console.log(`Question ${currentQuestionIndex + 1}: Incorrect`);
//     }

//     saveStateToLocalStorage(quizData.id, {
//         currentQuestionIndex,
//         userResponses,
//         attempts,
//     });
// };

// /**
//  * Move to the next question
//  */
// export const handleNextQuestion = () => {
//     if (currentQuestionIndex < quizData.Questions.length - 1) {
//         currentQuestionIndex++;
//         renderQuestion(quizData, currentQuestionIndex);
//     } else {
//         endQuiz();
//     }
// };

// /**
//  * Move to the previous question
//  */
// export const handlePreviousQuestion = () => {
//     if (currentQuestionIndex > 0) {
//         currentQuestionIndex--;
//         renderQuestion(quizData, currentQuestionIndex);
//     }
// };

// /**
//  * Calculate the quiz score
//  * @returns {number} The calculated score
//  */
// export const calculateScore = () => {
//     const totalQuestions = quizData.Questions.length;
//     const correctAnswers = Object.values(userResponses).filter(response => response !== undefined).length;
//     return ((correctAnswers / totalQuestions) * 100).toFixed(2);
// };

// /**
//  * End the quiz, calculate the score, and display summary
//  */
// export const endQuiz = () => {
//     const endTime = new Date();
//     const totalTime = Math.round((endTime - startTime) / 1000); // Time in seconds
//     const score = calculateScore();
//     const correctAnswers = Object.values(userResponses).filter(response => response !== undefined).length;

//     console.log(`Quiz ended. Score: ${score}% Time taken: ${totalTime} seconds`);
//     clearStateFromLocalStorage(quizData.id);

//     const summary = {
//         score,
//         timeTaken: totalTime,
//         correctAnswers,
//         totalQuestions: quizData.Questions.length
//     };

//     renderQuizSummaryModal(summary);
// };

// /**
//  * Handle manual pause before leaving the page
//  */
// window.addEventListener('beforeunload', (event) => {
//     pauseQuiz();
//     event.returnValue = 'Are you sure you want to leave? Your progress has been saved.';
// });
