import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { redirectUserBasedOnRole } from './roleRedirect.js';
import { app, auth, db } from "./firebase_config.js";

const quizzesCollection = collection(db, "quizzes");
let quizzes = [];
let currentPage = 1;
const quizzesPerPage = 6;

const subjectColors = {
    woordenschat: '#1A3A5F',  // Blue
    samenvatten: '#5C7E9C',   // Muted Blue
    'verwijswoorden&signaalwoorden': '#D6A664', // Gold
    grammatica: '#b75ad6',    // Purple
    anders: '#C23A2b'         // Red
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
        if (!studentData.quizzes || Object.keys(studentData.quizzes).length === 0) {
            updateDashboard(scores);
        } else {
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
        }
    } else {
        console.log("No such document!");
    }
}

function updateDashboard(scores) {
    const noDataMessage = document.getElementById('no-data-message');
    if (scores.length === 0) {
        document.getElementById('averageScoreChart').classList.add('d-none');
        noDataMessage.classList.remove('d-none');
    } else {
        document.getElementById('averageScoreChart').classList.remove('d-none');
        noDataMessage.classList.add('d-none');
        updateChart(scores);
        updateRecentScores(scores);
        updateBestWorstScores(scores);
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

    const overallAverageWithHints = calculateOverallAverageWithHints(scores);
    const overallAverageWithoutHints = calculateOverallAverage(scores);

    document.getElementById('average-score-title').innerText = 'Total account average';
    document.getElementById('average-score-text').innerHTML = `
        <span data-tooltip="With hints">${overallAverageWithHints.toFixed(1)}</span>
        <div class="divider"></div>
        <span data-tooltip="Without hints">${overallAverageWithoutHints.toFixed(1)}</span>
    `;
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

function calculateOverallAverageWithHints(scores) {
    const totalScore = scores.reduce((sum, score) => sum + score.scoreWithHints, 0);
    return totalScore / scores.length;
}

function updateRecentScores(scores) {
    const container = document.getElementById('dynamic-recent-exercises');
    if (scores.length === 0) {
        container.innerHTML = '';
        return;
    }

    scores.sort((a, b) => b.date - a.date);
    const recentScores = scores.slice(0, 3);

    container.innerHTML = '<h5>The most recently finished exercises:</h5>';

    recentScores.forEach(score => {
        container.innerHTML += `
            <div class="score-card" data-subject="${score.subject}">
                <div class="score-title" style="background-color: ${subjectColors[score.subject]}">${score.title}</div>
                <div class="score-values">
                    <span class="score with-hints" data-tooltip="Score with hints">${score.scoreWithHints}</span>
                    <span class="score without-hints" data-tooltip="Score without hints">${score.scoreWithoutHints}</span>
                </div>
            </div>
        `;
    });
}

function updateBestWorstScores(scores) {
    if (scores.length === 0) return;

    const container = document.getElementById('dynamic-best-worst-scores');
    const averageScores = calculateAverageScores(scores);

    let bestSubject = null;
    let worstSubject = null;
    let highestAverage = -Infinity;
    let lowestAverage = Infinity;

    for (const subject in averageScores.averagesWithoutHints) {
        const average = averageScores.averagesWithoutHints[subject];
        if (average > highestAverage) {
            highestAverage = average;
            bestSubject = subject;
        }
        if (average < lowestAverage) {
            lowestAverage = average;
            worstSubject = subject;
        }
    }

    if (bestSubject !== null || worstSubject !== null) {
        container.innerHTML = `
            <div class="score-card" id="best-subject">
                <div class="score-title" style="background-color: ${subjectColors[bestSubject]}">Best Subject: ${bestSubject}</div>
                <div class="score-values">
                    <span class="score with-hints" data-tooltip="Average score with hints">${averageScores.averagesWithHints[bestSubject].toFixed(1)}</span>
                    <span class="score without-hints" data-tooltip="Average score without hints">${averageScores.averagesWithoutHints[bestSubject].toFixed(1)}</span>
                </div>
            </div>
            <div class="score-card" id="worst-subject">
                <div class="score-title" style="background-color: ${subjectColors[worstSubject]}">Subject with Room for Improvement: ${worstSubject}</div>
                <div class="score-values">
                    <span class="score with-hints" data-tooltip="Average score with hints">${averageScores.averagesWithHints[worstSubject].toFixed(1)}</span>
                    <span class="score without-hints" data-tooltip="Average score without hints">${averageScores.averagesWithoutHints[worstSubject].toFixed(1)}</span>
                </div>
            </div>
        `;
    }
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
    const quizzesToDisplay = applyFilters(quizzes).slice(startIndex, endIndex);

    let cards = "";
    quizzesToDisplay.forEach((quizData) => {
        let subjectClass = 'unknown';
        if (quizData.QuizType) {
            subjectClass = quizData.QuizType.toLowerCase().replace(/\s/g, '-');
        }
        cards += `
            <div class="card subject-color-${subjectClass}">
                <img class="card-img-top" src="${quizData.Banner}" alt="Quiz banner">
                <div class="card-content">
                    <h5 class="card-title">${quizData.Title}</h5>
                    <p class="card-description">${quizData.Description}</p>
                    <div class="">
                        <button class="card-btn" data-quiz-id="${quizData.id}">Start Quiz</button>
                    </div>
                </div>
                <div class="overlay">
                    <button class="card-btn" data-quiz-id="${quizData.id}">Start Quiz</button>
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

// Apply Filters immediately when any filter changes
document.querySelectorAll('#quizTypeFilter, #sortOrderFilter, #quizGroupFilter, #questionTypeFilter').forEach(filterElement => {
    filterElement.addEventListener('change', () => {
        currentPage = 1;
        displayQuizzes();
        setupPagination();
    });
});

function applyFilters(quizzes) {
    const quizTypeFilter = document.getElementById("quizTypeFilter").value;
    const sortOrderFilter = document.getElementById("sortOrderFilter").value;
    const quizGroupFilter = document.getElementById("quizGroupFilter").value;
    const questionTypeFilter = document.getElementById("questionTypeFilter").value;

    let filteredQuizzes = quizzes;

    if (quizTypeFilter) {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.QuizType === quizTypeFilter);
    }

    if (quizGroupFilter) {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.QuizGroupId === quizGroupFilter);
    }

    if (questionTypeFilter) {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.Questions.some(question => question.QuestionType === questionTypeFilter));
    }

    switch (sortOrderFilter) {
        case "newFirst":
            filteredQuizzes = filteredQuizzes.sort((a, b) => b.Created_at - a.Created_at);
            break;
        case "oldFirst":
            filteredQuizzes = filteredQuizzes.sort((a, b) => a.Created_at - b.Created_at);
            break;
        case "random":
            filteredQuizzes = filteredQuizzes.sort(() => Math.random() - 0.5);
            break;
    }

    return filteredQuizzes;
}

// parallax.js
window.addEventListener('scroll', function () {
    const parallaxHero = document.querySelector('.parallax-background');
    const parallaxQuiz = document.querySelector('.parallax-quiz-background');
    let scrollPosition = window.pageYOffset;

    parallaxHero.style.transform = 'translateY(' + scrollPosition * 0.5 + 'px)';
    parallaxQuiz.style.transform = 'translateY(' + scrollPosition * 0.3 + 'px)';
});

// carousel.js
window.addEventListener('load', () => {
    const images = document.querySelectorAll('.parallax-image');
    let currentIndex = 0;
    const duration = 4000; // 4 seconds
    const transitionDuration = 1500; // 1.5 seconds

    function changeBackground() {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
    }

    setInterval(changeBackground, duration + transitionDuration);

    images[currentIndex].classList.add('active');
});
