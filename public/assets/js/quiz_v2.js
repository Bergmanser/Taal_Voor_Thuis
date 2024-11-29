// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// import { app, auth, db } from "./firebase_config.js";
// import { redirectUserBasedOnRole } from "./roleRedirect.js";
// // import { attempts, feedback, userResponses, startTime, currentQuestionIndex } from "./quiz_question_proto.js"
// import { attempts, feedback, userResponses } from "./quiz_question_proto.js"

// // import { initScreenReader } from '../js/screenreader_quiztext.js';
// // import { ScreenReaderService, textHighlighter, NavigationControls, ScreenReaderMenu } from '../js/screenreader_quiztext.js';

// export let quizData;
// let currentUserUid = null;
// let currentQuestionIndex = 0;
// let pausedTime = 0;
// let pausedQuizzes = [];
// let userInteractions = {
//     scrollBehavior: {},
//     mousePath: {},
//     navigationHistory: []
// };

// document.addEventListener("DOMContentLoaded", function () {
//     // Array of background image URLs
//     const backgroundImages = [
//         '/public/assets/images/quiz_background_1.png',
//         '/public/assets/images/quiz_background_2.png',
//         '/public/assets/images/quiz_background_3.png',
//         '/public/assets/images/quiz_background_4.png',
//         '/public/assets/images/quiz_background_5.png'
//     ];

//     function setRandomBackground() {
//         const randomIndex = Math.floor(Math.random() * backgroundImages.length);
//         const selectedImage = backgroundImages[randomIndex];
//         console.log('Selected Background Image:', selectedImage);
//         document.body.style.backgroundImage = `url(${selectedImage})`;
//     }

//     console.log('Running setRandomBackground');
//     setRandomBackground();
// });

// const getCssClassForTag = (tag) => {
//     const tagName = tag.toLowerCase();
//     switch (tagName) {
//         case 'h1':
//             return 'embedded-text-h1';
//         case 'h2':
//             return 'embedded-text-h2';
//         case 'h3':
//             return 'embedded-text-h3';
//         case 'h4':
//             return 'embedded-text-h4';
//         case 'p':
//             return 'embedded-text-p';
//         case 'b':
//             return 'embedded-text-b';
//         case 'strong':
//             return 'embedded-text-strong';
//         case 'img':
//             return 'embedded-text-img';
//         case 'span':
//             return 'embedded-text-span';
//         default:
//             return 'embedded-text-default';
//     }
// };

// const displayTextSections = (processedTextSections, oldFormat) => {
//     const textContainer = document.getElementById('text-section-container');
//     textContainer.innerHTML = '';

//     if (oldFormat) {
//         processedTextSections.forEach((section, index) => {
//             const sectionDiv = document.createElement('div');
//             sectionDiv.className = 'embedded-text-section';
//             sectionDiv.innerHTML = `<div class="embedded-text">${section}</div>`;
//             textContainer.appendChild(sectionDiv);
//         });
//     } else {
//         processedTextSections.forEach((section, index) => {
//             const sectionDiv = document.createElement('div');
//             sectionDiv.className = `embedded-text-section ${section.SectionType}`;

//             if (section.SectionType === 'middle-section') {
//                 handleMiddleSection(section, sectionDiv);
//             } else {
//                 const textDiv = document.createElement('div');
//                 textDiv.className = 'embedded-text';
//                 textDiv.style.borderColor = section.BorderColor;
//                 textDiv.style.color = section.TextColor;
//                 textDiv.innerHTML = section.Text;
//                 sectionDiv.appendChild(textDiv);

//                 if (section.Images.length) {
//                     const imagesDiv = document.createElement('div');
//                     imagesDiv.className = 'embedded-images';
//                     section.Images.forEach((imgSrc, imgIndex) => {
//                         const imgElement = document.createElement('img');
//                         imgElement.src = imgSrc;
//                         imgElement.alt = `Image ${imgIndex + 1}`;
//                         imgElement.style.position = section.ImageDetails[imgIndex].positionOnPage;
//                         imagesDiv.appendChild(imgElement);
//                     });
//                     sectionDiv.appendChild(imagesDiv);
//                 }
//             }

//             textContainer.appendChild(sectionDiv);
//         });
//     }
// };

// const handleMiddleSection = (section, sectionDiv) => {
//     const leftImgElement = document.createElement('div');
//     leftImgElement.className = 'embedded-image-middlesection';
//     if (section.Images[0]) {
//         const imgElement = document.createElement('img');
//         imgElement.src = section.Images[0];
//         imgElement.alt = 'Image 1';
//         leftImgElement.appendChild(imgElement);
//     }

//     const rightImgElement = document.createElement('div');
//     rightImgElement.className = 'embedded-image-middlesection';
//     if (section.Images[1]) {
//         const imgElement = document.createElement('img');
//         imgElement.src = section.Images[1];
//         imgElement.alt = 'Image 2';
//         rightImgElement.appendChild(imgElement);
//     }

//     const textDiv = document.createElement('div');
//     textDiv.className = 'embedded-text';
//     textDiv.style.borderColor = section.BorderColor;
//     textDiv.style.color = section.TextColor;
//     textDiv.innerHTML = section.Text;

//     sectionDiv.appendChild(leftImgElement);
//     sectionDiv.appendChild(textDiv);
//     sectionDiv.appendChild(rightImgElement);
// };


// const highlightBoldWords = (text, boldWords) => {
//     boldWords.forEach(word => {
//         const regex = new RegExp(`(${word})`, 'gi');
//         text = text.replace(regex, '<strong>$1</strong>');
//     });
//     return text;
// };

// const parseNewEmbeddedTextFormat = (htmlDoc) => {
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
//             backOrForeground: img.closest('.background-section').querySelector('.z-index-dropdown').value || 'background',
//             containedOrUncontained: img.closest('.background-section').querySelector('.containment-dropdown').value || 'contained'
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

//     console.log("Structured Data:", structuredData); // Added log statement

//     return structuredData;
// };

// const textContainer = document.querySelector('.text-section-container');

// // Function to start the quiz, handling both fresh starts and resuming a paused quiz
// const startQuiz = (isResumed = false) => {
//     // Declare startTime locally
//     let startTime;

//     if (isResumed) {
//         console.log("Resuming quiz from paused state...");
//         // Use the restored pausedTime if available
//         startTime = new Date(new Date().getTime() - pausedTime);  // Set startTime based on paused session length
//     } else {
//         console.log("Starting a new quiz...");
//         startTime = new Date();  // Fresh quiz, start time is now
//         currentQuestionIndex = 0; // Reset to the first question for a new quiz
//         userResponses = {}; // Clear any previous responses
//         attempts = {};
//         feedback = {};
//         correctQuestions = 0;
//     }

//     // Hide the "Start Quiz" button and show the pause button
//     document.getElementById('start-quiz-button').style.display = 'none';
//     document.getElementById('pause-quiz-button').style.display = 'block';
//     document.getElementById('word-list-button').style.display = 'block';

//     // // Load the question based on the current progress (restored or fresh)
//     // displayQuestion(); // Use displayQuestion to show the current question

//     // Start tracking user interactions (scroll, mouse path, etc.)
//     startTracking();

//     // Log the startTime if you need to verify
//     console.log("Quiz started at:", startTime);
// };

// // onAuthStateChanged(auth, (user) => {
// //     if (user) {
// //         currentUserUid = user.uid;
// //         console.log('Current User Email:', user.email, 'User Uid:', currentUserUid);
// //         const quizId = getQuizIdFromURL();
// //         const docRef = doc(db, 'quizzes', quizId);

// //         getDoc(docRef)
// //             .then((docSnap) => {
// //                 if (docSnap.exists()) {
// //                     quizData = docSnap.data();
// //                     document.getElementById('quiz-title').innerText = quizData.quizTitle;

// //                     if (quizData.embedTextHTML) {
// //                         const htmlDoc = new DOMParser().parseFromString(quizData.embedTextHTML, 'text/html');
// //                         const sections = htmlDoc.querySelectorAll('*');

// //                         let currentSection;
// //                         let previousElementClass = '';

// //                         sections.forEach((section, index) => {
// //                             const tagName = section.tagName.toLowerCase();
// //                             const cssClass = getCssClassForTag(tagName);
// //                             const content = section.innerHTML.trim();

// //                             if (tagName === 'h1') {
// //                                 if (currentSection) {
// //                                     textContainer.appendChild(currentSection);
// //                                 }
// //                                 currentSection = document.createElement('div');
// //                                 currentSection.className = 'text-section';
// //                             }

// //                             if (currentSection) {
// //                                 const element = document.createElement('div');
// //                                 element.className = cssClass;
// //                                 element.innerHTML = content;
// //                                 currentSection.appendChild(element);
// //                             }

// //                             if (index === sections.length - 1 && currentSection) {
// //                                 textContainer.appendChild(currentSection);
// //                             }

// //                             previousElementClass = cssClass;
// //                         });

// //                         document.getElementById('start-quiz-button').style.display = 'block';
// //                     } else {
// //                         document.querySelector('.embedded-text-section').innerText = 'No embedded text provided.';
// //                     }

// //                     // const screenReaderToolbar = document.querySelector('.screenreader-toolbar-container');
// //                     // screenReaderToolbar.classList.remove('hidden');
// //                     // const autoScrollDropdownButton = document.getElementById('auto-scroll-dropdown-button');
// //                     // const autoScrollDropdown = document.getElementById('auto-scroll-dropdown');
// //                     // const autoScrollOptions = document.querySelectorAll('.auto-scroll-option');

// //                     // autoScrollDropdownButton.addEventListener('click', () => {
// //                     //     const isExpanded = autoScrollDropdownButton.getAttribute('aria-expanded') === 'true';
// //                     //     autoScrollDropdownButton.setAttribute('aria-expanded', !isExpanded);
// //                     //     autoScrollDropdown.style.display = !isExpanded ? 'block' : 'none';
// //                     // });

// //                     // autoScrollOptions.forEach((option) => {
// //                     //     option.addEventListener('click', (event) => {
// //                     //         const value = event.target.getAttribute('data-value');
// //                     //         autoScrollDropdownButton.setAttribute('aria-expanded', 'false');
// //                     //         autoScrollDropdown.style.display = 'none';
// //                     //         document.getElementById('auto-scroll-button-text').textContent = value.charAt(0).toUpperCase() + value.slice(1);
// //                     //     });
// //                     // });

// //                     const swapButton = document.createElement('button');
// //                     swapButton.id = 'swap-layers-button';
// //                     swapButton.textContent = 'Swap Layers';
// //                     swapButton.style.display = 'none';
// //                     swapButton.addEventListener('click', () => {
// //                         document.querySelector('.text-section-container').classList.toggle('hidden');
// //                         document.querySelector('.quiz-window-container').classList.toggle('hidden');
// //                     });
// //                     document.body.appendChild(swapButton);
// //                 } else {
// //                     console.log('No such document!');
// //                 }
// //             })
// //             .catch((error) => {
// //                 console.log('Error getting document:', error);
// //             });
// //     } else {
// //         redirectUserBasedOnRole(null);
// //     }
// // });

// onAuthStateChanged(auth, (user) => {
//     if (user) {
//         currentUserUid = user.uid;
//         console.log('Current User Email:', user.email, 'User Uid:', currentUserUid);
//         const quizId = getQuizIdFromURL();

//         // Move logic to a separate function to handle quiz loading
//         loadQuizData(quizId);
//     } else {
//         redirectUserBasedOnRole(null);
//     }
// });

// // Function to load quiz data
// async function loadQuizData(quizId) {
//     try {
//         const docRef = doc(db, 'quizzes', quizId);
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//             const quizData = docSnap.data();
//             setupQuizUI(quizData);  // Directly using setupQuizUI
//         } else {
//             console.log('No such document!');
//         }
//     } catch (error) {
//         console.log('Error getting document:', error);
//     }
// }

// // Function to handle additional UI setup for the quiz
// function setupQuizUI(quizData) {
//     // Display quiz title
//     document.querySelector('.title').innerText = quizData.Title;
//     console.log("Quiz Title set to:", quizData.Title);

//     // Validate EmbeddedText property
//     if (!quizData.EmbeddedText) {
//         console.error("EmbeddedText is missing or undefined in quizData");
//         document.querySelector('.embedded-text-section').innerText = 'No embedded text provided.';
//         return;
//     }

//     // Parse the EmbeddedText HTML
//     try {
//         const parser = new DOMParser();
//         const htmlDoc = parser.parseFromString(quizData.EmbeddedText, 'text/html');
//         console.log("Parsed HTML Document:", htmlDoc);

//         const oldFormat = !htmlDoc.querySelector('.section-container');
//         console.log("Using old format:", oldFormat);

//         let processedTextSections;
//         if (oldFormat) {
//             processedTextSections = parseOldEmbeddedTextFormat(htmlDoc);
//         } else {
//             processedTextSections = parseNewEmbeddedTextFormat(htmlDoc);
//         }
//         console.log("Processed Text Sections:", processedTextSections);

//         // Display the processed text sections in the DOM
//         displayTextSections(processedTextSections, oldFormat);
//         console.log("Text sections displayed");

//     } catch (error) {
//         console.error("Error parsing EmbeddedText HTML:", error);
//         document.querySelector('.embedded-text-section').innerText = 'Error displaying embedded text.';
//     }

//     // Additional setup for UI elements like swap buttons
//     if (quizData.EmbeddedText) {
//         const htmlDoc = new DOMParser().parseFromString(quizData.EmbeddedText, 'text/html');
//         const sections = htmlDoc.querySelectorAll('*');

//         let currentSection;
//         let previousElementClass = '';

//         sections.forEach((section, index) => {
//             const tagName = section.tagName.toLowerCase();
//             const cssClass = getCssClassForTag(tagName);
//             const content = section.innerHTML.trim();

//             if (tagName === 'h1') {
//                 if (currentSection) {
//                     textContainer.appendChild(currentSection);
//                 }
//                 currentSection = document.createElement('div');
//                 currentSection.className = 'text-section';
//             }

//             if (currentSection) {
//                 const element = document.createElement('div');
//                 element.className = cssClass;
//                 element.innerHTML = content;
//                 currentSection.appendChild(element);
//             }

//             if (index === sections.length - 1 && currentSection) {
//                 textContainer.appendChild(currentSection);
//             }

//             previousElementClass = cssClass;
//         });

//         document.getElementById('start-quiz-button').style.display = 'block';
//     }
// }

// const swapButton = document.createElement('button');
// swapButton.id = 'swap-layers-button';
// swapButton.textContent = 'Swap Layers';
// swapButton.style.display = 'none'; // Initially hidden
// swapButton.addEventListener('click', () => {
//     document.querySelector('.text-section-container').classList.toggle('hidden');
//     document.querySelector('.quiz-window-container').classList.toggle('hidden');
// });
// document.body.appendChild(swapButton);


// const getQuizIdFromURL = () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const quizId = urlParams.get('id');
//     return quizId
// };

// // Helper function to safely retrieve the current user's UID after Firebase authentication
// const getCurrentUserUid = () => {
//     return new Promise((resolve, reject) => {
//         onAuthStateChanged(auth, (user) => {
//             if (user) {
//                 resolve(user.uid);  // Return the UID once authentication state is resolved
//             } else {
//                 reject(null);  // Reject if user is not authenticated
//             }
//         });
//     });
// };

// // Function to check for a paused quiz in Firestore using quiz title
// const checkForPausedQuiz = async () => {
//     try {
//         currentUserUid = await getCurrentUserUid();

//         console.log('Starting checkForPausedQuiz function');
//         console.log('Current User UID:', currentUserUid);

//         // Ensure currentUserUid is a valid string
//         if (typeof currentUserUid !== 'string' || !currentUserUid.trim()) {
//             console.error("Invalid currentUserUid:", currentUserUid);
//             return null;
//         }

//         // Step 1: Get quizId from URL
//         const quizId = getQuizIdFromURL();
//         if (!quizId || typeof quizId !== 'string') {
//             console.error("Invalid quizId found in URL:", quizId);
//             return null;
//         }
//         console.log('Quiz ID from URL:', quizId);

//         // Step 2: Fetch the quiz document using the quizId
//         const quizDocRef = doc(db, "quizzes", quizId);
//         console.log('Quiz Document Reference:', quizDocRef);

//         const quizDoc = await getDoc(quizDocRef);
//         console.log('Quiz Document exists:', quizDoc.exists());

//         if (!quizDoc.exists()) {
//             console.error(`No quiz found with ID: ${quizId}`);
//             return null;
//         }

//         // Get quiz data and check for the presence of quizTitle
//         const PausedQuizData = quizDoc.data();
//         console.log('Quiz Data:', PausedQuizData);

//         if (!PausedQuizData) {
//             console.error("Quiz data is null or undefined.");
//             return null;
//         }

//         if (!PausedQuizData.Title) {
//             console.error("Quiz title is missing from quiz data.");
//             console.log('Available fields in quizData:', Object.keys(quizData));
//             return null;
//         }

//         const quizTitle = PausedQuizData.Title;
//         console.log(`Quiz title: ${quizTitle}`);

//         // Step 3: Fetch user document from 'studentdb' collection
//         const userDocRef = doc(db, "studentdb", currentUserUid);
//         console.log('User Document Reference:', userDocRef);

//         const userDoc = await getDoc(userDocRef);
//         console.log('User Document exists:', userDoc.exists());

//         if (!userDoc.exists()) {
//             console.error(`No user data found for user: ${currentUserUid}`);
//             return null;
//         }

//         // Get user data and check for quizzes field
//         const userData = userDoc.data();
//         console.log('User Data:', userData);

//         if (!userData) {
//             console.error("User data is null or undefined.");
//             return null;
//         }

//         if (!userData.quizzes) {
//             console.error("Quizzes field is missing from user data.");
//             console.log('Available fields in userData:', Object.keys(userData));
//             return null;
//         }

//         const quizzes = userData.quizzes;
//         console.log('User Quizzes:', quizzes);

//         // Step 4: Use quiz title to find paused quiz
//         const pausedQuiz = quizzes[quizTitle];
//         console.log('Paused Quiz Data:', pausedQuiz);

//         if (!pausedQuiz) {
//             console.log(`No paused quiz found for title: ${quizTitle}`);
//             return null;
//         }

//         if (pausedQuiz.state === 'paused') {
//             console.log(`Paused quiz found for title: ${quizTitle}`, pausedQuiz);
//             return pausedQuiz; // Return paused quiz data
//         } else {
//             console.log(`Quiz found for title: ${quizTitle}, but it is not paused.`);
//         }
//     } catch (error) {
//         console.error("Error checking paused quiz in Firestore:", error);
//         console.error("Error stack:", error.stack);
//     }
//     return null; // Return null if no paused quiz is found
// };

// // Function to load paused quiz state
// // Load state from Firestore if the quiz was paused
// // Function to load paused quiz state from Firestore and restore interactions
// const loadPausedQuizState = async (currentUserUid) => {
//     const pausedQuiz = await checkForPausedQuiz(currentUserUid); // Check Firestore for paused quiz data

//     // Declare currentQuestionIndex locally
//     let currentQuestionIndex;
//     // let pausedTime = 0;

//     if (pausedQuiz) {
//         console.log("Restoring paused quiz state...");

//         // Restore the current question index, time, and user interactions
//         if (pausedQuiz.questionDetails) {
//             currentQuestionIndex = pausedQuiz.questionDetails.length; // Restore current question index
//         } else {
//             currentQuestionIndex = 0;
//             console.log("No question details available");
//         }

//         pausedTime = pausedQuiz.sessionLength || 0; // Restore the session length

//         // Restore user interactions (scroll, mouse path, etc.)
//         userInteractions = {
//             scrollBehavior: {},
//             mousePath: {},
//             navigationHistory: []
//         };

//         if (pausedQuiz.questionDetails) {
//             pausedQuiz.questionDetails.forEach(question => {
//                 userInteractions.scrollBehavior[question.questionId] = question.scrollBehavior || {}; // Restore scroll position
//                 userInteractions.mousePath[question.questionId] = question.mousePath || []; // Restore mouse path
//                 userInteractions.navigationHistory = userInteractions.navigationHistory.concat(question.navigationHistory || []); // Restore navigation history
//             });
//         }

//         // Start the quiz automatically with the restored state
//         startQuiz(true);  // Passing 'true' to indicate it's a resumed quiz
//     } else {
//         console.log("No paused state found, starting a new quiz...");
//         startQuiz(false);  // Start a new quiz if no paused data is found
//     }
// };

// const quizId = getQuizIdFromURL();
// // const currentUserUid = getCurrentUserUid


// // async function loadAndDisplayQuizContent(quizData) {
// //     console.log("Loading and displaying quiz content...");
// //     console.log("Quiz Data:", quizData);

// //     if (!quizData) {
// //         console.error("quizData is null or undefined");
// //         return;
// //     }

// //     document.querySelector('.title').innerText = quizData.Title;
// //     console.log("Quiz Title set to:", quizData.Title);

// //     if (!quizData.EmbeddedText) {
// //         console.error("EmbeddedText is missing from quizData");
// //         return;
// //     }

// //     const parser = new DOMParser();
// //     const htmlDoc = parser.parseFromString(quizData.EmbeddedText, 'text/html');
// //     console.log("Parsed HTML Document:", htmlDoc);

// //     const oldFormat = !htmlDoc.querySelector('.section-container');
// //     console.log("Using old format:", oldFormat);

// //     let processedTextSections;
// //     if (oldFormat) {
// //         processedTextSections = parseOldEmbeddedTextFormat(htmlDoc);
// //     } else {
// //         processedTextSections = parseNewEmbeddedTextFormat(htmlDoc);
// //     }
// //     console.log("Processed Text Sections:", processedTextSections);

// //     displayTextSections(processedTextSections, oldFormat);
// //     console.log("Text sections displayed");
// // }

// try {
//     console.log("Checking for paused quiz...");
//     const pausedQuiz = await checkForPausedQuiz(currentUserUid, quizId);
//     console.log("Paused Quiz Data:", pausedQuiz);

//     if (pausedQuiz) {
//         console.log("Paused quiz found. Loading paused state...");
//         await loadPausedQuizState(quizId);
//         console.log("Paused state loaded");
//         await setupQuizUI(pausedQuiz);
//     } else {
//         console.log("No paused quiz found. Loading fresh quiz data...");
//         const quizDocRef = doc(db, "quizzes", quizId);
//         console.log("Quiz Document Reference:", quizDocRef);

//         const quizDocSnap = await getDoc(quizDocRef);
//         console.log("Quiz Document Snapshot:", quizDocSnap);

//         if (!quizDocSnap.exists()) {
//             console.log("No such document! Redirecting to dashboard...");
//             window.location.href = "student_dashboard.html";
//         } else {
//             quizData = quizDocSnap.data();
//             console.log("Quiz Data from Firestore:", quizData);

//             if (quizData) {
//                 await setupQuizUI(quizData);
//             } else {
//                 console.error('quizData is null or undefined after fetching from Firestore');
//             }
//         }
//     }
// } catch (error) {
//     console.error("Error loading quiz:", error);
//     // Handle the error appropriately, perhaps show an error message to the user
// }

// // // First, check if there is any paused state for the quiz in Firestore
// // const pausedQuiz = await checkForPausedQuiz(currentUserUid, quizId);

// // if (pausedQuiz) {
// //     // If paused state is found, load it and resume the quiz
// //     await loadPausedQuizState(quizId);
// // } else {
// //     // If no paused state, load the quiz data and start fresh
// //     const quizDocRef = doc(db, "quizzes", quizId);
// //     const quizDocSnap = await getDoc(quizDocRef);

// //     if (!quizDocSnap.exists()) {
// //         console.log("No such document!");
// //         window.location.href = "student_dashboard.html";
// //     } else {
// //         quizData = quizDocSnap.data();

// //         if (quizData) {
// //             console.log("Document data:", quizData);
// //             document.querySelector('.title').innerText = quizData.Title;

// //             const parser = new DOMParser();
// //             const htmlDoc = parser.parseFromString(quizData.EmbeddedText, 'text/html');

// //             const oldFormat = !htmlDoc.querySelector('.section-container');

// //             let processedTextSections;
// //             if (oldFormat) {
// //                 processedTextSections = parseOldEmbeddedTextFormat(htmlDoc);
// //             } else {
// //                 processedTextSections = parseNewEmbeddedTextFormat(htmlDoc);
// //             }

// //             // const screenReader = new ScreenReaderService();
// //             // const textHighlighter = new TextHighlighter('#text-section-container');
// //             // const navigationControls = new NavigationControls(screenReader, textHighlighter);
// //             // const screenReaderMenu = new ScreenReaderMenu(screenReader, navigationControls);

// //             displayTextSections(processedTextSections, oldFormat);
// //             // initScreenReader();
// //         } else {
// //             console.log('quizData is null or undefined');
// //         }
// //     }
// // }
// // // });



// // const logLayerVisibility = () => {
// //     console.log('Content Layer Visible:', !document.querySelector('.text-section-container').classList.contains('hidden'));
// //     console.log('Quiz Layer Visible:', !document.querySelector('.quiz-window-container').classList.contains('hidden'));
// // };

// // logLayerVisibility();

// document.getElementById('start-quiz-button').addEventListener('click', () => {
//     const quizContainer = document.getElementById('quiz-window-container');
//     const textContainer = document.querySelector('.text-section-container');
//     quizContainer.classList.remove('hidden', 'inactive-quiz-window-container');
//     quizContainer.style.position = 'absolute';
//     quizContainer.style.top = `${textContainer.offsetTop}px`;
//     quizContainer.style.right = '0';
//     document.getElementById('start-quiz-button').classList.add('hidden');
//     // logLayerVisibility();
// });

// const hideEmptySections = () => {
//     const embeddedTexts = document.querySelectorAll('.embedded-text');
//     embeddedTexts.forEach(section => {
//         if (!section.innerHTML.trim()) {
//             section.closest('.embedded-text-section').classList.add('hidden');
//         }
//     });
// };

// document.addEventListener('DOMContentLoaded', () => {
//     hideEmptySections();
// });

// // Clear state for a specific quizId to remove local storage data and reset in-memory progress
// const clearState = (quizId) => {
//     localStorage.removeItem(`quizState_${quizId}`);
//     console.log(`State cleared from localStorage for quiz: ${quizId}`);
//     currentQuestionIndex = 0;
//     attempts = {};
//     feedback = {};
//     userResponses = {};
// };

// // Upload quiz summary and overwrite the paused state in Firestore
// export async function uploadQuizSummary(quizSummary) {
//     const user = auth.currentUser;
//     if (user) {
//         try {
//             const userDocRef = doc(db, "studentdb", user.uid);
//             const quizKey = `${quizSummary.title}`;

//             // Upload final quiz summary and mark it as "finished", overwriting any paused state
//             await setDoc(userDocRef, {
//                 quizzes: {
//                     [quizKey]: {
//                         dateTime: new Date().toISOString(),
//                         groupId: quizSummary.groupId,
//                         scoreWithHints: quizSummary.scoreWithHints,
//                         scoreWithoutHints: quizSummary.scoreWithoutHints,
//                         state: "finished", // Mark quiz as finished, no longer paused
//                         time: quizSummary.time,
//                         title: quizSummary.title,
//                         type: quizSummary.type
//                     }
//                 }
//             }, { merge: true });
//             console.log("Quiz summary uploaded to Firestore:", quizSummary);

//             // Clean up the paused state from Firestore for this quiz
//             await cleanUpFirestorePausedState(quizKey);

//             // Clear local storage for the finished quiz
//             // We might need to remove/ change this state clear here for answersheet purposes
//             clearState(quizSummary.title);
//             localStorage.removeItem('pendingPause'); // Remove pending pause data
//             console.log("Local storage and paused state cleared for the finished quiz.");

//         } catch (error) {
//             console.error("Error uploading quiz summary or cleaning up paused state:", error);
//         }
//     } else {
//         console.error("No user is currently signed in.");
//     }
// };

// // Function to clean up paused state from Firestore for a specific quiz
// async function cleanUpFirestorePausedState(quizKey) {
//     try {
//         const userDocRef = doc(db, "studentdb", auth.currentUser.uid);
//         const userDoc = await getDoc(userDocRef);

//         if (userDoc.exists()) {
//             const quizzes = userDoc.data().quizzes || {};
//             if (quizzes[quizKey] && quizzes[quizKey].state === "paused") {
//                 // Remove the paused data for this quiz from Firestore
//                 delete quizzes[quizKey].paused;
//                 await updateDoc(userDocRef, { quizzes });
//                 console.log(`Paused data for quiz ${quizKey} cleared from Firestore.`);
//             }
//         }
//     } catch (error) {
//         console.error("Error cleaning up paused state from Firestore:", error);
//     }
// };

// // Add button for swapping between layers
// document.addEventListener('DOMContentLoaded', () => {
//     const swapButton = document.getElementById('swap-layers-button');
//     const quizContainer = document.querySelector('.quiz-container');
//     const quizWindow = document.querySelector('.quiz-window-container');

//     swapButton.addEventListener('click', () => {
//         if (quizWindow.classList.contains('inactive-quiz-window-container')) {
//             quizWindow.classList.remove('inactive-quiz-window-container');
//             quizWindow.classList.remove('hidden');
//             quizContainer.classList.add('active');
//         } else {
//             quizWindow.classList.add('inactive-quiz-window-container');
//             quizContainer.classList.remove('active');
//         }
//     });

//     const startQuizButton = document.querySelector('.start-quiz-button');

//     if (startQuizButton) {
//         startQuizButton.addEventListener('click', () => {
//             quizContainer.classList.add('active');
//             startQuizButton.classList.add('hidden');

//             window.scrollTo({
//                 top: 0,
//                 behavior: 'smooth'
//             });

//             quizWindow.classList.remove('inactive-quiz-window-container', 'hidden');
//             swapButton.classList.remove('hidden');
//         });
//     }

//     quizWindow.addEventListener('transitionend', (event) => {
//         if (quizWindow.classList.contains('inactive-quiz-window-container')) {
//             quizWindow.classList.add('hidden');
//         } else {
//             quizWindow.classList.remove('hidden');
//         }
//     });
// });

// document.addEventListener('DOMContentLoaded', () => {
//     const startQuizButton = document.querySelector('.start-quiz-button');
//     const quizContainer = document.querySelector('.quiz-container');

//     if (startQuizButton) {
//         startQuizButton.addEventListener('click', () => {
//             quizContainer.classList.add('active');
//             startQuizButton.classList.add('hidden');

//             window.scrollTo({
//                 top: 0,
//                 behavior: 'smooth'
//             });

//             const quizWindowContainer = document.getElementById('quiz-window-container');
//             quizWindowContainer.classList.remove('inactive-quiz-window-container', 'hidden');

//             const swapButton = document.getElementById('swap-layers-button');
//             if (swapButton) {
//                 swapButton.style.display = 'block';
//             }
//         });
//     }
// });

// // Add an event listener to set display to none after the transition ends
// document.getElementById('quiz-window-container').addEventListener('transitionend', (event) => {
//     const quizWindow = document.getElementById('quiz-window-container');
//     if (quizWindow.classList.contains('inactive-quiz-window-container')) {
//         quizWindow.classList.add('hidden');
//     } else {
//         quizWindow.classList.remove('hidden');
//     }
// });

// document.getElementById('swap-layers-button').addEventListener('click', function () {
//     const quizWindow = document.querySelector('.quiz-window-container');
//     this.classList.toggle('flipped');

//     if (quizWindow.classList.contains('inactive-quiz-window-container')) {
//         // Opening animation
//         // quizWindow.classList.remove('inactive-quiz-window-container');
//         // quizWindow.classList.add('active-quiz-window-container');
//         this.classList.remove('shifted');
//     } else {
//         // Closing animation
//         // quizWindow.classList.remove('active-quiz-window-container');
//         // quizWindow.classList.add('inactive-quiz-window-container');
//         this.classList.add('shifted');
//     }
// });

// // Pause quiz Logic and the initial addition of tracking features

// // Function to pause the quiz
// async function pauseQuiz() {
//     const pausedQuizCount = await checkPausedQuizLimit();
//     if (pausedQuizCount >= 3) {
//         const oldestQuiz = await getOldestPausedQuiz();
//         showPausePopup(0, oldestQuiz.title); // Show the popup with a warning about deleting the oldest quiz
//     } else {
//         showPausePopup(3 - pausedQuizCount); // Show the popup with remaining pauses
//     }
// };

// // Function to show pause popup's content messages
// function showPausePopup(remainingPauses, oldestPausedQuizTitle = null) {
//     const message = document.getElementById('pause-message');

//     // Update the message content based on the remaining pauses
//     if (remainingPauses > 0) {
//         message.innerHTML = `You are allowed to pause <strong style="color: red">${remainingPauses}</strong> more quizzes. Do you want to pause this quiz?`;
//     } else {
//         message.innerHTML = `You have reached the pause limit. Pausing this quiz will reset the progress of the oldest paused quiz: "${oldestPausedQuizTitle}". Do you want to proceed?`;
//     }

// };

// // Function to confirm pausing the quiz
// async function confirmPauseQuiz() {
//     const pausedQuizCount = await checkPausedQuizLimit();

//     // If the user has reached the pause limit, delete the oldest paused quiz
//     if (pausedQuizCount >= 3) {
//         await deleteOldestPausedQuiz();
//     }

//     // Then pause the current quiz
//     await savePausedQuizState();
//     // Redirect to the dashboard after pausing
//     redirectToStudentDashboard();
// };

// // Function to save paused quiz state
// async function savePausedQuizState() {
//     const changedQuestionDetails = quizData.Questions.map((question, index) => {
//         return {
//             questionId: index,
//             timeSpent: getTimeSpentOnQuestion(index) || 0,
//             attempts: attempts[index] || [],
//             hintUsed: !!feedback[index],
//             correct: userResponses[index] !== undefined,
//             scrollBehavior: userInteractions.scrollBehavior[index] || 0,
//             mousePath: userInteractions.mousePath[index] || [],
//             navigationHistory: userInteractions.navigationHistory.filter(nav => nav.from === index || nav.to === index) || []
//         };
//     });

//     const pausedQuizData = {
//         dateTime: new Date().toISOString(),
//         groupId: quizData.QuizGroupId || "",
//         questionDetails: changedQuestionDetails,  // Only save changes
//         state: "paused",
//         sessionLength: new Date() - startTime + pausedTime || 0,
//         title: quizData.Title || "Untitled Quiz",
//         type: quizData.QuizType || "unknown"
//     };

//     try {
//         const userDocRef = doc(db, "studentdb", auth.currentUser.uid);
//         await setDoc(userDocRef, {
//             quizzes: {
//                 [quizData.Title]: pausedQuizData
//             }
//         }, { merge: true });
//         console.log("Quiz paused successfully.");
//         redirectToStudentDashboard();
//     } catch (error) {
//         console.error("Error pausing quiz: ", error);
//         localStorage.setItem('pendingPause', JSON.stringify(pausedQuizData));  // Fallback to local storage
//         alert('Failed to pause the quiz. Your progress has been saved locally and will be synced when your connection is restored.');
//     }
// }

// // Track scroll behavior and mouse movements for better data collection
// function startTracking() {
//     document.addEventListener('scroll', trackScrollBehavior);
//     document.addEventListener('mousemove', trackMousePath);
// };

// function trackScrollBehavior() {
//     userInteractions.scrollBehavior[currentQuestionIndex] = window.scrollY;
// };

// function trackMousePath(event) {
//     if (!userInteractions.mousePath[currentQuestionIndex]) {
//         userInteractions.mousePath[currentQuestionIndex] = [];
//     }
//     userInteractions.mousePath[currentQuestionIndex].push({
//         x: event.clientX,
//         y: event.clientY,
//         time: new Date().getTime()
//     });
// };

// // Function to enforce manual pausing
// window.addEventListener('beforeunload', (event) => {
//     if (!quizPausedManually) {
//         event.preventDefault();
//         event.returnValue = 'Are you sure you want to leave? Make sure to pause your quiz to save your progress!';
//     }
// });

// // Function to get time spent on a question (placeholder function, needs implementation)
// function getTimeSpentOnQuestion(index) {
//     // Calculate time spent on each question
// };

// // Function to log navigation between questions
// function logNavigation(from, to) {
//     userInteractions.navigationHistory.push({
//         from: from,
//         to: to,
//         time: new Date().toISOString()
//     });
// };

// // Function to check the paused quiz limit
// // function checkPausedQuizLimit() {
// //     return new Promise((resolve, reject) => {
// //         onAuthStateChanged(auth, async (user) => {
// //             if (user) {
// //                 const userDocRef = doc(db, "studentdb", user.uid);
// //                 const userDoc = await getDoc(userDocRef);

// //                 if (userDoc.exists()) {
// //                     pausedQuizzes = Object.values(userDoc.data().quizzes || {}).filter(quiz => quiz.state === 'paused');
// //                     resolve(pausedQuizzes.length);
// //                 } else {
// //                     console.error("User document does not exist.");
// //                     resolve(0);
// //                 }
// //             } else {
// //                 console.error("User is not authenticated.");
// //                 resolve(0);  // Or handle the error appropriately
// //             }
// //         });
// //     });
// // };

// function checkPausedQuizLimit() {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const userDocRef = doc(db, "studentdb", currentUserUid);
//             const userDoc = await getDoc(userDocRef);

//             if (userDoc.exists()) {
//                 const pausedQuizzes = Object.values(userDoc.data().quizzes || {}).filter(quiz => quiz.state === 'paused');
//                 resolve(pausedQuizzes.length);
//             } else {
//                 console.error("User document does not exist.");
//                 resolve(0);
//             }
//         } catch (error) {
//             console.error("Error fetching user document:", error);
//             resolve(0);
//         }
//     });
// }

// // Function to get the oldest paused quiz
// function getOldestPausedQuiz() {
//     return pausedQuizzes.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];
// };

// // Function to delete the oldest paused quiz
// async function deleteOldestPausedQuiz() {
//     const oldestQuiz = getOldestPausedQuiz();
//     const userDocRef = doc(db, "studentdb", auth.currentUser.uid);
//     const userDoc = await getDoc(userDocRef);
//     const quizzes = userDoc.data().quizzes;
//     delete quizzes[oldestQuiz.title];
//     await updateDoc(userDocRef, { quizzes: quizzes });
//     console.log(`Deleted oldest paused quiz: ${oldestQuiz.title}`);
// };

// // Function to redirect to student dashboard
// function redirectToStudentDashboard() {
//     window.location.href = "student_dashboard.html";
// };

// // Event listeners for the pause quiz popup
// document.getElementById('pause-quiz-button').addEventListener('click', () => {
//     const pausePopup = document.getElementById('pause-popup');

//     // Check if the pause popup has the 'hidden' class
//     if (pausePopup.classList.contains('hidden')) {
//         // Remove the 'hidden' class to display the popup
//         pausePopup.classList.remove('hidden');

//         // Call pauseQuiz function to pause the quiz
//         pauseQuiz();
//     } else {
//         // Add the 'hidden' class to hide the popup
//         pausePopup.classList.add('hidden');
//     }
// });

// // Event listeners for the pause quiz popup
// document.getElementById('word-list-button').addEventListener('click', () => {
//     const wordListPopup = document.getElementById('word-list-popup');

//     // Check if the pause popup has the 'hidden' class
//     if (wordListPopup.classList.contains('hidden')) {
//         // Remove the 'hidden' class to display the popup
//         wordListPopup.classList.remove('hidden');

//         // Call pauseQuiz function to pause the quiz
//         // pauseQuiz();
//     } else {
//         // Add the 'hidden' class to hide the popup
//         wordListPopup.classList.add('hidden');
//     }
// });

// document.getElementById('confirm-pause').addEventListener('click', async () => {
//     // Call the function to confirm pause and hide the popup after pausing
//     await confirmPauseQuiz();
//     document.getElementById('pause-popup').classList.add('hidden');
// });

// document.getElementById('cancel-pause').addEventListener('click', () => {
//     // Hide the popup when cancel is clicked
//     document.getElementById('pause-popup').classList.add('hidden');
// });


// // // Helper function to restore paused quiz state
// // function restorePausedQuizState(quizData) {
// //     // Restore the progress and state of the paused quiz
// //     currentQuestionIndex = quizData.questionDetails.length;  // Restore the current question index
// //     pausedTime = quizData.sessionLength;  // Restore the session time

// //     // Restore user interactions (scroll, mouse path, etc.)
// //     userInteractions = {
// //         scrollBehavior: {},
// //         mousePath: {},
// //         navigationHistory: []
// //     };
// //     quizData.questionDetails.forEach(question => {
// //         userInteractions.scrollBehavior[question.questionId] = question.scrollBehavior;
// //         userInteractions.mousePath[question.questionId] = question.mousePath;
// //         userInteractions.navigationHistory = userInteractions.navigationHistory.concat(question.navigationHistory);
// //     });
// // }


