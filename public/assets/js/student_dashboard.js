import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { redirectUserBasedOnRole } from './roleRedirect.js';
import { app, auth, db } from "./firebase_config.js";

const quizzesCollection = collection(db, "quizzes");
let quizzes = [];
let currentPage = 1;
const quizzesPerPage = 6;

const subjectColors = {
    woordenschat: '#e3f2fd',
    samenvatten: '#e8f5e9',
    'verwijs-signaalwoorden': '#fff3e0',
    grammatica: '#f3e5f5',
    anders: '#ffebee'
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchStudentData(user.uid);
        fetchQuizzes();
        redirectUserBasedOnRole([0]);
    } else {
        window.location.href = "login_student_tvt.html";
    }
});

async function fetchStudentData(userId) {
    const studentDocRef = doc(db, "studentdb", userId);
    const studentDoc = await getDoc(studentDocRef);

    if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        const scores = [];
        for (const [quiz, details] of Object.entries(studentData.quizzes)) {
            scores.push({
                title: details.title,
                subject: details.type.toLowerCase(),
                scoreWithHints: parseFloat(details.scoreWithHints),
                scoreWithoutHints: parseFloat(details.scoreWithoutHints),
                date: new Date(details.dateTime)
            });
        }
        updateDashboard(scores);
    } else {
        console.log("No such document!");
    }
}

function updateDashboard(scores) {
    if (scores.length === 0) {
        document.getElementById('averageScoreChart').classList.add('d-none');
        document.getElementById('no-data-message').classList.remove('d-none');
    } else {
        updateChart(scores);
        updateRecentScores(scores);
    }
}

function updateChart(scores) {
    const ctx = document.getElementById('averageScoreChart').getContext('2d');
    const data = calculateAverageScores(scores);

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data.averagesWithoutHints),
            datasets: [{
                data: Object.values(data.averagesWithoutHints),
                backgroundColor: Object.keys(data.averagesWithoutHints).map(subject => subjectColors[subject])
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw.toFixed(1)}`;
                        }
                    }
                }
            },
            onClick: function (event, elements) {
                if (elements.length) {
                    const index = elements[0].index;
                    const subject = context.chart.data.labels[index];
                    showSubjectDetails(subject, data);
                }
            }
        }
    });

    document.getElementById('average-score-text').innerText = calculateOverallAverage(scores).toFixed(1);
}

function showSubjectDetails(subject, data) {
    document.getElementById('subject-name').innerText = `Subject: ${subject}`;
    document.getElementById('average-with-hints').innerText = `Average with hints: ${data.averagesWithHints[subject].toFixed(1)}`;
    document.getElementById('average-without-hints').innerText = `Average without hints: ${data.averagesWithoutHints[subject].toFixed(1)}`;
    document.getElementById('subject-details').classList.remove('d-none');
}

function calculateAverageScores(scores) {
    const subjectSumsWithHints = {};
    const subjectSumsWithoutHints = {};
    const subjectCounts = {};

    scores.forEach(score => {
        const subject = score.subject;
        if (!subjectSumsWithHints[subject]) {
            subjectSumsWithHints[subject] = 0;
            subjectSumsWithoutHints[subject] = 0;
            subjectCounts[subject] = 0;
        }
        subjectSumsWithHints[subject] += score.scoreWithHints;
        subjectSumsWithoutHints[subject] += score.scoreWithoutHints;
        subjectCounts[subject] += 1;
    });

    const averagesWithHints = {};
    const averagesWithoutHints = {};
    for (const subject in subjectSumsWithHints) {
        averagesWithHints[subject] = subjectSumsWithHints[subject] / subjectCounts[subject];
        averagesWithoutHints[subject] = subjectSumsWithoutHints[subject] / subjectCounts[subject];
    }

    return { averagesWithHints, averagesWithoutHints };
}

function calculateOverallAverage(scores) {
    const totalScore = scores.reduce((sum, score) => sum + score.scoreWithoutHints, 0);
    return totalScore / scores.length;
}

function updateRecentScores(scores) {
    scores.sort((a, b) => b.date - a.date);
    const recentScores = scores.slice(0, 3);

    const container = $('#recent-scores');
    container.empty();

    recentScores.forEach(score => {
        container.append(`
            <div class="score-card" data-subject="${score.subject}">
                <div class="score-title">${score.title}</div>
                <div class="score-values">${score.scoreWithHints} | ${score.scoreWithoutHints}</div>
            </div>
        `);
    });
}

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

// parallax.js
window.addEventListener('scroll', function() {
    const parallax = document.querySelector('.parallax-background');
    let scrollPosition = window.pageYOffset;

    parallax.style.transform = 'translateY(' + scrollPosition * 0.5 + 'px)';
});
