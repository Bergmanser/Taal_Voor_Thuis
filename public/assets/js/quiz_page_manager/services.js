// // Services.js - Firestore and Local Storage Interaction Functions

// import { doc, getDoc, setDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// import { app, auth, db } from "../firebase_config.js";

// // Firestore interaction functions

// /**
//  * Fetch quiz data from Firestore
//  * @param {string} quizId - The ID of the quiz to fetch
//  * @returns {Object|null} The quiz data if found, otherwise null
//  */
// export const fetchQuizData = async (quizId) => {
//     try {
//         const docRef = doc(db, "quizzes", quizId);
//         const docSnap = await getDoc(docRef);
//         return docSnap.exists() ? docSnap.data() : null;
//     } catch (error) {
//         console.error("Error fetching quiz data:", error);
//         return null;
//     }
// };

// /**
//  * Save the paused quiz state to Firestore
//  * @param {string} userUid - The user UID
//  * @param {Object} pausedData - The data to be saved for the paused quiz
//  */
// export const savePausedQuizState = async (userUid, pausedData) => {
//     try {
//         const userDocRef = doc(db, "studentdb", userUid);
//         await setDoc(userDocRef, {
//             quizzes: {
//                 [pausedData.title]: {
//                     ...pausedData,
//                     state: "paused",
//                 },
//             },
//         }, { merge: true });
//         console.log("Paused quiz state saved.");
//     } catch (error) {
//         console.error("Error saving paused quiz state:", error);
//     }
// };

// /**
//  * Delete the oldest paused quiz for the user
//  * @param {string} userUid - The user UID
//  */
// export const deleteOldestPausedQuiz = async (userUid) => {
//     try {
//         const userDocRef = doc(db, "studentdb", userUid);
//         const userDoc = await getDoc(userDocRef);
//         if (userDoc.exists()) {
//             const quizzes = userDoc.data().quizzes || {};
//             const pausedQuizzes = Object.entries(quizzes)
//                 .filter(([, quiz]) => quiz.state === "paused")
//                 .sort((a, b) => new Date(a[1].dateTime) - new Date(b[1].dateTime));

//             if (pausedQuizzes.length > 0) {
//                 const oldestQuizKey = pausedQuizzes[0][0];
//                 await updateDoc(userDocRef, {
//                     [`quizzes.${oldestQuizKey}`]: deleteField(),
//                 });
//                 console.log(`Deleted oldest paused quiz: ${oldestQuizKey}`);
//             }
//         }
//     } catch (error) {
//         console.error("Error deleting oldest paused quiz:", error);
//     }
// };

// /**
//  * Check how many quizzes are currently paused for a user
//  * @param {string} userUid - The user UID
//  * @returns {number} The count of paused quizzes
//  */
// export const checkPausedQuizLimit = async (userUid) => {
//     try {
//         const userDocRef = doc(db, "studentdb", userUid);
//         const userDoc = await getDoc(userDocRef);
//         if (userDoc.exists()) {
//             const quizzes = userDoc.data().quizzes || {};
//             return Object.values(quizzes).filter(quiz => quiz.state === "paused").length;
//         }
//     } catch (error) {
//         console.error("Error checking paused quiz limit:", error);
//     }
//     return 0;
// };

// // Local Storage Interaction Functions

// /**
//  * Save the quiz state to local storage
//  * @param {string} quizId - The ID of the quiz
//  * @param {Object} state - The current state of the quiz
//  */
// export const saveStateToLocalStorage = (quizId, state) => {
//     try {
//         if (!quizId || typeof state !== 'object') {
//             throw new Error("Invalid parameters: quizId must be a string and state must be an object");
//         }
//         localStorage.setItem(`quizState_${quizId}`, JSON.stringify(state));
//         console.log("State saved to localStorage for quiz:", quizId);
//     } catch (error) {
//         console.error("Error saving state to localStorage:", error);
//     }
// };

// /**
//  * Load the quiz state from local storage
//  * @param {string} quizId - The ID of the quiz
//  * @returns {Object|null} The quiz state if found, otherwise null
//  */
// export const loadStateFromLocalStorage = (quizId) => {
//     try {
//         if (!quizId) {
//             throw new Error("Invalid parameter: quizId must be a string");
//         }
//         const savedState = localStorage.getItem(`quizState_${quizId}`);
//         return savedState ? JSON.parse(savedState) : null;
//     } catch (error) {
//         console.error("Error loading state from localStorage:", error);
//         return null;
//     }
// };

// /**
//  * Clear the quiz state from local storage
//  * @param {string} quizId - The ID of the quiz
//  */
// export const clearStateFromLocalStorage = (quizId) => {
//     try {
//         if (!quizId) {
//             throw new Error("Invalid parameter: quizId must be a string");
//         }
//         localStorage.removeItem(`quizState_${quizId}`);
//         console.log(`State cleared from localStorage for quiz: ${quizId}`);
//     } catch (error) {
//         console.error("Error clearing state from localStorage:", error);
//     }
// };

// /**
//  * Check if a quiz state exists in local storage
//  * @param {string} quizId - The ID of the quiz
//  * @returns {boolean} True if the state exists, otherwise false
//  */
// export const isQuizStateInLocalStorage = (quizId) => {
//     try {
//         if (!quizId) {
//             throw new Error("Invalid parameter: quizId must be a string");
//         }
//         return localStorage.getItem(`quizState_${quizId}`) !== null;
//     } catch (error) {
//         console.error("Error checking state in localStorage:", error);
//         return false;
//     }
// };

// // Embedded Text Parsing Functions

// /**
//  * Parse new embedded text format
//  * @param {Document} htmlDoc - The HTML document to parse
//  * @returns {Array} An array of structured data for the text sections
//  */
// export const parseNewEmbeddedTextFormat = (htmlDoc) => {
//     const sections = htmlDoc.querySelectorAll('.section-container');
//     const structuredData = [];

//     sections.forEach((section, index) => {
//         const sectionType = section.querySelector('.section').classList[1];
//         const content = section.querySelector('.section-content');
//         const boldWords = Array.from(content.querySelectorAll('b')).map(b => b.innerText);
//         const borderColor = content.style.borderColor || 'rgb(12, 157, 18)';
//         const textColor = content.style.color || 'rgb(0, 0, 0)';
//         const images = section.querySelectorAll('img');
//         const imageDetails = Array.from(images).map(img => ({
//             src: img.src,
//             positionOnPage: img.style.position || [],
//             backOrForeground: img.closest('.background-section')?.querySelector('.z-index-dropdown')?.value || 'background',
//             containedOrUncontained: img.closest('.background-section')?.querySelector('.containment-dropdown')?.value || 'contained'
//         }));

//         let textContent = content.innerHTML.replace(/<b>|<\/b>/g, '');
//         textContent = highlightBoldWords(textContent, boldWords);

//         structuredData.push({
//             SectionNumber: index + 1,
//             Boldwords: boldWords,
//             BorderColor: borderColor,
//             TextColor: textColor,
//             SectionType: sectionType,
//             Images: Array.from(images).map(img => img.src),
//             ImageDetails: imageDetails,
//             Text: textContent
//         });
//     });

//     return structuredData;
// };

// /**
//  * Highlight bold words in the text
//  * @param {string} text - The text to highlight words in
//  * @param {Array} boldWords - The words to highlight
//  * @returns {string} The text with highlighted words
//  */
// export const highlightBoldWords = (text, boldWords) => {
//     boldWords.forEach(word => {
//         const regex = new RegExp(`(${word})`, 'gi');
//         text = text.replace(regex, '<strong>$1</strong>');
//     });
//     return text;
// };
