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
        case 'span':
            return 'embedded-text-span';
        default: return null;
        // default: return 'embedded-text-default';
    }
};

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);

    } else {
        // Redirect the user to the 'login_student_tvt.html'
        window.location.href = "login_student_tvt.html";
    }
});

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
        const quizData = quizDocSnap.data();

        if (quizData) {
            console.log("Document data:", quizData);
            document.querySelector('.title').innerText = quizData.Title;

            // Parse the HTML content
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(quizData.embedded_text, 'text/html');

            // Extract the text and HTML elements
            const textElements = htmlDoc.body.childNodes;
            const textSections = [];

            textElements.forEach((element) => {
                if (element.nodeType === Node.TEXT_NODE) {
                    const text = element.textContent;
                    textSections.push(text);
                } else if (element.tagName) {
                    const tagName = element.tagName.toLowerCase();
                    const text = element.textContent;
                    textSections.push(`<${tagName}>${text}</${tagName}>`);
                }
            });

            console.log('Text sections before processing:', textSections);

            // Process the text sections and add CSS classes 

            // Add suport for images! DO IT!
            const processedTextSections = textSections.map((text) => {
                const textWithoutTags = text.replace(/<[^>]+>/g, '');
                const cssClass = getCssClassForTag(text);
                if (cssClass) {
                    return `<div class="${cssClass}">${textWithoutTags}</div>`;
                } else {
                    return `<div>${textWithoutTags}</div>`;
                }
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

        // Generate the quiz question and answers

        const startQuizButton = document.querySelector('.start-quiz-button');
        startQuizButton.addEventListener('click', () => {
            const quizWindow = document.querySelector('.quiz-window');
            quizWindow.classList.add('open');
            startQuizButton.style.display = 'none';
            updateQuestion();
        });

        const quizWindowClose = document.querySelector('.quiz-window-close');
        quizWindowClose.addEventListener('click', () => {
            const quizWindow = document.querySelector('.quiz-window');
            quizWindow.classList.remove('open');
            startQuizButton.style.display = 'block';
        });

        let currentQuestionIndex = 0;
        const questionContainer = document.querySelector('.quiz-container');

        const updateQuestion = () => {
            const question = quizData.Questions[currentQuestionIndex];
            const questionText = document.createElement('div');
            questionText.classList.add('question-text');
            questionText.innerText = question.Question;

            const answerContainer = document.createElement('div');
            answerContainer.classList.add('answer-container');

            const prevQuestionBtn = document.createElement('button');
            prevQuestionBtn.classList.add('prev-question-btn');
            prevQuestionBtn.innerText = 'Previous';
            prevQuestionBtn.disabled = currentQuestionIndex === 0;
            const nextQuestionBtn = document.createElement('button');
            nextQuestionBtn.classList.add('next-question-btn');
            nextQuestionBtn.innerText = 'Next';
            nextQuestionBtn.disabled = currentQuestionIndex === quizData.Questions.length - 1;

            const hint = document.createElement('div');
            hint.classList.add('hint');
            hint.innerText = question.Hint;
            hint.style.display = 'none';

            const quizWindow = document.querySelector('.quiz-window');
            quizWindow.querySelector('.quiz-window-header .question-number').innerText = `${currentQuestionIndex + 1} / ${quizData.Questions.length}`;
            quizWindow.querySelector('.quiz-window-title').innerText = question.Question;
            quizWindow.querySelector('.quiz-window-hint').innerText = hint.innerText;

            questionContainer.innerHTML = '';
            answerContainer.innerHTML = '';

            question.Options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.classList.add('option');
                optionElement.innerText = option;
                optionElement.addEventListener('click', () => {
                    if (option === question.Correct) {
                        alert('Correct answer!');
                    } else {
                        alert('Incorrect answer.');
                        hint.style.display = 'block';
                    }
                    nextQuestion();
                });
                answerContainer.appendChild(optionElement);
            });

            questionContainer.appendChild(questionText);
            questionContainer.appendChild(answerContainer);
            quizWindow.querySelector('.quiz-window-controls').appendChild(prevQuestionBtn);
            quizWindow.querySelector('.quiz-window-controls').appendChild(nextQuestionBtn);
            quizWindow.querySelector('.quiz-window-hint').appendChild(hint);
        };

        const nextQuestion = () => {
            currentQuestionIndex++;
            updateQuestion();
        };

        const prevQuestion = () => {
            currentQuestionIndex--;
            updateQuestion();
        };

        nextQuestionBtn.addEventListener('click', nextQuestion);
        prevQuestionBtn.addEventListener('click', prevQuestion);

        const quizWindow = document.querySelector('.quiz-window');
        // const quizWindowClose = quizWindow.querySelector('.quiz-window-close');
        // quizWindowClose.addEventListener('click', () => {
        //     quizWindow.style.display = 'none';
        // });

        const submitQuizBtn = document.querySelector('.submit-quiz-btn');
        submitQuizBtn.addEventListener('click', async () => {
            const selectedOption = document.querySelector('input[name="option"]:checked');
            if (!selectedOption) {
                alert('Please select an option.');
                return;
            }

            const correctOption = quizData.Questions[currentQuestionIndex].Correct;
            if (selectedOption.value === correctOption) {
                alert('Correct answer!');
            } else {
                alert('Incorrect answer.');
            }

            const quizResultsCollection = collection(db, "quiz_results");
            const userRef = doc(db, "users", user.uid);
            const quizResultRef = doc(quizResultsCollection);
            await setDoc(quizResultRef, {
                quizId: quizId,
                user: userRef,
                score: currentQuestionIndex + 1,
                timestamp: Date.now()
            });

            window.location.href = "student_dashboard.html";
        });
    }
});


// Get the embedded text data from Firestore
// const embeddedTextDoc = await embeddedTextCollection.doc(embeddedTextId).get();
// const embeddedTextJson = embeddedTextDoc.data().data;

// // Parse the JSON object
// const embeddedTextData = JSON.parse(embeddedTextJson);

// // Generate the HTML for the embedded text
// const embeddedTextHtml = Handlebars.compile(embeddedTextData.html);

// // Insert the HTML into the page
// const embeddedTextContainer = document.querySelector("#embedded-text-container");
// embeddedTextContainer.innerHTML = embeddedTextHtml;

// // Apply the CSS preferences
// const embeddedTextCss = embeddedTextData.css;
// for (const key in embeddedTextCss) {
//   embeddedTextContainer.style[key] = embeddedTextCss[key];
// }





// const quizDocRef = doc(db, "quizzes", quizId);
// const quizDocSnap = await getDoc(quizDocRef);

// if (!quizDocSnap.exists()) {
//     console.log("No such document!");
//     window.location.href = "student_dashboard.html";
// } else {
//     console.log("Document data:", quizDocSnap.data());
//     const quizData = quizDocSnap.data();

//     // set the title and embedded text from the quiz data
//     document.querySelector('header h1').innerText = quizData.title;
//     document.querySelector('main .embedded-text').innerText = quizData.embedded_text;

//     // Generate the quiz question and answers

//     let currentQuestionIndex = 0;
//     const questionContainer = document.querySelector('.question-container');
//     console.log(questionContainer);
//     const questionText = document.querySelector('.question-text');
//     const answerContainer = document.querySelector('.answer-container');
//     const prevQuestionBtn = document.querySelector('.prev-question-btn');
//     const nextQuestionBtn = document.querySelector('.next-question-btn');
//     const hint = document.querySelector('.hint');

//     const totalQuestions = quizData.Questions.length;
//     let currentQuestionNum = currentQuestionIndex + 1;

//     const updateQuestion = () => {
//         const question = quizData.Questions[currentQuestionIndex];
//         const questionElement = document.createElement('div');
//         questionElement.classList.add('question');
//         questionElement.innerHTML = `<div class="question-number">${currentQuestionNum} / ${totalQuestions}</div>`;
//         questionElement.appendChild(questionText);
//         answerContainer.innerHTML = '';

//         question.Options.forEach((option, index) => {
//             const answerButton = document.createElement("input");
//             answerButton.type = "radio";
//             answerButton.name = `question-${currentQuestionIndex}`;
//             answerButton.value = option;
//             answerButton.id = `answer-${currentQuestionIndex}-${index}`;
//             answerButton.classList.add("answer-option");
//             answerContainer.appendChild(answerButton);

//             const label = document.createElement("label");
//             label.htmlFor = `answer-${currentQuestionIndex}-${index}`;
//             label.innerText = option;
//             answerContainer.appendChild(label);
//         });

//         questionContainer.appendChild(questionElement);

//         if (currentQuestionIndex > 0) {
//             prevQuestionBtn.classList.remove('disabled');
//         } else {
//             prevQuestionBtn.classList.add('disabled');
//         }

//         if (currentQuestionIndex < totalQuestions - 1) {
//             nextQuestionBtn.classList.remove('disabled');
//         } else {
//             nextQuestionBtn.classList.add('disabled');
//         }
//     };

//     updateQuestion();

//     // Handle next and previous button clicks
//     nextQuestionBtn.addEventListener('click', () => {
//         const selectedAnswer = document.querySelector('input[name="question-' + currentQuestionIndex + '"]:checked');
//         if (!selectedAnswer) {
//             return;
//         }

//         const question = quizData.Questions[currentQuestionIndex];
//         if (question.Hint && !selectedAnswer.correct) {
//             hint.innerText = question.Hint;
//             hint.style.display = 'block';

//             // Disable the selected wrong answer
//             selectedAnswer.disabled = true;
//             selectedAnswer.style.opacity = 0.5;

//             // Move to the next question
//             currentQuestionIndex++;
//             currentQuestionNum++;
//             updateQuestion();

//             // Reset the hint display
//             setTimeout(() => {
//                 hint.innerText = '';
//                 hint.style.display = 'none';
//             }, 2000);

//             return;
//         }

//         // Move to the next question
//         currentQuestionIndex++;
//         currentQuestionNum++;
//         updateQuestion();
//     });

//     prevQuestionBtn.addEventListener('click', () => {
//         currentQuestionIndex--;
//         currentQuestionNum--;
//         updateQuestion();
//     });

//     // Submit quiz to Firestore, update quiz status and show score if finished
// }