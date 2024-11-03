// // UI Rendering Functions
// import { handleOptionSelect, handleNextQuestion, handlePreviousQuestion } from './quizManager.js';
// import { parseNewEmbeddedTextFormat } from './services.js';

// /**
//  * Render the quiz title
//  * @param {string} title - The title of the quiz
//  */
// export const renderQuizTitle = (title) => {
//     const titleElement = document.getElementById('quiz-title');
//     if (titleElement) {
//         titleElement.innerText = title;
//     } else {
//         console.error("Title element not found.");
//     }
// };

// /**
//  * Render a question and its options
//  * @param {Object} quizData - The quiz data containing questions and options
//  * @param {number} questionIndex - The index of the current question to render
//  */
// export const renderQuestion = (quizData, questionIndex) => {
//     const question = quizData.Questions[questionIndex];
//     document.getElementById('question-text').innerText = `${questionIndex + 1}. ${question.Text}`;
//     document.getElementById('question-tracker').innerText = `${questionIndex + 1} / ${quizData.Questions.length}`;

//     const optionsContainer = document.getElementById('options-container');
//     optionsContainer.innerHTML = '';

//     question.Options.forEach((option, index) => {
//         const optionElement = document.createElement('div');
//         optionElement.className = 'proto-option';
//         optionElement.innerText = `${String.fromCharCode(65 + index)}. ${option}`;
//         optionElement.onclick = () => handleOptionSelect(index);
//         optionsContainer.appendChild(optionElement);
//     });

//     setupPaginationEvents();
//     setupOptionSelectionEvents();
// };

// /**
//  * Render the embedded text section
//  * @param {string} embeddedTextHTML - The embedded HTML text to render
//  */
// export const renderEmbeddedTextSection = (embeddedTextHTML) => {
//     const textContainer = document.getElementById('text-section-container');
//     if (!textContainer) {
//         console.error('Text container not found');
//         return;
//     }

//     try {
//         const parser = new DOMParser();
//         const htmlDoc = parser.parseFromString(embeddedTextHTML, 'text/html');
//         const oldFormat = !htmlDoc.querySelector('.section-container');
//         let processedTextSections;

//         if (oldFormat) {
//             processedTextSections = Array.from(htmlDoc.body.children).map(section => section.outerHTML);
//         } else {
//             processedTextSections = parseNewEmbeddedTextFormat(htmlDoc);
//         }

//         displayTextSections(processedTextSections, oldFormat);
//     } catch (error) {
//         console.error("Error parsing EmbeddedText HTML:", error);
//         textContainer.innerHTML = '<div>Error displaying embedded text.</div>';
//     }
// };

// /**
//  * Display processed text sections
//  * @param {Array} processedTextSections - An array of processed text sections
//  * @param {boolean} oldFormat - Whether the content is in the old format
//  */
// export const displayTextSections = (processedTextSections, oldFormat) => {
//     const textContainer = document.getElementById('text-section-container');
//     textContainer.innerHTML = '';

//     processedTextSections.forEach((section) => {
//         const sectionDiv = document.createElement('div');
//         sectionDiv.className = 'embedded-text-section';
//         sectionDiv.innerHTML = `<div class="embedded-text">${section}</div>`;
//         textContainer.appendChild(sectionDiv);
//     });
// };

// /**
//  * Handle middle section rendering with images and text
//  * @param {Object} section - The section object containing data for rendering
//  * @param {HTMLElement} sectionDiv - The section div element
//  */
// export const handleMiddleSection = (section, sectionDiv) => {
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

// /**
//  * Update pagination to reflect the number of questions
//  * @param {number} totalQuestions - The total number of questions
//  */
// export const updatePagination = (totalQuestions) => {
//     const paginationContainer = document.getElementById('pagination');
//     paginationContainer.innerHTML = '';

//     for (let i = 1; i <= totalQuestions; i++) {
//         const paginationNumber = document.createElement('div');
//         paginationNumber.classList.add('pagination-number');
//         paginationNumber.innerText = i;
//         paginationNumber.addEventListener('click', () => {
//             scrollToQuestion(i);
//             highlightPaginationNumber(i);
//         });
//         paginationContainer.appendChild(paginationNumber);
//     }
// };

// /**
//  * Highlight the active pagination number
//  * @param {number} questionIndex - The index of the current question to highlight
//  */
// export const highlightPaginationNumber = (questionIndex) => {
//     const allPaginationNumbers = document.querySelectorAll('.pagination-number');
//     allPaginationNumbers.forEach((number, index) => {
//         if (index + 1 === questionIndex) {
//             number.classList.add('active');
//         } else {
//             number.classList.remove('active');
//         }
//     });
// };

// /**
//  * Scroll smoothly to a question based on the question index
//  * @param {number} questionIndex - The index of the question to scroll to
//  */
// export const scrollToQuestion = (questionIndex) => {
//     const questionElement = document.getElementById(`question-${questionIndex}`);
//     if (questionElement) {
//         questionElement.scrollIntoView({ behavior: 'smooth' });
//     }
// };

// /**
//  * Setup event listeners for pagination navigation
//  */
// export const setupPaginationEvents = () => {
//     const prevButton = document.getElementById('pagination-prev');
//     const nextButton = document.getElementById('pagination-next');
//     if (prevButton && nextButton) {
//         prevButton.addEventListener('click', () => navigatePagination('prev'));
//         nextButton.addEventListener('click', () => navigatePagination('next'));
//     } else {
//         console.error('Pagination buttons not found');
//     }
// };

// /**
//  * Setup event listeners for selecting options
//  */
// export const setupOptionSelectionEvents = () => {
//     const options = document.querySelectorAll('.proto-option');
//     options.forEach((option, index) => {
//         option.addEventListener('click', () => handleOptionSelect(index));
//     });
// };

// /**
//  * Render the quiz summary modal
//  * @param {Object} summary - The quiz summary data
//  */
// export const renderQuizSummaryModal = (summary) => {
//     const modal = document.getElementById('quiz-summary-modal');
//     if (!modal) {
//         console.error('Quiz summary modal not found');
//         return;
//     }

//     modal.querySelector('#quiz-score').innerText = `Score: ${summary.score}%`;
//     modal.querySelector('#quiz-time').innerText = `Time Taken: ${summary.timeTaken} seconds`;
//     modal.querySelector('#quiz-correct-answers').innerText = `Correct Answers: ${summary.correctAnswers} / ${summary.totalQuestions}`;
//     modal.classList.add('show');
// };

// /**
//  * Set a random background image for the quiz
//  */
// export const setRandomBackground = () => {
//     const backgroundImages = [
//         '/public/assets/images/quiz_background_1.png',
//         '/public/assets/images/quiz_background_2.png',
//         '/public/assets/images/quiz_background_3.png',
//         '/public/assets/images/quiz_background_4.png',
//         '/public/assets/images/quiz_background_5.png'
//     ];

//     const randomIndex = Math.floor(Math.random() * backgroundImages.length);
//     const selectedImage = backgroundImages[randomIndex];
//     document.body.style.backgroundImage = `url(${selectedImage})`;
// };
