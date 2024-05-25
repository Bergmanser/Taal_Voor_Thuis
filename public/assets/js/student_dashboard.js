import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Main Config for Project Plato
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
        fetchQuizzes(); // Call fetchQuizzes function
    } else {
        // Redirect the user to the 'login_student_tvt.html'
        window.location.href = "login_student_tvt.html";
    }
});

async function fetchQuizzes() {
    const querySnapshot = await getDocs(collection(db, "quizzes"));
    let cards = "";
    querySnapshot.forEach((doc) => {
        console.log("Document data:", doc.data())
        const quizData = doc.data();
        cards += `
            <div class="card">
                <img class="card-img-top" src="${quizData.Banner}" alt="Quiz banner">
                <div class="card-body">
                    <h5 class="card-title">${quizData.Title}</h5>
                    <p class="card-text">Score: <span id="quiz-score-${doc.id}">Hidden</span></p>
                    <button class="btn btn-primary card-btn" data-quiz-id="${doc.id}">Start Quiz</button>
                </div>
            </div>
        `;
    });

    // Render quiz cards to the DOM
    document.getElementById("quizzes").innerHTML = cards;

    // Attach event listeners to quiz buttons
    const quizButtons = document.querySelectorAll(".card-btn");
    console.log("Number of quiz buttons:", quizButtons.length);
    quizButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const quizId = button.dataset.quizId;
            console.log("Quiz ID:", quizId);
            redirectToQuiz(quizId);
        });
    });
}

function redirectToQuiz(quizId) {
    // Redirect to the individual quiz page
    window.location.href = `quiz.html?id=${quizId}`;
}

