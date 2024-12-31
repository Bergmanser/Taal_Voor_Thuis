import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { redirectUserBasedOnRole } from './roleRedirect.js';
import { app, auth, db } from "./firebase_config.js";
import { createQuizStateManager } from "./quiz_state_manager.js";
// import { pageUrls } from "./config.js";

// $(document).ready(function () {
//     // Load the global header dynamically
//     $('#header-container').load(pageUrls.globalHeader, function (response, status, xhr) {
//         if (status === "error") {
//             console.error("Error loading global header:", xhr.status, xhr.statusText);
//         } else {
//             console.log("Global header loaded successfully.");
//         }
//     });
// });

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
        updateWelcomeMessage();
        fetchStudentData(user.uid);
        fetchQuizzes();
        redirectUserBasedOnRole([0]);
    } else {
        window.location.href = "login_student_tvt.html";
    }
});

async function fetchStudentData(userId) {
    try {
        console.log("Fetching data for user:", userId);
        const studentDocRef = doc(db, "studentdb", userId);
        const studentDoc = await getDoc(studentDocRef);

        if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            const scores = [];

            if (!studentData.quizzes) {
                console.log("No quizzes found for student");
                updateDashboard(scores);
                return;
            }

            console.log("Raw quiz data:", studentData.quizzes);

            for (const [quizId, details] of Object.entries(studentData.quizzes)) {
                // Skip if details is null or undefined
                if (!details) {
                    console.warn(`No details for quiz ${quizId}. Skipping.`);
                    continue;
                }

                // Debug log for quiz state/status
                console.log(`Quiz ${quizId} - State: ${details.state}, Status: ${details.status}`);

                // Check completion status - a quiz is considered finished if:
                // 1. state is 'finished' OR status is 'finished'
                // 2. has required score fields
                if ((details.state === 'finished' || details.status === 'finished') &&
                    typeof details.scoreWithHints !== 'undefined' &&
                    typeof details.scoreWithoutHints !== 'undefined') {

                    try {
                        scores.push({
                            quizId: quizId,
                            title: details.title || 'Untitled Quiz',
                            subject: details.type?.toLowerCase() || 'unknown',
                            scoreWithHints: parseFloat(details.scoreWithHints),
                            scoreWithoutHints: parseFloat(details.scoreWithoutHints),
                            date: new Date(details.dateTime || Date.now()),
                            banner: details.banner || null
                        });
                    } catch (parseError) {
                        console.error(`Error processing finished quiz ${quizId}:`, parseError);
                    }
                } else {
                    console.log(`Quiz ${quizId} not counted as finished. Missing required completion data.`);
                }
            }

            console.log(`Processed ${scores.length} finished quizzes:`, scores);
            updateDashboard(scores);
        } else {
            console.log("No student document found!");
            updateDashboard([]);
        }
    } catch (error) {
        console.error("Error fetching student data:", error);
        updateDashboard([]);
    }
}

async function updateWelcomeMessage() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Query student database first for student users
        const studentSnapshot = await getDocs(
            query(collection(db, "studentdb"), where("email", "==", user.email))
        );

        let username;
        if (!studentSnapshot.empty) {
            // If found in studentdb, use that username
            username = studentSnapshot.docs[0].data().username;
        } else {
            // Fallback to users collection
            const userSnapshot = await getDocs(
                query(collection(db, "users"), where("email", "==", user.email))
            );
            if (!userSnapshot.empty) {
                username = userSnapshot.docs[0].data().username;
            }
        }

        // Update the welcome message with the found username
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.innerHTML = `
                <h1>Welkom bij Taal Voor Thuis, ${username || 'student'}!</h1>
                <p>Kies een van de beschikbare quizzes om je leerpad te beginnen!</p>
            `;
        }
    } catch (error) {
        console.error('Error updating welcome message:', error);
    }
}

function updateDashboard(scores) {
    try {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => updateDashboard(scores));
            return;
        }

        const statsGrid = document.querySelector('.stats-grid');
        if (!statsGrid) {
            console.error('Stats grid not found. Waiting for element...');
            // Retry after a short delay
            setTimeout(() => updateDashboard(scores), 100);
            return;
        }

        console.log("Initial scores received:", scores);

        if (scores.length === 0) {
            statsGrid.style.display = 'none';
            const noDataMessage = document.createElement('div');
            noDataMessage.className = 'no-data-message';
            noDataMessage.textContent = 'Kom later terug nadat je een oefening hebt afgerond. Succes!';
            statsGrid.parentElement.insertBefore(noDataMessage, statsGrid);
            return;
        }

        statsGrid.style.display = 'grid';
        const existingNoData = document.querySelector('.no-data-message');
        if (existingNoData) {
            existingNoData.remove();
        }

        const subjectData = processScores(scores);

        // Update each component with error handling
        try {
            updateScoreOverviewChart(subjectData);
        } catch (e) {
            console.error('Error updating chart:', e);
        }

        try {
            updatePerformanceCards(subjectData);
        } catch (e) {
            console.error('Error updating performance cards:', e);
        }

        try {
            console.log("All scores before filtering:", scores);

            // Filter completed quizzes
            const completedQuizzes = scores.filter(quiz =>
                typeof quiz.scoreWithHints !== 'undefined' &&
                typeof quiz.scoreWithoutHints !== 'undefined' &&
                quiz.date // Using date instead of dateTime/lastUpdated
            );

            console.log("Completed quizzes after filtering:", completedQuizzes);

            // Sort by most recent first
            completedQuizzes.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });

            console.log("Sorted completed quizzes:", completedQuizzes);

            // Take only the 3 most recent quizzes
            const recentQuizzes = completedQuizzes.slice(0, 3);

            console.log("Recent quizzes to be displayed:", recentQuizzes);

            if (recentQuizzes.length > 0) {
                updateRecentQuizzes(recentQuizzes);
            }
        } catch (e) {
            console.error('Error updating recent quizzes:', e);
        }

    } catch (error) {
        console.error("Error in updateDashboard:", error);
    }
}

function processScores(scores) {
    console.log("Processing scores:", scores);
    const subjects = {};

    // Process all scores by subject
    scores.forEach(score => {
        if (!subjects[score.subject]) {
            subjects[score.subject] = {
                totalWithHints: 0,
                totalWithoutHints: 0,
                count: 0,
                scores: [],
                lastCompletedDate: null
            };
        }

        console.log(`Processing score for subject ${score.subject}:`, score);

        subjects[score.subject].totalWithHints += score.scoreWithHints;
        subjects[score.subject].totalWithoutHints += score.scoreWithoutHints;
        subjects[score.subject].count += 1;

        // Safer date handling
        let completionDate;
        try {
            // Try to parse the date, falling back to current date if invalid
            if (score.date instanceof Date) {
                completionDate = score.date;
            } else if (score.dateTime) {
                completionDate = new Date(score.dateTime);
            } else if (score.lastUpdated) {
                completionDate = new Date(score.lastUpdated);
            } else {
                completionDate = new Date(); // Fallback to current date
            }

            // Validate the date
            if (isNaN(completionDate.getTime())) {
                completionDate = new Date(); // Fallback if invalid
            }
        } catch (error) {
            console.warn('Error parsing date, using current date:', error);
            completionDate = new Date();
        }

        subjects[score.subject].scores.push({
            withHints: score.scoreWithHints,
            withoutHints: score.scoreWithoutHints,
            date: completionDate
        });

        // Update most recent completion date
        if (!subjects[score.subject].lastCompletedDate ||
            completionDate > subjects[score.subject].lastCompletedDate) {
            subjects[score.subject].lastCompletedDate = completionDate;
        }
    });

    console.log("Processed subjects:", subjects);

    // Calculate averages and find best/worst subjects
    let bestSubject = null;
    let worstSubject = null;
    let highestScore = -Infinity;
    let lowestScore = Infinity;

    Object.entries(subjects).forEach(([subject, data]) => {
        const avgWithoutHints = data.totalWithoutHints / data.count;
        const avgWithHints = data.totalWithHints / data.count;

        subjects[subject].averageWithHints = avgWithHints;
        subjects[subject].averageWithoutHints = avgWithoutHints;

        // Calculate composite score with safer date handling
        const compositeScore = avgWithoutHints +
            (avgWithHints * 0.2) +
            (data.count * 0.1) +
            (data.lastCompletedDate ?
                (data.lastCompletedDate.getTime() / 100000000000) :
                0);

        console.log(`Composite score for ${subject}:`, compositeScore);

        if (compositeScore > highestScore || bestSubject === null) {
            highestScore = compositeScore;
            bestSubject = subject;
        }
        if (compositeScore < lowestScore || worstSubject === null) {
            lowestScore = compositeScore;
            worstSubject = subject;
        }
    });

    // Ensure we always have a best and worst subject if we have any subjects
    if (Object.keys(subjects).length === 1) {
        // If there's only one subject, it's both best and worst
        const onlySubject = Object.keys(subjects)[0];
        bestSubject = worstSubject = onlySubject;
    }

    console.log("Final results:", { bestSubject, worstSubject, subjects });

    return {
        subjects,
        bestSubject,
        worstSubject
    };
}

function updateScoreOverviewChart(data) {
    const ctx = document.getElementById('scoreOverviewChart').getContext('2d');
    const subjects = Object.entries(data.subjects).map(([subject, data]) => ({
        subject: subject,
        avgWithoutHints: data.averageWithoutHints
    }));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: subjects.map(s => s.subject),
            datasets: [{
                data: subjects.map(s => s.avgWithoutHints),
                backgroundColor: subjects.map(s => subjectColors[s.subject] || '#gray'),
                barPercentage: 0.8,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false,
                    beginAtZero: true,
                    max: 10
                },
                y: {
                    ticks: {
                        color: '#1A3A5F',
                        font: {
                            family: "'Arial', sans-serif",
                            size: 14
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updatePerformanceCards(data) {
    console.log("Updating performance cards with data:", data);

    const bestCard = document.querySelector('.best-performance');
    const worstCard = document.querySelector('.needs-improvement');

    if (!data.bestSubject || !data.worstSubject || !data.subjects) {
        console.warn('Missing required data for performance cards');
        return;
    }

    // Update best performance card
    if (bestCard) {
        const bestSubject = data.subjects[data.bestSubject];
        console.log("Best subject data:", bestSubject);

        if (bestSubject &&
            (bestSubject.averageWithHints >= 7.5 || bestSubject.averageWithoutHints >= 7.5)) {
            bestCard.style.display = 'block';
            bestCard.querySelector('.subject-name').textContent = data.bestSubject;
            bestCard.querySelectorAll('.score-value')[0].textContent =
                bestSubject.averageWithoutHints.toFixed(1);
            bestCard.querySelectorAll('.score-value')[1].textContent =
                bestSubject.averageWithHints.toFixed(1);
        } else {
            bestCard.style.display = 'none';
        }
    }

    // Update needs improvement card
    if (worstCard) {
        const worstSubject = data.subjects[data.worstSubject];
        console.log("Worst subject data:", worstSubject);

        // Only show needs improvement if the score is below 7.5
        if (worstSubject &&
            (worstSubject.averageWithHints < 7.5 || worstSubject.averageWithoutHints < 7.5)) {
            worstCard.style.display = 'block';
            worstCard.querySelector('.subject-name').textContent = data.worstSubject;
            worstCard.querySelectorAll('.score-value')[0].textContent =
                worstSubject.averageWithoutHints.toFixed(1);
            worstCard.querySelectorAll('.score-value')[1].textContent =
                worstSubject.averageWithHints.toFixed(1);
        } else {
            worstCard.style.display = 'none';
        }
    }
}

async function updateRecentQuizzes(scores) {
    console.log("Starting updateRecentQuizzes with scores:", scores);

    const container = document.querySelector('.recent-quizzes-list');
    if (!container) {
        console.error('Recent quizzes container not found');
        return;
    }
    console.log("Found container:", container);

    container.innerHTML = '';

    if (!scores || scores.length === 0) {
        console.log("No scores provided to updateRecentQuizzes");
        container.innerHTML = '<div class="no-recent-quizzes">Geen recente quizzes beschikbaar</div>';
        return;
    }

    // Fetch quiz details for banners
    const quizPromises = scores.map(async score => {
        try {
            console.log("Fetching details for quiz:", score.quizId);
            const quizDoc = await getDoc(doc(quizzesCollection, score.quizId));
            console.log("Got quiz doc:", quizDoc.exists(), quizDoc.data());
            return {
                ...score,
                Banner: quizDoc.exists() ? quizDoc.data().Banner : null
            };
        } catch (error) {
            console.error(`Error fetching quiz details for ${score.quizId}:`, error);
            return score;
        }
    });

    try {
        const quizzesWithBanners = await Promise.all(quizPromises);
        console.log("Final quizzes with banners:", quizzesWithBanners);

        quizzesWithBanners.forEach(score => {
            const subjectColor = subjectColors[score.subject] || '#gray';
            const quizCard = document.createElement('div');
            quizCard.className = 'recent-quiz-card';
            quizCard.style.backgroundColor = adjustColor(subjectColor, 0.15);

            quizCard.innerHTML = `
                <div class="quiz-image-container">
                    <div class="quiz-image-placeholder" 
                         style="background-image: url('${score.Banner || '../public/assets/images/MDB-Background.png'}');
                                background-size: cover;
                                background-position: center;
                                width: 48px;
                                height: 48px;
                                border-radius: 8px;"></div>
                </div>
                <div class="recent-quiz-info">
                    <div class="recent-quiz-title" style="color: ${subjectColor}">${score.title}</div>
                    <div class="recent-quiz-scores">
                        <div class="score-cell">
                            <div class="score-label">Zonder hints</div>
                            <div class="score-value" style="background-color: ${subjectColor}">
                                ${parseFloat(score.scoreWithoutHints).toFixed(1)}
                            </div>
                        </div>
                        <div class="score-cell">
                            <div class="score-label">Met hints</div>
                            <div class="score-value" style="background-color: ${subjectColor}">
                                ${parseFloat(score.scoreWithHints).toFixed(1)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(quizCard);
        });
    } catch (error) {
        console.error("Error processing quizzes with banners:", error);
        container.innerHTML = '<div class="error-message">Er is een fout opgetreden bij het laden van de recente quizzes</div>';
    }
}

// Helper function to adjust color brightness
function adjustColor(color, factor) {
    // Convert hex to RGB
    let hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Lighten the color
    r = Math.min(Math.round(r + (255 - r) * factor), 255);
    g = Math.min(Math.round(g + (255 - g) * factor), 255);
    b = Math.min(Math.round(b + (255 - b) * factor), 255);

    // Convert back to hex
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// function showSubjectDetails(subject, data) {
//     document.getElementById('subject-name').innerText = `Subject: ${subject}`;
//     document.getElementById('average-with-hints').innerText = `Average with hints: ${data.averagesWithHints[subject].toFixed(1)}`;
//     document.getElementById('average-without-hints').innerText = `Average without hints: ${data.averagesWithoutHints[subject].toFixed(1)}`;
//     document.getElementById('subject-details').classList.remove('d-none');
// }

// function calculateOverallAverage(scores) {
//     const totalScore = scores.reduce((sum, score) => sum + score.scoreWithoutHints, 0);
//     return totalScore / scores.length;
// }

// function calculateOverallAverageWithHints(scores) {
//     const totalScore = scores.reduce((sum, score) => sum + score.scoreWithHints, 0);
//     return totalScore / scores.length;
// }

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
        this.randomizedQuizzes = null;
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
        this.randomizedQuizzes = null;
        this.completedPage = 1;
        this.uncompletedPage = 1;
    }

    applyFilters(quizzes) {
        // For completed quizzes, use original logic
        if (quizzes === this.completedQuizzes) {
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

            switch (this.filters.sort) {
                case 'newFirst':
                    filtered.sort((a, b) => new Date(b.completedAt || b.Created_at) - new Date(a.completedAt || a.Created_at));
                    break;
                case 'oldFirst':
                    filtered.sort((a, b) => new Date(a.completedAt || a.Created_at) - new Date(b.completedAt || a.Created_at));
                    break;
                case 'random':
                    filtered.sort(() => Math.random() - 0.5);
                    break;
            }

            return filtered;
        }

        // For uncompleted quizzes, implement randomization persistence
        if (!this.randomizedQuizzes || this.filters.sort === 'random') {
            // Separate paused and non-paused quizzes
            let pausedQuizzes = quizzes.filter(quiz => quiz.status === 'paused');
            let otherQuizzes = quizzes.filter(quiz => quiz.status !== 'paused');

            // Apply filters to both sets
            if (this.filters.type) {
                pausedQuizzes = pausedQuizzes.filter(quiz => quiz.QuizType === this.filters.type);
                otherQuizzes = otherQuizzes.filter(quiz => quiz.QuizType === this.filters.type);
            }

            if (this.filters.group) {
                pausedQuizzes = pausedQuizzes.filter(quiz => quiz.QuizGroupId === this.filters.group);
                otherQuizzes = otherQuizzes.filter(quiz => quiz.QuizGroupId === this.filters.group);
            }

            if (this.filters.questionType) {
                pausedQuizzes = pausedQuizzes.filter(quiz =>
                    quiz.Questions.some(q => q.QuestionType === this.filters.questionType)
                );
                otherQuizzes = otherQuizzes.filter(quiz =>
                    quiz.Questions.some(q => q.QuestionType === this.filters.questionType)
                );
            }

            // Randomize the non-paused quizzes once
            const shuffledOtherQuizzes = [...otherQuizzes].sort(() => Math.random() - 0.5);

            // Store the complete randomized order
            this.randomizedQuizzes = [...pausedQuizzes, ...shuffledOtherQuizzes];
        }

        return this.randomizedQuizzes;
    }

    getPaginatedQuizzes(quizzes, page) {
        const start = (page - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return quizzes.slice(start, end);
    }

    setupPagination(section, totalPages, currentPage, updateCallback) {
        // Ensure totalPages is a number and at least 1
        totalPages = Math.max(1, parseInt(totalPages) || 1);

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'section-pagination';

        paginationContainer.innerHTML = `
            <button class="page-btn prev-page" ${currentPage === 1 ? 'disabled' : ''}>
                Vorige
            </button>
            <span class="page-numbers">${currentPage} / ${totalPages}</span>
            <button class="page-btn next-page" ${currentPage === totalPages ? 'disabled' : ''}>
                Volgende
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
            if (currentPage < totalPages) {
                updateCallback(currentPage + 1);
            }
        });
    }

    refreshDisplay() {
        const filteredCompleted = this.applyFilters(this.completedQuizzes);
        const filteredUncompleted = this.applyFilters(this.uncompletedQuizzes);

        // Calculate total pages
        const completedPages = Math.max(1, Math.ceil(filteredCompleted.length / this.itemsPerPage));
        const uncompletedPages = Math.max(1, Math.ceil(filteredUncompleted.length / this.itemsPerPage));

        // Display with pagination
        const completedToShow = this.getPaginatedQuizzes(filteredCompleted, this.completedPage);
        const uncompletedToShow = this.getPaginatedQuizzes(filteredUncompleted, this.uncompletedPage);

        // Update displays
        displayCompletedQuizzes(completedToShow);
        displayUncompletedQuizzes(uncompletedToShow);

        // Setup pagination
        const completedSection = document.querySelector('#completed-quizzes').parentElement;
        const uncompletedSection = document.querySelector('#uncompleted-quizzes').parentElement;

        this.setupPagination(completedSection, completedPages, this.completedPage,
            (newPage) => {
                this.completedPage = newPage;
                this.refreshDisplay();
            }
        );

        this.setupPagination(uncompletedSection, uncompletedPages, this.uncompletedPage,
            (newPage) => {
                this.uncompletedPage = newPage;
                this.refreshDisplay();
            }
        );
    }
}

// Initialize the manager
const quizManager = new QuizManager();

async function fetchQuizzes() {
    try {
        // Fetch all quizzes from the quizzes collection
        const querySnapshot = await getDocs(quizzesCollection);
        const allQuizzes = {};
        querySnapshot.forEach((doc) => {
            allQuizzes[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Fetch the student's quiz data
        const studentDoc = await getDoc(doc(db, "studentdb", auth.currentUser.uid));
        const studentQuizzes = studentDoc.data()?.quizzes || {};

        quizManager.completedQuizzes = [];
        quizManager.uncompletedQuizzes = [];

        // Process each quiz from the quizzes collection
        Object.entries(allQuizzes).forEach(([quizId, quizDetails]) => {
            const studentQuizData = studentQuizzes[quizId];

            if (studentQuizData) {
                // Merge student-specific quiz data with quiz details
                if (studentQuizData.state === 'finished' && studentQuizData.status === 'finished') {
                    quizManager.completedQuizzes.push({
                        ...quizDetails,
                        ...studentQuizData,
                        id: quizId,
                        Banner: quizDetails.Banner || '/path/to/default-banner.jpg',
                        scoreWithHints: parseFloat(studentQuizData.scoreWithHints || 0).toFixed(1),
                        scoreWithoutHints: parseFloat(studentQuizData.scoreWithoutHints || 0).toFixed(1),
                        completedAt: studentQuizData.dateTime || studentQuizData.lastUpdated,
                    });
                } else {
                    quizManager.uncompletedQuizzes.push({
                        ...quizDetails,
                        ...studentQuizData,
                        id: quizId,
                        status: studentQuizData.status || 'new',
                        state: studentQuizData.state || 'not_started',
                        progress: studentQuizData.progress || null,
                    });
                }
            } else {
                // Handle quizzes not found in the student's data (i.e., new quizzes)
                quizManager.uncompletedQuizzes.push({
                    ...quizDetails,
                    id: quizId,
                    status: 'new',
                    state: 'not_started',
                    progress: null,
                });
            }
        });

        // Log and refresh the display
        console.log("Completed Quizzes:", quizManager.completedQuizzes);
        console.log("Uncompleted Quizzes:", quizManager.uncompletedQuizzes);
        quizManager.refreshDisplay();
    } catch (error) {
        console.error("Error fetching quizzes:", error);
    }
}

function displayQuizzes(filteredQuizzes) {
    const container = document.getElementById('uncompleted-quizzes');
    if (!container) {
        console.error('Quiz container not found');
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * quizzesPerPage;
    const endIndex = startIndex + quizzesPerPage;
    const quizzesToDisplay = filteredQuizzes.slice(startIndex, endIndex);

    // Clear container with animation
    container.style.opacity = '0';
    setTimeout(() => {
        let cards = "";
        quizzesToDisplay.forEach((quizData) => {
            let subjectClass = 'unknown';
            if (quizData.QuizType) {
                subjectClass = quizData.QuizType.toLowerCase().replace(/\s/g, '-');
            }

            const pausedClass = quizData.status === 'paused' ? 'quiz-card-paused' : '';
            const buttonText = quizData.status === 'paused' ? 'Doorgaan' : 'Start Quiz';

            cards += `
                <div class="quiz-card ${pausedClass}" data-quiz-id="${quizData.id}" data-subject="${quizData.QuizType}">
                    <div class="quiz-image-container">
                        <div class="quiz-image-placeholder" 
                             style="background-image: url('${quizData.Banner || '../public/assets/images/MDB-Background.png'}');
                                    background-size: cover;
                                    background-position: center;">
                        </div>
                    </div>
                    <div class="quiz-content">
                        <h3 class="quiz-title">${quizData.Title}</h3>
                        <p class="quiz-description">${quizData.Description || ''}</p>
                        <div class="quiz-footer">
                            <div class="quiz-meta">
                                <span class="quiz-type">${quizData.QuizType}</span>
                            </div>
                            <button class="start-quiz-btn" data-quiz-id="${quizData.id}">
                                ${buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = cards;
        container.style.opacity = '1';
        setupQuizButtons();
    }, 300);
}

function displayUncompletedQuizzes(quizzes) {
    const pausedQuizzes = quizzes.filter(quiz => quiz.status === 'paused');
    const otherQuizzes = quizzes.filter(quiz => quiz.status !== 'paused');
    const sortedQuizzes = [...pausedQuizzes, ...otherQuizzes];

    const container = document.getElementById('uncompleted-quizzes');
    container.innerHTML = sortedQuizzes.length ? sortedQuizzes.map(quiz => {
        // Get progress data if it exists
        const progressData = quiz.progress || {
            completedQuestions: 0,
            totalQuestions: 0,
            progressPercentage: 0
        };

        return `
        <div class="quiz-card ${quiz.status === 'paused' ? 'quiz-card-paused' : ''}" data-quiz-id="${quiz.id}">
            ${quiz.status === 'paused' ? `
                <div class="paused-banner">
                     <svg class="pause-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="6" y="4" width="4" height="16" fill="white"/>
                        <rect x="14" y="4" width="4" height="16" fill="white"/>
                    </svg>
                    <span class="paused-text">Gepauzeerd</span>
                    <span class="progress-text">${progressData.completedQuestions}/${progressData.totalQuestions}</span>
                </div>
            ` : ''}
            <div class="quiz-image-container">
                <img class="quiz-image" src="${quiz.Banner}" alt="Quiz banner">
                ${quiz.status === 'paused' ? `
                    <div class="progress-overlay">
                        <div class="progress-bar" style="width: ${progressData.progressPercentage}%"></div>
                    </div>
                ` : ''}
            </div>
            <div class="quiz-content">
                <h3 class="quiz-title">${quiz.Title}</h3>
                <p class="quiz-description">${quiz.Description}</p>
                <div class="quiz-footer ${quiz.status === 'paused' ? 'paused-footer' : ''}">
                    ${quiz.status === 'paused' ? `
                        <div class="progress-info">
                            <span class="progress-percentage">${progressData.progressPercentage}% Complete</span>
                        </div>
                    ` : ''}
                    <button class="start-quiz-btn ${quiz.status === 'paused' ? 'continue-btn' : ''}" data-quiz-id="${quiz.id}">
                        ${quiz.status === 'paused' ? 'Doorgaan met' : 'Start Quiz'}
                    </button>
                </div>
            </div>
        </div>
    `}).join('') : '<div class="no-quizzes-message">No available quizzes</div>';

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

function formatCompletionDate(dateString) {
    if (!dateString) return 'Onbekend';

    try {
        const now = new Date();
        const completedDate = new Date(dateString); // Will properly parse ISO 8601 strings like "2024-12-24T10:48:57.331Z"

        // Check if the date is valid
        if (isNaN(completedDate.getTime())) {
            console.warn('Invalid date provided:', dateString);
            return 'Ongeldige datum';
        }

        const timeDiff = now - completedDate;
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (daysDiff >= 1) {
            if (daysDiff === 1) {
                return 'Gisteren';
            } else {
                // Format date in Dutch style (e.g., "24 december 2024")
                const formatter = new Intl.DateTimeFormat('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return formatter.format(completedDate);
            }
        } else if (hoursDiff >= 1) {
            return hoursDiff === 1 ? '1 uur geleden' : `${hoursDiff} uren geleden`;
        } else if (minutesDiff >= 1) {
            return minutesDiff === 1 ? '1 minuut geleden' : `${minutesDiff} minuten geleden`;
        } else {
            return 'Zojuist';
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Onbekend';
    }
}

function displayCompletedQuizzes(quizzes) {
    const container = document.getElementById('completed-quizzes');
    // Update the default banner path to match your project structure
    const DEFAULT_BANNER = '../public/assets/images/MDB-Background.png';

    container.innerHTML = quizzes.length ? quizzes.map(quiz => {
        // Get colors for scores
        const hintsScoreColor = getScoreColor(quiz.scoreWithHints);
        const withoutHintsScoreColor = getScoreColor(quiz.scoreWithoutHints);

        // Determine banner image - ensure we always have a value
        let bannerImage = DEFAULT_BANNER; // Default first
        if (quiz.Banner && quiz.Banner.trim() !== '') {
            bannerImage = quiz.Banner; // Only override if Banner exists and isn't empty
        }

        return `
        <div class="quiz-card quiz-card-completed" data-quiz-id="${quiz.id || quiz.quizId}">
            <div class="score-badge-stacked">
                <div class="score-card-mini with-hints" 
                     style="background-color: ${hintsScoreColor.background}">
                    <span class="score-value">${quiz.scoreWithHints}</span>
                    <span class="score-label">MET HINTS</span>
                </div>
                <div class="score-card-mini without-hints"
                     style="background-color: ${withoutHintsScoreColor.background}">
                    <span class="score-value">${quiz.scoreWithoutHints}</span>
                    <span class="score-label">ZONDER HINTS</span>
                </div>
            </div>
            <div class="quiz-image-container">
                <div class="quiz-image-placeholder" 
                     style="background-image: url('${bannerImage}');
                            background-size: cover;
                            background-position: center;
                            height: 200px;
                            width: 100%;
                            background-color: #f5f5f5;"></div>
            </div>
            <div class="quiz-content">
                <h3 class="quiz-title">${quiz.Title || quiz.title}</h3>
                <p class="quiz-description">${quiz.Description || ''}</p>
                <div class="quiz-footer">
                    <div class="quiz-meta">
                        <span class="completion-date">Voltooid: ${formatCompletionDate(quiz.completedAt || quiz.dateTime || quiz.lastUpdated)}</span>
                        <span class="quiz-type">${quiz.QuizType || quiz.type}</span>
                    </div>
                    <button class="start-quiz-btn" data-quiz-id="${quiz.id || quiz.quizId}">
                        Opnieuw proberen
                    </button>
                </div>
            </div>
        </div>
    `}).join('') : '<div class="no-quizzes-message">Nog geen voltooide quizzes</div>';

    setupQuizButtons();
}

function setupQuizButtons() {
    document.querySelectorAll(".start-quiz-btn").forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();
            e.stopPropagation();

            const quizId = this.dataset.quizId;
            if (!quizId) {
                console.log('No quiz ID found');
                return;
            }

            try {
                // Handle retry case
                if (this.textContent.trim() === "Opnieuw proberen") {
                    console.log('Resetting quiz:', quizId);
                    const stateManager = await createQuizStateManager(quizId, auth.currentUser.uid);
                    await stateManager.clearAndResetQuiz();
                }

                // Handle continue case
                if (this.textContent.trim() === "Doorgaan") {
                    console.log('Continuing quiz:', quizId);
                    // No need to reset state for continue
                }

                // Navigate to quiz page using proper state management
                const quizUrl = `quiz.html?id=${quizId}`;
                window.history.pushState({}, '', quizUrl);
                window.location = quizUrl;

            } catch (error) {
                console.error('Error handling quiz button click:', error);
                alert('Er is een fout opgetreden. Probeer het opnieuw.');
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
    const filters = {
        type: document.getElementById("quizTypeFilter").value,
        sort: document.getElementById("sortOrderFilter").value,
        group: document.getElementById("quizGroupFilter").value,
        questionType: document.getElementById("questionTypeFilter").value,
        search: (document.getElementById("quizSearchBar")?.value || '').toLowerCase().trim()
    };

    // First separate by status - maintaining paused quiz priority
    let pausedQuizzes = quizzes.filter(quiz => quiz.status === 'paused');
    let otherQuizzes = quizzes.filter(quiz => quiz.status !== 'paused');

    // Apply filters to both sets
    function applyFilterSet(quizSet) {
        return quizSet.filter(quiz => {
            const typeMatch = !filters.type || quiz.QuizType === filters.type;
            const groupMatch = !filters.group || quiz.QuizGroupId === filters.group;
            const questionTypeMatch = !filters.questionType ||
                quiz.Questions?.some(q => q.QuestionType === filters.questionType);
            const searchMatch = !filters.search ||
                quiz.Title?.toLowerCase().includes(filters.search) ||
                quiz.QuizType?.toLowerCase().includes(filters.search);

            return typeMatch && groupMatch && questionTypeMatch && searchMatch;
        });
    }

    pausedQuizzes = applyFilterSet(pausedQuizzes);
    otherQuizzes = applyFilterSet(otherQuizzes);

    // Apply sorting only to non-paused quizzes
    switch (filters.sort) {
        case "newFirst":
            otherQuizzes.sort((a, b) => b.Created_at - a.Created_at);
            break;
        case "oldFirst":
            otherQuizzes.sort((a, b) => a.Created_at - b.Created_at);
            break;
        case "random":
            // Use the existing randomization logic if it exists
            if (this.randomizedQuizzes) {
                otherQuizzes = this.randomizedQuizzes.filter(quiz =>
                    otherQuizzes.some(q => q.id === quiz.id)
                );
            } else {
                // Fall back to hash-based sorting if no existing randomization
                const seed = Object.values(filters).join('');
                otherQuizzes.sort((a, b) => {
                    const hashA = hashCode(a.id + seed);
                    const hashB = hashCode(b.id + seed);
                    return hashA - hashB;
                });
            }
            break;
    }

    // Always return with paused quizzes first
    return [...pausedQuizzes, ...otherQuizzes];
}

// parallax.js
window.addEventListener('scroll', function () {
    const parallaxHero = document.querySelector('.parallax-background');
    const parallaxQuiz = document.querySelector('.parallax-quiz-background');
    let scrollPosition = window.pageYOffset;

    parallaxHero.style.transform = 'translateY(' + scrollPosition * 0.5 + 'px)';
    parallaxQuiz.style.transform = 'translateY(' + scrollPosition * 0.3 + 'px)';
});

// carousel logic
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

function filterQuizzes(searchTerm) {
    const uncompletedQuizzes = document.querySelectorAll('#uncompleted-quizzes .quiz-card');
    const completedQuizzes = document.querySelectorAll('#completed-quizzes .quiz-card');
    let hasVisibleQuizzes = false;

    [...uncompletedQuizzes, ...completedQuizzes].forEach(card => {
        // Search in both title and subject/type
        const title = card.querySelector('.quiz-title').textContent.toLowerCase();
        const type = card.querySelector('.quiz-type')?.textContent.toLowerCase() || '';
        const matches = title.includes(searchTerm) || type.includes(searchTerm);

        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        if (matches) {
            hasVisibleQuizzes = true;
            card.style.display = '';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 10);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });

    // Handle no results message
    const noResultsMessage = getNoResultsMessage();
    if (!hasVisibleQuizzes && searchTerm) {
        showNoResults(noResultsMessage);
    } else {
        hideNoResults(noResultsMessage);
    }
}

function getNoResultsMessage() {
    let message = document.querySelector('.no-results-message');
    if (!message) {
        message = document.createElement('div');
        message.className = 'no-results-message';
        message.style.cssText = `
            text-align: center;
            padding: 2rem;
            color: #666;
            font-size: 1.1rem;
            transition: opacity 0.3s ease;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 1rem 0;
            opacity: 0;
        `;
        const quizGrid = document.querySelector('#uncompleted-quizzes');
        quizGrid.parentNode.insertBefore(message, quizGrid.nextSibling);
    }
    return message;
}

function showNoResults(message) {
    message.textContent = 'Geen quizzes gevonden voor deze zoekopdracht';
    message.style.display = 'block';
    setTimeout(() => {
        message.style.opacity = '1';
    }, 10);
}

function hideNoResults(message) {
    message.style.opacity = '0';
    setTimeout(() => {
        message.style.display = 'none';
    }, 300);
}

function setupSearch() {
    const searchBar = document.getElementById('quizSearchBar');
    if (!searchBar) return;

    const searchContainer = searchBar.parentElement;
    let searchTimeout;

    // Show search with animation
    setTimeout(() => {
        searchContainer.classList.add('show');
    }, 100);

    // Handle input with debouncing
    searchBar.addEventListener('input', (e) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            filterQuizzes(searchTerm);
        }, 200); // 200ms debounce delay
    });

    // Fix backspace behavior
    searchBar.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && searchBar.value.length <= 1) {
            // Clear search and show all quizzes
            setTimeout(() => {
                filterQuizzes('');
            }, 0);
        }
    });
}

// Call setupSearch after DOM is loaded
document.addEventListener('DOMContentLoaded', setupSearch);

