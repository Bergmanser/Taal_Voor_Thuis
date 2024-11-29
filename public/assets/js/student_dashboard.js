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
    const statTrackerHeader = document.querySelector('.stat-tracker-header');
    const contentWrapper = document.querySelector('.content-wrapper');

    if (scores.length === 0) {
        document.getElementById('averageScoreChart').classList.add('d-none');
        noDataMessage.classList.remove('d-none');
        statTrackerHeader.classList.add('d-none');
        contentWrapper.classList.add('d-none');
    } else {
        document.getElementById('averageScoreChart').classList.remove('d-none');
        noDataMessage.classList.add('d-none');
        statTrackerHeader.classList.remove('d-none');
        contentWrapper.classList.remove('d-none');
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
};
class QuizManager {
    constructor() {
        this.completedPage = 1;
        this.uncompletedPage = 1;
        this.itemsPerPage = 6;
        this.filters = {
            type: '',
            sort: 'newFirst',
            group: '',
            questionType: ''
        };

        this.setupFilterListeners();
    }

    setupFilterListeners() {
        const filterIds = ['quizTypeFilter', 'sortOrderFilter', 'quizGroupFilter', 'questionTypeFilter'];
        filterIds.forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                this.updateFilters(id, e.target.value);
                this.refreshDisplay();
            });
        });
    }

    updateFilters(filterId, value) {
        const filterMap = {
            'quizTypeFilter': 'type',
            'sortOrderFilter': 'sort',
            'quizGroupFilter': 'group',
            'questionTypeFilter': 'questionType'
        };
        this.filters[filterMap[filterId]] = value;
        // Reset pages when filters change
        this.completedPage = 1;
        this.uncompletedPage = 1;
    }

    applyFilters(quizzes) {
        let filtered = [...quizzes];

        if (this.filters.type) {
            filtered = filtered.filter(quiz => quiz.QuizType === this.filters.type);
        }

        if (this.filters.group) {
            filtered = filtered.filter(quiz => quiz.QuizGroupId === this.filters.group);
        }

        if (this.filters.questionType) {
            filtered = filtered.filter(quiz =>
                quiz.Questions.some(q => q.QuestionType === this.filters.questionType)
            );
        }

        // Apply sorting
        switch (this.filters.sort) {
            case 'newFirst':
                filtered.sort((a, b) => new Date(b.completedAt || b.Created_at) - new Date(a.completedAt || a.Created_at));
                break;
            case 'oldFirst':
                filtered.sort((a, b) => new Date(a.completedAt || a.Created_at) - new Date(b.completedAt || b.Created_at));
                break;
            case 'random':
                filtered.sort(() => Math.random() - 0.5);
                break;
        }

        return filtered;
    }

    getPaginatedQuizzes(quizzes, page) {
        const start = (page - 1) * this.itemsPerPage;
        return quizzes.slice(start, start + this.itemsPerPage);
    }

    setupPagination(section, quizzes, currentPage, updateCallback) {
        const pageCount = Math.ceil(quizzes.length / this.itemsPerPage);
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'section-pagination';

        paginationContainer.innerHTML = `
            <button class="page-btn prev-page" ${currentPage === 1 ? 'disabled' : ''}>
                Previous
            </button>
            <span class="page-numbers">${currentPage} / ${pageCount}</span>
            <button class="page-btn next-page" ${currentPage === pageCount ? 'disabled' : ''}>
                Next
            </button>
        `;

        // Remove existing pagination if any
        const existingPagination = section.querySelector('.section-pagination');
        if (existingPagination) {
            existingPagination.remove();
        }

        section.appendChild(paginationContainer);

        // Add event listeners
        paginationContainer.querySelector('.prev-page').addEventListener('click', () => {
            if (currentPage > 1) {
                updateCallback(currentPage - 1);
            }
        });

        paginationContainer.querySelector('.next-page').addEventListener('click', () => {
            if (currentPage < pageCount) {
                updateCallback(currentPage + 1);
            }
        });
    }

    refreshDisplay() {
        // Get and filter all quizzes
        const filteredCompleted = this.applyFilters(this.completedQuizzes);
        const filteredUncompleted = this.applyFilters(this.uncompletedQuizzes);

        // Display with pagination
        const completedToShow = this.getPaginatedQuizzes(filteredCompleted, this.completedPage);
        const uncompletedToShow = this.getPaginatedQuizzes(filteredUncompleted, this.uncompletedPage);

        // Update displays
        displayCompletedQuizzes(completedToShow);
        displayUncompletedQuizzes(uncompletedToShow);

        // Setup pagination for both sections
        const completedSection = document.querySelector('#completed-quizzes').parentElement;
        const uncompletedSection = document.querySelector('#uncompleted-quizzes').parentElement;

        this.setupPagination(completedSection, filteredCompleted, this.completedPage,
            (newPage) => {
                this.completedPage = newPage;
                this.refreshDisplay();
            }
        );

        this.setupPagination(uncompletedSection, filteredUncompleted, this.uncompletedPage,
            (newPage) => {
                this.uncompletedPage = newPage;
                this.refreshDisplay();
            }
        );
    }
}

// Initialize the manager
const quizManager = new QuizManager();

// Modify fetchQuizzes to use the manager
async function fetchQuizzes() {
    const querySnapshot = await getDocs(quizzesCollection);
    const allQuizzes = [];
    querySnapshot.forEach((doc) => {
        allQuizzes.push({ id: doc.id, ...doc.data() });
    });

    const studentDoc = await getDoc(doc(db, "studentdb", auth.currentUser.uid));
    const completedQuizzes = studentDoc.data()?.quizzes || {};

    quizManager.completedQuizzes = [];
    quizManager.uncompletedQuizzes = [];

    allQuizzes.forEach(quiz => {
        if (completedQuizzes[quiz.Title]) {
            const quizData = completedQuizzes[quiz.Title];
            quizManager.completedQuizzes.push({
                ...quiz,
                scoreWithHints: parseFloat(quizData.scoreWithHints || 0).toFixed(1),
                scoreWithoutHints: parseFloat(quizData.scoreWithoutHints || 0).toFixed(1),
                completedAt: quizData.dateTime
            });
        } else {
            quizManager.uncompletedQuizzes.push(quiz);
        }
    });

    quizManager.refreshDisplay();
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

// function displaySeparatedQuizzes(allQuizzes, completedQuizzes) {
//     const completed = [];
//     const uncompleted = [];

//     console.log('All Quizzes:', allQuizzes);
//     console.log('Completed Quizzes Data:', completedQuizzes);

//     allQuizzes.forEach(quiz => {
//         if (completedQuizzes[quiz.Title]) {
//             const quizData = completedQuizzes[quiz.Title];
//             console.log(`Quiz "${quiz.Title}" completion data:`, quizData);

//             completed.push({
//                 ...quiz,
//                 scoreWithHints: parseFloat(quizData.scoreWithHints || 0).toFixed(1),
//                 scoreWithoutHints: parseFloat(quizData.scoreWithoutHints || 0).toFixed(1),
//                 completedAt: quizData.dateTime
//             });
//         } else {
//             uncompleted.push(quiz);
//         }
//     });

//     console.log('Processed Completed Quizzes:', completed);
//     console.log('Uncompleted Quizzes:', uncompleted);

//     // Sort completed quizzes by completion date (newest first)
//     completed.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

//     // Randomize uncompleted quizzes
//     const shuffledUncompleted = [...uncompleted].sort(() => Math.random() - 0.5);

//     displayUncompletedQuizzes(shuffledUncompleted);
//     displayCompletedQuizzes(completed);
// }

function displayUncompletedQuizzes(quizzes) {
    const filteredQuizzes = applyFilters(quizzes);


    // Then randomize the filtered uncompleted quizzes
    const shuffledQuizzes = [...filteredQuizzes].sort(() => Math.random() - 0.5);

    const container = document.getElementById('uncompleted-quizzes');
    container.innerHTML = shuffledQuizzes.length ? shuffledQuizzes.map(quiz => `
        <div class="quiz-card" data-quiz-id="${quiz.id}">
            <img class="quiz-image" src="${quiz.Banner}" alt="Quiz banner">
            <div class="quiz-content">
                <h3 class="quiz-title">${quiz.Title}</h3>
                <p class="quiz-description">${quiz.Description}</p>
                <div class="quiz-footer">
                    <div class="quiz-meta">
                        <span class="quiz-type">${quiz.QuizType}</span>
                        <span class="quiz-questions">${quiz.Questions.length} Questions</span>
                    </div>
                    <button class="start-quiz-btn" data-quiz-id="${quiz.id}">
                        Start Quiz
                    </button>
                </div>
            </div>
        </div>
    `).join('') : '<div class="no-quizzes-message">No available quizzes</div>';

    setupQuizButtons();
}

function getScoreColor(score) {
    // Convert score to number if it's a string
    score = parseFloat(score);

    // Color ranges for different score levels
    if (score >= 8.5) {
        return {
            background: '#4CAF50',  // Green
            text: '#E8F5E9'         // Light green text
        };
    } else if (score >= 7.0) {
        return {
            background: '#8BC34A',  // Light green
            text: '#F1F8E9'         // Very light green text
        };
    } else if (score >= 5.5) {
        return {
            background: '#FFC107',  // Amber/Yellow
            text: '#FFFFFF'         // White text
        };
    } else if (score >= 4.0) {
        return {
            background: '#FF9800',  // Orange
            text: '#FFF3E0'         // Light orange text
        };
    } else {
        return {
            background: '#FF7043',  // Deep Orange - encouraging rather than red
            text: '#FBE9E7'         // Light orange text
        };
    }
}

function formatCompletionDate(completedAt) {
    const now = new Date();
    const completedDate = new Date(completedAt);
    const timeDiff = now - completedDate; // Difference in milliseconds
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff >= 1) {
        if (daysDiff === 1) {
            return 'Yesterday';
        } else {
            return completedDate.toLocaleDateString(); // Default date format
        }
    } else if (hoursDiff >= 1) {
        return `${hoursDiff} hours ago`;
    } else if (minutesDiff >= 1) {
        return `${minutesDiff} minutes ago`;
    } else {
        return 'Just now';
    }
}

function displayCompletedQuizzes(quizzes) {
    const container = document.getElementById('completed-quizzes');
    container.innerHTML = quizzes.length ? quizzes.map(quiz => {
        // Calculate score color based on each score
        const hintsScoreColor = getScoreColor(quiz.scoreWithHints);
        const withoutHintsScoreColor = getScoreColor(quiz.scoreWithoutHints);

        return `
        <div class="quiz-card quiz-card-completed" data-quiz-id="${quiz.id}">
            <div class="score-badge-stacked">
                <div class="score-card-mini with-hints" 
                     style="background-color: ${hintsScoreColor.background}">
                    <span class="score-value">${quiz.scoreWithHints}</span>
                    <span class="score-label">WITH HINTS</span>
                </div>
                <div class="score-card-mini without-hints"
                     style="background-color: ${withoutHintsScoreColor.background}">
                    <span class="score-value">${quiz.scoreWithoutHints}</span>
                    <span class="score-label">WITHOUT HINTS</span>
                </div>
            </div>
            <img class="quiz-image" src="${quiz.Banner}" alt="Quiz banner">
            <div class="quiz-content">
                <h3 class="quiz-title">${quiz.Title}</h3>
                <p class="quiz-description">${quiz.Description}</p>
                <div class="quiz-footer">
                    <div class="quiz-meta">
                        <span class="completion-date">Completed: ${formatCompletionDate(quiz.completedAt)}</span>
                        <span class="quiz-type">${quiz.QuizType}</span>
                    </div>
                    <button class="start-quiz-btn" data-quiz-id="${quiz.id}">
                        Retry Quiz
                    </button>
                </div>
            </div>
        </div>
    `}).join('') : '<div class="no-quizzes-message">No completed quizzes yet</div>';

    setupQuizButtons();
}

// Modified setupQuizButtons to handle both sections
function setupQuizButtons() {
    document.querySelectorAll(".start-quiz-btn").forEach(button => {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            const quizId = this.dataset.quizId; // Using data attribute directly from button
            if (quizId) {
                redirectToQuiz(quizId);
            }
        });
    });
}


function redirectToQuiz(quizId) {
    window.location.href = `quiz.html?id=${quizId}`;
}

// Add this to handle pagination for both sections if needed
function setupPagination(section, quizzes) {
    const itemsPerPage = 6; // Your existing quizzesPerPage value
    const pageCount = Math.ceil(quizzes.length / itemsPerPage);
    const paginationContainer = section.querySelector('.pagination');

    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <button class="page-btn prev-page" ${currentPage === 1 ? 'disabled' : ''}>Vorige</button>
            <span class="page-numbers">${currentPage} / ${pageCount}</span>
            <button class="page-btn next-page" ${currentPage === pageCount ? 'disabled' : ''}>Volgende</button>
        `;

        // Add your existing pagination event listeners
        const prevBtn = paginationContainer.querySelector('.prev-page');
        const nextBtn = paginationContainer.querySelector('.next-page');

        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayQuizzesBySection(section, quizzes);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentPage < pageCount) {
                currentPage++;
                displayQuizzesBySection(section, quizzes);
            }
        });
    }
}

// Helper function to display quizzes for a specific section with pagination
function displayQuizzesBySection(section, quizzes) {
    const startIndex = (currentPage - 1) * quizzesPerPage;
    const endIndex = startIndex + quizzesPerPage;
    const quizzesToDisplay = quizzes.slice(startIndex, endIndex);

    if (section.id === 'uncompleted-quizzes') {
        displayUncompletedQuizzes(quizzesToDisplay);
    } else {
        displayCompletedQuizzes(quizzesToDisplay);
    }

    setupPagination(section, quizzes);
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
