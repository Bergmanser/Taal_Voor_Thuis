import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCHFj9oABXSxiWm7u1yPOvyhXQw_FRp5Lw",
    authDomain: "project-plato-eb365.firebaseapp.com",
    databaseURL: "https://project-plato-eb365-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-plato-eb365",
    storageBucket: "project-plato-eb365.appspot.com",
    messagingSenderId: "753582080609",
    appId: "1:753582080609:web:98b2db93e63a500a56e020",
    measurementId: "G-KHJXGLJM4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);
const quizzesCollection = collection(db, "quizzes");

// An image class still needs to be added 
const getCssClassForTag = (tag) => {
    const tagName = tag.toLowerCase();
    switch (tagName) {
        case 'h1':
            return 'embedded-text-h1';
        case 'h2':
            return 'embedded-text-h2';
        case 'h3':
            return 'embedded-text-h3';
        case 'h4':
            return 'embedded-text-h4';
        case 'p':
            return 'embedded-text-p';
        case 'b':
            return 'embedded-text-b';
        case 'strong':
            return 'embedded-text-strong';
        case 'img':
            return 'embedded-text-img';
        case 'span':
            return 'embedded-text-span';
        default:
            return 'embedded-text-default';
    }
};

const bElements = document.getElementsByTagName('b');
for (let i = 0; i < bElements.length; i++) {
    const strongElement = document.createElement('strong');
    strongElement.textContent = bElements[i].textContent;
    bElements[i].parentNode.replaceChild(strongElement, bElements[i]);
}

// function applyCssClasses(element) {
//     if (element.nodeType === Node.TEXT_NODE) {
//       const cssClass = getCssClassForTag(element.parentElement.tagName.toLowerCase());
//       if (cssClass) {
//         const span = document.createElement('span');
//         span.className = cssClass;
//         span.textContent = element.textContent;
//         element.parentElement.replaceChild(span, element);
//       }
//     } else {
//       const cssClass = getCssClassForTag(element.tagName.toLowerCase());
//       if (cssClass) {
//         element.classList.add(cssClass);
//       }
//       Array.prototype.forEach.call(element.childNodes, applyCssClasses);
//     }
//   }

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);

    } else {
        // Redirect the user to the 'login_student_tvt.html'
        window.location.href = "login_student_tvt.html";
    }
});

// Declare variables to get and set al relevant quizData
let quizData
let currentQuestionIndex = 0;
let answeredQuestions = 0
let result
let scoreWithoutHints = 0;
let scoreWithHints = 0;
let attempts = [];
const nextQuestionBtn = document.getElementById('.next-question-btn');

function handleUserAnswer(selectedOption, correctOptionLetter, correctOptionText, correctOptionDescription) {
    if (currentQuestionIndex === 0) { // First question
        //...
    } else { // For subsequent questions
        //...
        if (selectedOption.id === correctOptionLetter) {
            //...
        } else { // If the answer is incorrect
            if (!attempts[currentQuestionIndex]) {
                attempts[currentQuestionIndex] = {
                    attemptCount: 0,
                    userAnswer: null,
                    hintShown: false,
                    options: []
                };
            }

            if (attempts[currentQuestionIndex].attemptCount === 1) {
                // First attempt, add points to both scores
                scoreWithoutHints++;
                scoreWithHints++;
            } else if (attempts[currentQuestionIndex].attemptCount === 2) {
                // Second attempt, add points to scoreWithHints
                scoreWithHints++;
            }

            attempts[currentQuestionIndex].attemptCount++;
            attempts[currentQuestionIndex].userAnswer = selectedOption.id;
            attempts[currentQuestionIndex].options.forEach(option => {
                if (option.id === selectedOption.id) {
                    option.isSelected = true;
                }
            });

            if (attempts[currentQuestionIndex].attemptCount === 1) {
                // First attempt, show hint
                attempts[currentQuestionIndex].hintShown = true;
                showHint(quizData.Questions[currentQuestionIndex].Hint);
            } else if (attempts[currentQuestionIndex].attemptCount === 2) {
                // Second attempt, show correct answer
                attempts[currentQuestionIndex].options.forEach(option => {
                    if (option.isCorrect) {
                        option.isHinted = true;
                    } else {
                        option.isDisabled = true;
                    }
                });
                showCorrectAnswer(correctOptionLetter, correctOptionText, correctOptionDescription);
            }
            // // Prevent the user from moving to the next question until they select a radio button
            // nextQuestionBtn.disabled = true;
            // document.querySelectorAll('.option').forEach((option) => {
            //     option.addEventListener('click', () => {
            //         nextQuestionBtn.disabled = false;
            //     });
            // });
        }

        // Clear the hint and answer containers when navigating to a new question
        if (currentQuestionIndex !== answeredQuestions - 1) {
            const hintContainer = document.querySelector('.hint-container');
            const correctAnswerContainer = document.querySelector('.correct-answer-container');
            hintContainer.innerHTML = '';
            correctAnswerContainer.innerHTML = '';
        }
    }

    answeredQuestions++;
}

// // Calculate score and update the question window
// function handleUserAnswer(selectedOption, correctOptionLetter, correctOptionText, correctOptionDescription) {
//     if (currentQuestionIndex === 0) { // First question
//         // If the selected option is correct and has not been previously selected
//         if (selectedOption.id === correctOptionLetter && !firstAttempt[currentQuestionIndex]) {
//             // Count score
//             correctAttempts++;
//             // Disable all options and mark correct answer green
//             for (let option of document.getElementsByName('option')) {
//                 option.disabled = true;
//                 if (option.id === correctOptionLetter) {
//                     option.parentElement.style.backgroundColor = 'green';
//                     option.parentElement.style.borderColor = 'green';
//                 } else {
//                     option.parentElement.style.backgroundColor = 'red';
//                     option.parentElement.style.borderColor = 'red';
//                 }
//             }
//             // Show correct answer description and hint
//             document.getElementById('correctOptionDescription').innerText = correctOptionDescription;
//             document.getElementById('hint').innerText = quizData.Questions[currentQuestionIndex].Hint;
//         } else { // If the answer is incorrect
//             // If it is the first attempt, mark the incorrect answer grey and disable it
//             if (!firstAttempt[currentQuestionIndex]) {
//                 selectedOption.parentElement.style.backgroundColor = 'grey';
//                 selectedOption.parentElement.style.borderColor = 'grey';
//                 selectedOption.disabled = true;
//             }
//             // Show correct answer description and hint
//             document.getElementById('correctOptionDescription').innerText = correctOptionDescription;
//             document.getElementById('hint').innerText = quizData.Questions[currentQuestionIndex].Hint;
//         }
//     } else { // For subsequent questions
//         // If the selected option is correct
//         if (selectedOption.id === correctOptionLetter) {
//             // Count score
//             correctAttempts++;
//             // Disable all options and mark correct answer green
//             for (let option of document.getElementsByName('option')) {
//                 option.disabled = true;
//                 if (option.id === correctOptionLetter) {
//                     option.parentElement.style.backgroundColor = 'green';
//                     option.parentElement.style.borderColor = 'green';
//                 } else {
//                     option.parentElement.style.backgroundColor = 'red';
//                     option.parentElement.style.borderColor = 'red';
//                 }
//             }
//             // Show correct answer description and hint
//             document.getElementById('correctOptionDescription').innerText = correctOptionDescription;
//             document.getElementById('hint').innerText = quizData.Questions[currentQuestionIndex].Hint;
//         } else { // If the answer is incorrect
//             // If it is the first attempt, mark the incorrect answer grey and disable it
//             if (!firstAttempt[currentQuestionIndex]) {
//                 selectedOption.parentElement.style.backgroundColor = 'grey';
//                 selectedOption.parentElement.style.borderColor = 'grey';
//                 selectedOption.disabled = true;
//             }
//             // Show correct answer description and hint
//             document.getElementById('correctOptionDescription').innerText = correctOptionDescription;
//             document.getElementById('hint').innerText = quizData.Questions[currentQuestionIndex].Hint;
//         }
//     }
// }

// Function to show hint
function showHint(hint) {
    const hintContainer = document.querySelector('.hint-container');
    hintContainer.innerHTML = '';
    const hintParagraph = document.createElement('p');
    hintParagraph.innerText = hint;
    hintContainer.appendChild(hintParagraph);
    hintContainer.style.display = 'block';
}

// Function to show correct answer
function showCorrectAnswer(correctOptionLetter, correctOptionText, correctOptionDescription) {
    const answerContainer = document.querySelector('.answer-container');
    const correctAnswerElement = document.createElement('div');
    correctAnswerElement.classList.add('correct-answer');
    correctAnswerElement.innerHTML = `<p>Correct answer: ${correctOptionLetter} - ${correctOptionText}</p><p>${correctOptionDescription}</p>`;
    answerContainer.appendChild(correctAnswerElement);
    answerContainer.style.display = 'block';
}

// document.querySelectorAll('.option').forEach((option) => {
//     option.addEventListener('click', () => {
//         nextQuestionBtn.disabled = false;
//         option.querySelector('input[type="radio"]').checked = true;
//     });
// });

// // Add a function to check if any radio button is selected
// function getSelectedRadioButton() {
//     const radioButtons = document.querySelectorAll('input[type="radio"]');
//     for (const radioButton of radioButtons) {
//       if (radioButton.checked) {
//         return radioButton;
//       }
//     }
//     return null;
//   }

// // Function to disable options
function disableOptions() {
    const options = document.querySelectorAll('.option');
    options.forEach((option) => {
        option.disabled = true;
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    console.log('Quiz ID:', quizId);

    const quizDocRef = doc(db, "quizzes", quizId);
    const quizDocSnap = await getDoc(quizDocRef);

    if (!quizDocSnap.exists()) {
        console.log("No such document!");
        window.location.href = "student_dashboard.html";
    } else {
        quizData = quizDocSnap.data();

        if (quizData) {
            console.log("Document data:", quizData);
            document.querySelector('.title').innerText = quizData.Title;

            initializeQuiz();

            // Parse the HTML content
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(quizData.Embedded_text, 'text/html');

            // Extract the text and HTML elements
            const textElements = htmlDoc.body.childNodes;
            const textSections = [];

            textElements.forEach((element) => {
                if (element.nodeType === Node.TEXT_NODE) {
                    const text = element.textContent;
                    textSections.push(text);
                } else if (element.tagName) {
                    const tagName = element.tagName.toLowerCase();
                    const html = element.outerHTML;
                    textSections.push(html);
                }
            });

            console.log('Text sections before processing:', textSections);

            // Process the text sections and add CSS classes 

            // Add suport for images! DO IT!
            const processedTextSections = textSections.map((text) => {
                const htmlElement = htmlDoc.createElement('div');
                htmlElement.innerHTML = text;
                const elements = htmlElement.childNodes;

                function applyCssClasses(element) {
                    if (element.nodeType === Node.TEXT_NODE) {
                        // no change, just keep the text node
                    } else if (element.tagName) {
                        const tagName = element.tagName.toLowerCase();
                        const cssClass = getCssClassForTag(tagName);
                        if (cssClass) {
                            element.className = cssClass;
                        }
                        // Recursively apply CSS classes to child nodes
                        Array.prototype.forEach.call(element.childNodes, applyCssClasses);
                    } else if (element.tagName === 'strong') {
                        const cssClass = getCssClassForTag('strong');
                        if (cssClass) {
                            const span = document.createElement('span');
                            span.className = cssClass;
                            span.textContent = element.textContent;
                            element.parentNode.replaceChild(span, element);
                        }
                    }
                }

                Array.prototype.forEach.call(elements, applyCssClasses);

                return htmlElement.outerHTML;
            });

            console.log('Processed text sections:', processedTextSections);

            // Create containers for each text section and add the special white space class
            const container = document.createElement('div');
            container.className = 'text-section-container';

            processedTextSections.forEach((textSection) => {
                const sectionContainer = document.createElement('div');
                sectionContainer.className = 'text-section';
                sectionContainer.innerHTML = textSection;
                container.appendChild(sectionContainer);
                container.appendChild(document.createElement('div')); // add a special white space class here
            });

            console.log('Container:', container);

            document.querySelector('.embedded-text').innerHTML = '';
            document.querySelector('.embedded-text').appendChild(container);
        } else {
            console.log('quizData is null or undefined');
        }

        // Generate the quiz question and answers by clicking on the startQuizButton

        // Declare the quizWindow variable outside of the event listener
        const quizWindow = document.querySelector('.quiz-window');
        const quizWindowTitle = document.getElementById('question-window-title');
        const questionContainer = quizWindow.querySelector('.question-container');
        const answerDescriptionContainer = quizWindow.querySelector('.quiz-window-answer');
        const hintContainer = quizWindow.querySelector(".quiz-window-hint")
        const questionNumber = quizWindow.querySelector('.question-number');
        const quizWindowContainer = document.querySelector('.quiz-window-container');
        const startQuizButton = document.getElementById("start-quiz-button");
        const prevQuestionBtn = document.createElement('button');
        const nextQuestionBtn = document.createElement('button');

        startQuizButton.addEventListener('click', () => {
            quizWindow.style.display = 'block';
            quizWindowContainer.classList.remove('hidden'); // Removes the hidden class
            quizWindowContainer.style.display = 'block';
            startQuizButton.style.display = 'none';

            generateQuizWindow();
            showQuizWindow()
        });

        const generateQuestionWindow = () => {
            if (!quizWindow) {
                console.log('quizWindow is null');
                return;
            }

            const question = quizData.Questions[currentQuestionIndex];
            const questionText = document.createElement('div');
            questionText.classList.add('question-text');
            questionText.innerText = question.Text;

            // Create containers for hint and answer messages
            const hintContainer = document.createElement('div');
            hintContainer.classList.add('quiz-window-hint');

            const answerContainer = document.createElement('div');
            answerContainer.classList.add('quiz-window-answer');

            prevQuestionBtn.classList.add('prev-question-btn');
            prevQuestionBtn.innerText = 'Previous';
            prevQuestionBtn.disabled = currentQuestionIndex === 0;
            nextQuestionBtn.classList.add('next-question-btn');
            nextQuestionBtn.innerText = 'Next';
            nextQuestionBtn.disabled = currentQuestionIndex === quizData.Questions.length - 1;

            const hint = document.createElement('div');
            hint.classList.add('hint');
            hint.innerText = question.Hint;
            hint.style.display = 'none';

            quizWindowTitle.innerText = question.Text;

            questionContainer.innerHTML = '';
            hintContainer.innerHTML = '';
            answerContainer.innerHTML = '';

            let selectedOption = null;

            question.Options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.classList.add('option');

                const optionLetter = String.fromCharCode(65 + index) + '.';
                optionElement.innerText = optionLetter + ' ' + option;

                const radioButton = document.createElement('input');
                radioButton.type = 'radio';
                radioButton.name = `option-${currentQuestionIndex}`;
                radioButton.value = index.toString();

                optionElement.appendChild(radioButton);

                answerContainer.appendChild(optionElement); // Append options to answer container
            });

            // Add an event listener to the answer container to handle clicks on options
            answerContainer.addEventListener('click', (event) => {
                if (event.target.tagName === 'DIV' && event.target.classList.contains('option')) {
                    console.log('Option clicked:', event.target);
                    const radioButtons = event.target.querySelectorAll('input[type="radio"]');
                    radioButtons.forEach((radioButton) => {
                        if (radioButton.checked) {
                            radioButton.checked = false;
                        } else {
                            radioButton.checked = true;
                        }
                    });
                    if (selectedOption) {
                        selectedOption.classList.remove('selected');
                    }
                    selectedOption = event.target;
                    selectedOption.classList.add('selected');
                }
            });

            // Find the correct option description for the current question
            const correctOptionDescription = quizData.Questions[currentQuestionIndex].CorrectOptionDescription;

            // Create a new element to display the correct option description
            const correctOptionDescriptionElement = document.createElement('div');
            correctOptionDescriptionElement.classList.add('correct-option-description');
            correctOptionDescriptionElement.innerText = correctOptionDescription;

            questionContainer.appendChild(questionText);
            questionContainer.appendChild(hintContainer); // Append hint container
            questionContainer.appendChild(answerContainer); // Append answer container
        };


        const generateTimer = () => {
            const quizTimerContainer = document.createElement('div');
            quizTimerContainer.classList.add('quiz-timer-container', 'hidden');
            quizWindow.querySelector('.quiz-window-header').appendChild(quizTimerContainer);

            const quizTimer = document.createElement('div');
            quizTimer.classList.add('quiz-timer');
            quizTimerContainer.appendChild(quizTimer);

            const questionTimerContainer = document.createElement('div');
            questionTimerContainer.classList.add('question-timer-container', 'hidden');
            quizWindow.querySelector('.quiz-window-controls').appendChild(questionTimerContainer);

            const questionTimer = document.createElement('div');
            questionTimer.classList.add('question-timer');
            questionTimerContainer.appendChild(questionTimer);

            let quizStartTime = null;
            let questionStartTime = null;

            const updateQuizTimer = () => {
                if (!quizStartTime) {
                    quizStartTime = new Date();
                }
                const now = new Date();
                const elapsedTime = (now - quizStartTime) / 1000;
                const minutes = Math.floor(elapsedTime / 60);
                const seconds = Math.floor(elapsedTime % 60);
                const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                quizTimer.innerText = formattedTime;
            };

            const updateQuestionTimer = () => {
                if (!questionStartTime) {
                    questionStartTime = new Date();
                }
                const now = new Date();
                const elapsedTime = (now - questionStartTime) / 1000;
                const minutes = Math.floor(elapsedTime / 60);
                const seconds = Math.floor(elapsedTime % 60);
                const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                questionTimer.innerText = formattedTime;
            };

            setInterval(updateQuizTimer, 1000);

            const updateQuestion = () => {
                questionStartTime = new Date();
                updateQuestionTimer();
            };

            updateQuestion();
        };

        const generateQuizWindow = () => {
            if (!quizWindow) {
                console.log('quizWindow is null');
                return;
            }

            quizWindow.style.display = 'block';
            quizWindowContainer.style.display = 'block';

            // Initialize the question window, navigation buttons, and timer
            generateTimer();
            generateQuestionWindow();
        };

        const answerOptions = quizWindow.querySelectorAll('.option');
        answerOptions.forEach((option, index) => {
            console.log(`Option ${index + 1}: ${option.innerText}`);
        });

    };

    const quizWindowClose = document.querySelector('.quiz-window-close');
    quizWindowClose.addEventListener('click', () => {
        const quizWindow = document.querySelector('.quiz-window');
        quizWindow.classList.remove('open');
        quizWindowContainer.classList.add('hidden'); // Add the hidden class
        startQuizButton.style.display = 'block';
    });

    function prevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            updateQuestionWindow();
            const correctAnswerContainer = document.querySelector('.correct-answer-container');
            correctAnswerContainer.innerHTML = `<p>${question.CorrectOptionLetter} - ${question.CorrectOptionText}</p><p>${question.CorrectOptionDescription}</p>`;
            correctAnswerContainer.style.display = 'block';
        }
    }

    function nextQuestion() {
        currentQuestionIndex++;
        updateQuestionWindow();
        const correctAnswerContainer = document.querySelector('.correct-answer-container');
        correctAnswerContainer.innerHTML = '';
        correctAnswerContainer.style.display = 'none';
    }


    // function nextQuestion() {
    //     if (currentQuestionIndex < quizData.Questions.length - 1) {
    //         currentQuestionIndex++;
    //     } else {
    //         // Calculate score
    //         const scoreWithoutHints = correctAttempts / quizData.Questions.length * 100;
    //         const finalScore = scoreWithoutHints + hintAttempts * 5;
    //         document.getElementById('finalScore').innerText = 'Your final score is: ' + finalScore + ' / 100';
    //         // Show the score and reset the quiz
    //         document.getElementById('quiz').style.display = 'none';
    //         document.getElementById('score').style.display = 'block';
    //         document.getElementById('resetQuizBtn').style.display = 'block';
    //         document.getElementById('nextQuestionBtn').style.display = 'none';
    //         return;
    //     }
    //     // Display the next question
    //     document.getElementById('question').innerText = quizData.Questions[currentQuestionIndex].Question;
    //     document.getElementById('optionA').innerText = quizData.Questions[currentQuestionIndex].OptionA;
    //     document.getElementById('optionB').innerText = quizData.Questions[currentQuestionIndex].OptionB;
    //     document.getElementById('optionC').innerText = quizData.Questions[currentQuestionIndex].OptionC;
    //     document.getElementById('optionD').innerText = quizData.Questions[currentQuestionIndex].OptionD;
    //     document.getElementById('correctOptionDescription').innerText = '';
    //     document.getElementById('hint').innerText = '';
    //     // Enable all options
    //     for (let option of document.getElementsByName('option')) {
    //         option.disabled = false;
    //         option.parentElement.style.backgroundColor = 'white';
    //         option.parentElement.style.borderColor = 'black';
    //     }
    // }


    // nextQuestionBtn.addEventListener('click', () => {
    //     const selectedOption = document.querySelector('input[name="option"]:checked');

    //     if (!selectedOption) {
    //         alert('Selecteer 1 van de antwoord opties voor dat je de vraag checked');
    //         return; // Do not allow a user to proceed if no option is selected
    //     }

    //     // If an option is selected, proceed with checking the answer and navigating to the next question
    //     const correctOptionIndex = quizData.Questions[currentQuestionIndex].CorrectOption;
    //     const correctOptionLetter = String.fromCharCode(65 + correctOptionIndex) + '.';
    //     const correctOptionText = quizData.Questions[currentQuestionIndex].Options[correctOptionIndex];
    //     const correctOptionDescription = quizData.Questions[currentQuestionIndex].CorrectOptionDescription;

    //     handleUserAnswer(selectedOption, correctOptionLetter, correctOptionText, correctOptionDescription);

    //     nextQuestion();
    //     updateQuestionWindow(); // Update the question window when navigating

    // });

    function checkSubmitButton() {
        const quizWindow = document.querySelector('.quiz-window');
        const submitQuizBtn = quizWindow.querySelector('.submit-quiz-btn');
        return submitQuizBtn;
    }

    async function initializeQuiz() {
        if (!quizData) {
            console.error('quizData not found');
            return;
        }

        const quizWindow = document.querySelector('.quiz-window');
        const prevQuestionBtn = quizWindow.querySelector('.prev-question-btn');
        const nextQuestionBtn = quizWindow.querySelector('.next-question-btn');
        const submitQuizBtn = quizWindow.querySelector('.submit-quiz-btn');

        const questionContainer = document.querySelector('.question-container');
        const questionText = document.createElement('div');
        questionText.classList.add('question-text');
        questionText.innerText = quizData.Questions[currentQuestionIndex].Question;

        const answerContainer = document.createElement('div');
        answerContainer.classList.add('answer-container');

        const hintContainer = document.createElement('div');
        answerContainer.classList.add('hint-container');

        quizWindow.querySelector('.quiz-window-header .question-number').innerText = `Vraag ${currentQuestionIndex + 1} van de ${quizData.Questions.length}`;


        quizData.Questions[currentQuestionIndex].Options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.innerText = option;
            // optionElement.addEventListener('click', () => {
            //     if (option === quizData.Questions[currentQuestionIndex].Correct) {
            //         alert('Correct answer!');
            //     } else {
            //         alert('Incorrect answer.');
            //     }
            //     nextQuestion();
            // });
            answerContainer.appendChild(optionElement);
        });


        questionContainer.appendChild(questionText);
        questionContainer.appendChild(answerContainer);
        quizWindow.querySelector('.quiz-window-controls').appendChild(prevQuestionBtn);
        quizWindow.querySelector('.quiz-window-controls').appendChild(nextQuestionBtn);

        const options = document.querySelectorAll('.option');
        options.forEach((option) => {
            option.addEventListener('click', () => {
                answeredQuestions++;
                checkSubmitButton();
            });
        });



        // Function to calculate scores and display results upon quiz submission
        // Update the user's account info with the relevant data
        // Update the status of the quiz to finished for the user's account specifically
        function submitQuiz() {
            const totalQuestions = quizData.Questions.length;
            const scoreWithoutHintsPercentage = (scoreWithoutHints / totalQuestions) * 100;
            const scoreWithHintsPercentage = (scoreWithHints / totalQuestions) * 100;

            console.log('Score without hints:', scoreWithoutHints, '/', totalQuestions);
            console.log('Score with hints:', scoreWithHints, '/', totalQuestions);

            // Display overlay with scores
            // Display an overlay that appears on top of the quiz with a darkened but still opaque background covering the entire quiz page
            // Display an overlay that appears on top of the quiz with a darkened but still opaque background covering the entire quiz page
            const overlay = document.createElement('div');
            overlay.classList.add('overlay', 'quiz-submission-overlay');
            overlay.innerHTML = `
                <div class="overlay-content">
                <h2>Quiz Results</h2>
                <p>Score without hints: ${scoreWithoutHints}%</p>
                <p>Score with hints: ${scoreWithHints}%</p>
                <p>Time spent: ${timeSpent} seconds</p>
                <p>Quiz duration: ${quizDuration} seconds</p>
                <p>Click anywhere to go to the dashboard</p>
                </div>
            `;
            document.body.appendChild(overlay);

            // Remove the CSS class that hides the timers
            const quizTimerContainer = document.querySelector('.quiz-timer-container');
            const questionTimerContainer = document.querySelector('.question-timer-container');
            quizTimerContainer.classList.remove('hidden');
            questionTimerContainer.classList.remove('hidden');

            // Redirect the user to the dashboard when they click anywhere on the screen
            overlay.addEventListener('click', () => {
                window.location.href = "dashboard.html";
            });
        }

        // Function to show hint in the hint field
        const showHint = (hint) => {
            const hintContainer = document.querySelector('.hint-container');
            hintContainer.innerHTML = '';
            const hintParagraph = document.createElement('p');
            hintParagraph.innerText = hint;
            hintContainer.appendChild(hintParagraph);
            hintContainer.style.display = 'block';
        }

        // Function to display correct answer along with hint
        const showCorrectAnswer = (correctOptionLetter, correctOptionText, correctOptionDescription) => {
            const correctAnswerContainer = document.querySelector('.correct-answer-container');
            const correctAnswerElement = document.createElement('div');
            correctAnswerElement.classList.add('correct-answer');
            correctAnswerElement.innerHTML = `<p>Correct answer: ${correctOptionLetter} - ${correctOptionText}</p><p>${correctOptionDescription}</p>`;
            correctAnswerContainer.appendChild(correctAnswerElement);
            correctAnswerContainer.style.display = 'block';
        }

        // Function to disable all options after showing correct answer
        function disableOptions() {
            const options = document.querySelectorAll('.option');
            options.forEach(option => {
                option.style.pointerEvents = 'none'; // Disable clicking on options
                option.style.opacity = '0.5'; // Reduce opacity to visually indicate disabled state
            });
        }

        checkSubmitButton();

        if (submitQuizBtn) {
            console.error('submitQuizBtn not found');
            submitQuizBtn.addEventListener('click', async () => {
                const selectedOption = document.querySelector('input[name="option"]:checked');
                if (!selectedOption) {
                    alert('Please select an option.');
                    return;
                }

                const correctOption = quizData.Questions[currentQuestionIndex].Correct;
                const result = selectedOption.value === correctOption ? 'correct' : 'incorrect';

                await firebase.firestore().collection('quizResults').add({
                    userId: user.uid,
                    quizId: quizId,
                    result: result,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Quiz submitted.');
                window.location.href = "index.html";
            });
        } else {
            console.error('submitQuizBtn not found');
        }


        // Update the prev/next buttons
        prevQuestionBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                prevQuestion();
                updateQuestionWindow(); // Update the question window when navigating
                if (currentQuestionIndex === 0) {
                    prevQuestionBtn.disabled = true; // Disable the prev button when reaching the first question
                }
                handleUserAnswer();
            }
        });

        nextQuestionBtn.addEventListener('click', () => {
            if (currentQuestionIndex < quizData.Questions.length - 1) {
                // const selectedRadioButton = getSelectedRadioButton();
                // if (!selectedRadioButton) {
                //     nextQuestionBtn.disabled = true;
                //     return;
                // }
                nextQuestion();
                updateQuestionWindow(); // Update the question window when navigating
                prevQuestionBtn.disabled = false; // Enable the prev button when navigating to a later question
                handleUserAnswer();
            }
        });
    }


    const updateQuestionWindow = () => {
        const quizWindow = document.querySelector('.quiz-window');
        const questionText = quizWindow.querySelector('.question-text');
        const answerContainer = quizWindow.querySelector('.quiz-window-answer');
        const hintContainer = quizWindow.querySelector('.hint-container');
        const correctAnswerContainer = quizWindow.querySelector('.correct-answer-container');
        const questionNumber = quizWindow.querySelector('.question-number');
        // const prevQuestionBtn = quizWindow.querySelector('.prev-question-button');
        // prevQuestionBtn.disabled = currentQuestionIndex === 0;

        if (!quizWindow || !questionText || !answerContainer || !hintContainer || !correctAnswerContainer || !questionNumber) {
            console.log('quizWindow, questionText, answerContainer, hintContainer, or correctAnswerContainer is null');
            return;
        }

        // Clear the answer and hint containers
        answerContainer.innerHTML = '';
        hintContainer.innerHTML = '';
        correctAnswerContainer.innerHTML = '';

        // Update the question number
        questionNumber.innerText = `Vraag ${currentQuestionIndex + 1} van de ${quizData.Questions.length}`;

        // Get the current question data
        const questionData = quizData.Questions[currentQuestionIndex];

        // Set the question text
        questionText.innerText = questionData.Text;

        // Set the answer options
        questionData.Options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.innerText = `${String.fromCharCode(65 + index) + '. '} ${option}`;
            optionElement.dataset.index = index;

            // Add event listener to each option
            optionElement.addEventListener('click', async () => {
                const correctOptionIndex = quizData.Questions[currentQuestionIndex].CorrectOption;
                const correctOptionLetter = String.fromCharCode(65 + correctOptionIndex) + '.';
                const correctOptionText = quizData.Questions[currentQuestionIndex].Options[correctOptionIndex];
                const correctOptionDescription = quizData.Questions[currentQuestionIndex].CorrectOptionDescription;

                handleUserAnswer(optionElement, correctOptionLetter, correctOptionText, correctOptionDescription);

                nextQuestion();
                updateQuestionWindow(); // Update the question window when navigating
            });

            answerContainer.appendChild(optionElement);
        });
    };

    // the following code is reponsible for managaging the size of the quiz-window
    $(document).ready(function () {
        $("#start-quiz-button").on("click", function () {
            $(".quiz-container").toggleClass("layout-changed");
        });
    });

    // Add a CSS class to the container when the quiz window is generated
    function showQuizWindow() {
        $('#quiz-window-container').addClass('open');
    }

    // Remove the CSS class from the container when the quiz window is closed
    function closeQuizWindow() {
        $('#quiz-window-container').removeClass('open');
    }

    // Generate the quiz window when the "Start Quiz" button is clicked
    $("#start-quiz-button").on("click", function () {
        showQuizWindow();
    });

    // Add event listener to close the quiz window
    $(".close-quiz-window-button").on("click", function () {
        closeQuizWindow();
    });

    $(document).ready(function () {
        const quizWindowContainer = $(".quiz-window-container");
        const quizWindow = $(".quiz-window");
        const embeddedText = $(".embedded-text");
        const hero = $(".hero");

        $("#range-slider").slider({
            min: 0,
            max: 100,
            value: 75,
            range: "min",
            slide: function (event, ui) {
                const sliderValue = ui.value;
                const quizWindowWidth = (100 - sliderValue) + "%";
                const containerWidth = sliderValue + "%";

                quizWindowContainer.css("width", containerWidth);
                quizWindow.css("width", quizWindowWidth);
                embeddedText.css("width", quizWindowWidth);
                hero.css("width", quizWindowWidth);
            }
        });
    });

    // Add event listener to close the quiz window
    $(".close-quiz-window-button").on("click", function () {
        closeQuizWindow();
    });

    // Generate the quiz window when the page loads
    showQuizWindow();

    // Update the question window when the quiz window is opened
    updateQuestionWindow();



    // code related to the future implementation of the pause quiz feature

    // Global variables
    // let quizProgress;
    // let quizTimerInterval;
    // let questionTimerInterval;
    // let isPaused = false;

    // // Function to update quiz timer
    // function updateQuizTimer() {
    //     quizProgress.timeSpent++;
    //     updateTimer();
    // }

    // // Function to update question timer
    // function updateQuestionTimer() {
    //     quizProgress.questionStartTime++;
    //     updateTimer();
    // }

    // // Function to update the timer display
    // function updateTimer() {
    //     // Calculate time spent on quiz and question
    //     const quizTimeSpent = Math.floor((Date.now() - quizProgress.quizStartTime) / 1000);
    //     const questionTimeSpent = Math.floor((Date.now() - quizProgress.questionStartTime) / 1000);

    //     // Update timer display
    //     // Replace with actual timer elements
    //     const quizTimerDisplay = document.querySelector('.quiz-timer');
    //     quizTimerDisplay.innerText = `Quiz time: ${quizTimeSpent} seconds`;

    //     const questionTimerDisplay = document.querySelector('.question-timer');
    //     questionTimerDisplay.innerText = `Question time: ${questionTimeSpent} seconds`;
    // }

    // // Function to initialize the pause and resume functionality
    // function initializePauseResume() {
    //     const pauseResumeContainer = document.createElement('div');
    //     pauseResumeContainer.classList.add('pause-resume-container');

    //     const pauseButton = document.createElement('button');
    //     pauseButton.classList.add('pause-button');
    //     pauseButton.innerText = 'Pause';
    //     pauseResumeContainer.appendChild(pauseButton);

    //     const resumeButton = document.createElement('button');
    //     resumeButton.classList.add('resume-button');
    //     resumeButton.innerText = 'Resume';
    //     resumeButton.disabled = true;
    //     pauseResumeContainer.appendChild(resumeButton);

    //     const pauseTimer = () => {
    //         isPaused = true;
    //         pauseButton.innerText = 'Resume';
    //         resumeButton.disabled = false;
    //         clearInterval(quizTimerInterval);
    //         clearInterval(questionTimerInterval);
    //     };

    //     const resumeTimer = () => {
    //         isPaused = false;
    //         pauseButton.innerText = 'Pause';
    //         resumeButton.disabled = true;
    //         quizTimerInterval = setInterval(updateQuizTimer, 1000);
    //         questionTimerInterval = setInterval(updateQuestionTimer, 1000);
    //     };

    //     pauseButton.addEventListener('click', () => {
    //         if (!isPaused) {
    //             pauseTimer();
    //         } else {
    //             resumeTimer();
    //         }
    //     });

    //     resumeButton.addEventListener('click', () => {
    //         resumeTimer();
    //     });

    //     // Initialize the quiz and question timers
    //     quizTimerInterval = setInterval(updateQuizTimer, 1000);
    //     questionTimerInterval = setInterval(updateQuestionTimer, 1000);
    // }

    // // Load quiz progress and initialize pause and resume functionality
    // (async () => {
    //     // Replace with actual quiz progress retrieval
    //     quizProgress = await loadQuizProgress();
    //     initializePauseResume();
    // })();

    // // Function to save quiz progress
    // async function saveQuizProgress() {
    //     // Save the quiz progress in the user's account
    //     // You can use Firebase or another database to store the quiz progress
    //     // For example:
    //     const userId = 'user123';
    //     const quizId = 'quiz456';
    //     const progressRef = firebase.database().ref(`users/${userId}/quizzes/${quizId}/progress`);
    //     await progressRef.set(quizProgress);
    // }

    // // Function to load quiz progress
    // async function loadQuizProgress() {
    //     // Load the quiz progress from the user's account
    //     // You can use Firebase or another database to retrieve the quiz progress
    //     // For example:
    //     const userId = 'user123';
    //     const quizId = 'quiz456';
    //     const progressRef = firebase.database().ref(`users/${userId}/quizzes/${quizId}/progress`);
    //     const snapshot = await progressRef.once('value');
    //     return snapshot.val();
    // }

    // // Save quiz progress on completion or any other events as needed
    // // saveQuizProgress();


});
