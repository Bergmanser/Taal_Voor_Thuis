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

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);

    } else {
        // Redirect the user to the 'login_student_tvt.html'
        window.location.href = "login_student_tvt.html";
    }
});

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');

const quizDocRef = doc(db, "quizzes", quizId);
const quizDocSnap = await getDoc(quizDocRef);

if (!quizDocSnap.exists()) {
    console.log("No such document!");
    window.location.href = "student_dashboard.html";
} else {
    console.log("Document data:", quizDocSnap.data());
    const quizData = quizDocSnap.data();

    // set the title and embedded text from the quiz data
    document.querySelector('header h1').innerText = quizData.title;
    document.querySelector('main .embedded-text').innerText = quizData.embedded_text;

    // Generate the quiz question and answers

    let currentQuestionIndex = 0;
    const questionContainer = document.querySelector('.question-container');
    console.log(questionContainer);
    const questionText = document.querySelector('.question-text');
    const answerContainer = document.querySelector('.answer-container');
    const prevQuestionBtn = document.querySelector('.prev-question-btn');
    const nextQuestionBtn = document.querySelector('.next-question-btn');
    const hint = document.querySelector('.hint');

    const totalQuestions = quizData.Questions.length;
    let currentQuestionNum = currentQuestionIndex + 1;

    const updateQuestion = () => {
        const question = quizData.Questions[currentQuestionIndex];
        const questionElement = document.createElement('div');
        questionElement.classList.add('question');
        questionElement.innerHTML = `<div class="question-number">${currentQuestionNum} / ${totalQuestions}</div>`;
        questionElement.appendChild(questionText);
        answerContainer.innerHTML = '';

        question.Options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.innerHTML = `<input type="radio" name="option" id="option-${index + 1}" value="${option}"><label for="option-${index + 1}">${option}</label>`;
            answerContainer.appendChild(optionElement);
        });

        hint.innerText = question.Hint;
    };

    const nextQuestion = () => {
        currentQuestionIndex++;
        currentQuestionNum++;
        updateQuestion();
    };

    const prevQuestion = () => {
        currentQuestionIndex--;
        currentQuestionNum--;
        updateQuestion();
    };

    nextQuestionBtn.addEventListener('click', nextQuestion);
    prevQuestionBtn.addEventListener('click', prevQuestion);

    updateQuestion();

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