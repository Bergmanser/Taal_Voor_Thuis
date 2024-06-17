
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { redirectUserBasedOnRole } from './roleRedirect.js';
import { app, auth, db } from "./firebase_config.js"

const quizzesCollection = collection(db, "quizzes");
let quizzes = [];
let currentPage = 1;
const quizzesPerPage = 6;

onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchQuizzes();
        // Call the function with the expected role for the parent dashboard (e.g., 1 and 2 for parents and organization users)
        redirectUserBasedOnRole([0]);
    } else {
        window.location.href = "login_student_tvt.html";
    }
});

async function fetchQuizzes() {
    const querySnapshot = await getDocs(quizzesCollection);
    querySnapshot.forEach((doc) => {
        quizzes.push({ id: doc.id, ...doc.data() });
    });
    displayQuizzes();
    setupPagination();
}

function displayQuizzes() {
    const startIndex = (currentPage - 1) * quizzesPerPage;
    const endIndex = startIndex + quizzesPerPage;
    const quizzesToDisplay = quizzes.slice(startIndex, endIndex);

    let cards = "";
    quizzesToDisplay.forEach((quizData) => {
        cards += `
            <div class="card">
                <img class="card-img-top" src="${quizData.Banner}" alt="Quiz banner">
                <div class="card-body">
                    <h5 class="card-title">${quizData.Title}</h5>
                    <button class="btn btn-primary card-btn" data-quiz-id="${quizData.id}">Start Quiz</button>
                </div>
            </div>
        `;
    });

    document.getElementById("quizzes").innerHTML = cards;
    setupQuizButtons();
}

function setupQuizButtons() {
    const quizButtons = document.querySelectorAll(".card-btn");
    quizButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const quizId = button.dataset.quizId;
            redirectToQuiz(quizId);
        });
    });
}

function redirectToQuiz(quizId) {
    window.location.href = `quiz.html?id=${quizId}`;
}

function setupPagination() {
    const pageCount = Math.ceil(quizzes.length / quizzesPerPage);
    document.getElementById("page-numbers").innerText = `${currentPage} / ${pageCount}`;
    document.getElementById("prev-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === pageCount;

    document.getElementById("prev-page").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayQuizzes();
            setupPagination();
        }
    });

    document.getElementById("next-page").addEventListener("click", () => {
        if (currentPage < pageCount) {
            currentPage++;
            displayQuizzes();
            setupPagination();
        }
    });
}
