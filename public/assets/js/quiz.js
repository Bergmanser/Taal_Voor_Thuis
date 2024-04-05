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
} else {
    console.log("Document data:", quizDocSnap.data());
    const quizData = quizDocSnap.data();

    // Create the quiz container
    const quizContainerElement = document.createElement("div");
    quizContainerElement.id = "quiz-container";
    document.body.appendChild(quizContainerElement);

    // Create the embedded text container
    const embeddedTextElement = document.createElement("div");
    embeddedTextElement.classList.add("embedded-text");
    embeddedTextElement.innerHTML = quizData.embedded_text;
    quizContainerElement.appendChild(embeddedTextElement);

    // Create the quiz question container
    const quizQuestionElement = document.createElement("div");
    quizQuestionElement.id = "quiz-question";
    quizContainerElement.appendChild(quizQuestionElement);

    // Create the quiz answers container
    const quizAnswersElement = document.createElement("div");
    quizAnswersElement.id = "quiz-answers";
    quizContainerElement.appendChild(quizAnswersElement);

    // Generate the quiz question and answers
    quizData.Questions.forEach((question, questionIndex) => {
        const questionElement = document.createElement("div");
        questionElement.classList.add("quiz-question");

        const questionTitleElement = document.createElement("h2");
        questionTitleElement.innerText = question.Text;
        questionElement.appendChild(questionTitleElement);

        const questionImageElement = document.createElement("img");
        questionImageElement.src = quizData.Banner;
        questionElement.appendChild(questionImageElement);

        quizQuestionElement.appendChild(questionElement);

        question.Options.forEach((option, optionIndex) => {
            const answerButtonElement = document.createElement("button");
            answerButtonElement.classList.add("answer-btn");
            answerButtonElement.id = `answer-${questionIndex + 1}-${optionIndex + 1}`;
            answerButtonElement.innerText = option;
            quizAnswersElement.appendChild(answerButtonElement);
        });
    });
}


