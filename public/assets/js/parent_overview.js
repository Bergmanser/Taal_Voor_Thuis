import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { where, getDocs, query, doc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";
import { studentManager } from "./add_student.js";

let currentUser;
let studentList = [];
let quizzesList = [];
const colorMap = {}; // Store colors for each username
let isDetailedViewOpen = false; // Tracks if the detailed view is open
const subjectColors = {
    woordenschat: '#1A3A5F',  // Blue
    samenvatten: '#5C7E9C',   // Muted Blue
    'verwijswoorden&signaalwoorden': '#D6A664', // Gold
    grammatica: '#b75ad6',    // Purple
    anders: '#C23A2b'         // Red
};

// Main initialization
document.addEventListener('DOMContentLoaded', function () {
    initializeTabSystem();
    initializeSearchBars();
    initializePopups();
    initializeAuthStateHandler();
    initializeBackButton();
});

// Tab System Initialization
function initializeTabSystem() {
    const $tabIndicator = $('.tab-indicator');

    function updateTabIndicator() {
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab) {
            $tabIndicator.css({
                width: activeTab.offsetWidth + 'px',
                left: activeTab.offsetLeft + 'px',
                opacity: 1
            });
        } else {
            $tabIndicator.css({ width: '0', left: '0', opacity: 0 });
        }
    }

    // Initialize indicator after fonts load
    window.addEventListener('load', updateTabIndicator);

    // Toggle Design Button
    $('#toggleDesignButton').on('click', function () {
        $('#tableDesign').toggle();
        $('#cardDesign').toggle();
    });

    // Student Info Section Tab
    $('#showStudentInfoSection').on('click', function () {
        $('#navigateQuizOptions').hide();
        $('.tab-button').removeClass('active');
        $(this).addClass('active');
        updateTabIndicator();

        if (isDetailedViewOpen) {
            $('#studentDetailedView').show();
            $('#studentCollectionInfo').hide();
        } else {
            $('#studentCollectionInfo').show();
            $('#studentDetailedView').hide();
        }
    });

    // Quiz Options Section Tab
    $('#showQuizOptionsSection').on('click', function () {
        $('#navigateQuizOptions').show();
        $('#studentCollectionInfo').hide();
        $('#studentDetailedView').hide(); // Don't reset isDetailedViewOpen
        $('.tab-button').removeClass('active');
        $(this).addClass('active');
        updateTabIndicator();
    });

    // Set initial view
    $('#showStudentInfoSection').trigger('click');
}

// Search Systems Initialization
function initializeSearchBars() {
    // Main search bar with error handling
    const searchBar = document.getElementById('searchBar');
    searchBar?.addEventListener('input', function () {
        try {
            if (auth.currentUser) {
                retrieveStudentsWithSameParentEmail(
                    auth.currentUser.email,
                    this.value.trim().toLowerCase()
                );
            }
        } catch (error) {
            console.error('Search error:', error);
            showMessage('Search failed. Please try again.', 'error');
        }
    });

    // Detailed view search with error handling
    const detailedViewSearchBar = document.getElementById('detailedViewSearchBar');
    detailedViewSearchBar?.addEventListener('input', function () {
        try {
            if (auth.currentUser) {
                filterDetailedView(this.value.trim().toLowerCase());
            }
        } catch (error) {
            console.error('Detailed view search error:', error);
            showMessage('Search failed. Please try again.', 'error');
        }
    });

    // Answer sheet search with error handling
    const answerSheetSearchBar = document.getElementById('answerSheetSearchBar');
    answerSheetSearchBar?.addEventListener('input', function () {
        try {
            if (auth.currentUser) {
                searchAnswerSheets(this.value.trim().toLowerCase());
            }
        } catch (error) {
            console.error('Answer sheet search error:', error);
            showMessage('Search failed. Please try again.', 'error');
        }
    });
}

// Popup System Initialization
function initializePopups() {
    const addStudentPopup = document.getElementById('addStudentPopup');
    const deleteConfirmationPopup = document.getElementById('deleteConfirmationPopup');
    const openAddStudentPopupBtn = document.getElementById('openAddStudentPopup');
    const closePopupBtns = document.querySelectorAll('.close-popup');

    // Open popup handler
    openAddStudentPopupBtn?.addEventListener('click', () => {
        addStudentPopup.style.display = 'block';
    });

    // Close button handlers
    closePopupBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            addStudentPopup.style.display = 'none';
            deleteConfirmationPopup.style.display = 'none';
        });
    });

    // Outside click handler
    window.addEventListener('click', (event) => {
        if (event.target === addStudentPopup ||
            event.target === deleteConfirmationPopup) {
            addStudentPopup.style.display = 'none';
            deleteConfirmationPopup.style.display = 'none';
        }
    });
}

// Auth State Handler
function initializeAuthStateHandler() {
    onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                console.log("Currently logged in user:", user.email);
                currentUser = user;
                await retrieveStudentsWithSameParentEmail(user.email);
                await fetchQuizzes();
                redirectUserBasedOnRole([1, 2]);
            } else {
                console.log("No user logged in");
                window.location.href = "login_parent_tvt.html";
            }
        } catch (error) {
            console.error('Auth state handler error:', error);
            showMessage('Failed to initialize user data', 'error');
        }
    });
}

// Back Button Handler
function initializeBackButton() {
    $('#backButton').on('click', function () {
        $('#studentDetailedView').hide();
        $('#studentCollectionInfo').show();
        isDetailedViewOpen = false;
    });
}

// Function to show the detailed view when a student is selected
function showDetailedView(student) {
    $('#studentCollectionInfo').hide(); // Hide the original section
    $('#studentDetailedView').show();   // Show the detailed view
    isDetailedViewOpen = true; // Set the state to true as the detailed view is now open

    // Populate student list view with existing students (detailed cards)
    $('#studentListView').empty(); // Clear any existing entries

    studentList.forEach(s => {
        const detailedCard = document.createElement('div');
        detailedCard.className = 'card detailed-card'; // Use a separate class for detailed view
        detailedCard.style.backgroundColor = getColorForUsername(s.username);
        detailedCard.textContent = s.username;
        detailedCard.onclick = () => showStudentDetails(s);
        $('#studentListView').append(detailedCard);
    });

    // Clear the search bar when opening the detailed view
    $('#detailedViewSearchBar').val('');

    populateDetailedView(studentList);
    showStudentDetails(student);
}

// Function to populate the detailed view with student cards
function populateDetailedView(students) {
    const studentListView = $('#studentListView');
    studentListView.empty();

    students.forEach(s => {
        const detailedCard = document.createElement('div');
        detailedCard.className = 'card detailed-card';
        detailedCard.style.backgroundColor = getColorForUsername(s.username);
        detailedCard.textContent = s.username;
        detailedCard.onclick = () => showStudentDetails(s);
        studentListView.append(detailedCard);
    });
}

// Function to filter students in the detailed view
function filterDetailedView(searchText) {
    const filteredStudents = studentList.filter(student =>
        student.username.toLowerCase().includes(searchText)
    );
    populateDetailedView(filteredStudents);
}

// Back button functionality for closing the more detailed info format
$('#backButton').on('click', function () {
    $('#studentDetailedView').hide();
    $('#studentCollectionInfo').show();
    isDetailedViewOpen = false; // Reset the state variable when the back button is clicked
});

// Function to display the student details in the right panel
function showStudentDetails(student) {
    $('#studentDetailContent').html(`
        <h3>${student.username}</h3>
        <p>Last login: ${student.last_login ? new Date(student.last_login.seconds * 1000).toLocaleString() : "No login data available"}</p>
        
        <!-- Stat Tracker Section -->
        <section id="stat-tracker" class="stat-tracker-container mb-4">
            <div class="stat-tracker-box">
                <div class="row">
                    <div class="col-md-4">
                        <div id="donut-chart" class="chart-container">
                            <canvas id="averageScoreChart"></canvas>
                            <div id="average-score-title"></div>
                            <div id="average-score-text"></div>
                            <div id="no-data-message" class="no-data-message d-none">No data available yet. Please complete some quizzes.</div>
                        </div>
                    </div>
                    <div class="col-md-4" id="dynamic-best-worst-scores">
                        <!-- Best and Worst Scores will be dynamically inserted here -->
                    </div>
                    <div class="col-md-4" id="dynamic-recent-exercises">
                        <!-- Recent exercises will be dynamically inserted here -->
                    </div>
                </div>
            </div>
        </section>

        <!-- Quiz List Section -->
        <section id="quiz-list" class="quiz-list-container">
            <h2>Quizzes</h2>
            <input type="text" id="quizSearchBar" class="form-control mb-3" placeholder="Search by title">
            <div id="quizCards" class="quiz-cards-container">
                <!-- Quiz cards will be dynamically inserted here -->
            </div>
        </section>
    `);

    // Update the stat tracker and quiz list
    updateDashboard(student.quizzes);
    displayQuizzes(student.quizzes);

    // Add event listener for quiz search
    document.getElementById('quizSearchBar').addEventListener('input', function () {
        const searchText = this.value.trim().toLowerCase();
        displayQuizzes(student.quizzes, searchText);
    });
}

// Update these functions to work with the new structure
class ScoreCalculator {
    constructor(quizzes = {}) {
        this.quizzes = quizzes;
        this.scores = this.processQuizzes();
    }

    processQuizzes() {
        if (!this.quizzes || Object.keys(this.quizzes).length === 0) {
            return [];
        }

        return Object.values(this.quizzes).map(quiz => ({
            title: quiz.title,
            subject: quiz.type.toLowerCase(),
            scoreWithHints: parseFloat(quiz.scoreWithHints) || 0,
            scoreWithoutHints: parseFloat(quiz.scoreWithoutHints) || 0,
            date: new Date(quiz.dateTime)
        }));
    }

    getAveragesBySubject() {
        const subjects = {};

        this.scores.forEach(score => {
            if (!subjects[score.subject]) {
                subjects[score.subject] = {
                    withHints: [],
                    withoutHints: []
                };
            }
            subjects[score.subject].withHints.push(score.scoreWithHints);
            subjects[score.subject].withoutHints.push(score.scoreWithoutHints);
        });

        const averages = {};
        for (const [subject, scores] of Object.entries(subjects)) {
            averages[subject] = {
                withHints: this.calculateAverage(scores.withHints),
                withoutHints: this.calculateAverage(scores.withoutHints)
            };
        }

        return averages;
    }

    getOverallAverages() {
        const withHints = this.scores.map(s => s.scoreWithHints);
        const withoutHints = this.scores.map(s => s.scoreWithoutHints);

        return {
            withHints: this.calculateAverage(withHints),
            withoutHints: this.calculateAverage(withoutHints),
            attempted: this.scores.length
        };
    }

    getBestWorstSubjects() {
        const averages = this.getAveragesBySubject();
        let bestSubject = null;
        let worstSubject = null;
        let highestAvg = -Infinity;
        let lowestAvg = Infinity;

        for (const [subject, scores] of Object.entries(averages)) {
            if (scores.withoutHints > highestAvg) {
                highestAvg = scores.withoutHints;
                bestSubject = { subject, scores };
            }
            if (scores.withoutHints < lowestAvg) {
                lowestAvg = scores.withoutHints;
                worstSubject = { subject, scores };
            }
        }

        return { bestSubject, worstSubject };
    }

    getRecentScores(limit = 3) {
        return [...this.scores]
            .sort((a, b) => b.date - a.date)
            .slice(0, limit);
    }

    calculateAverage(numbers) {
        if (!numbers.length) return 0;
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        return parseFloat((sum / numbers.length).toFixed(2));
    }
}

// Usage in dashboard update functions
function updateDashboard(quizzes) {
    const calculator = new ScoreCalculator(quizzes);

    if (calculator.scores.length === 0) {
        handleEmptyDashboard();
        return;
    }

    updateChartDisplay(calculator);
    updateRecentScoresDisplay(calculator);
    updateBestWorstDisplay(calculator);
}

function handleEmptyDashboard() {
    document.getElementById('averageScoreChart').classList.add('d-none');
    document.getElementById('no-data-message').classList.remove('d-none');
}

function displayQuizzes(quizzes, searchText = '') {
    const quizContainer = document.getElementById('quizCards');
    quizContainer.innerHTML = '';

    if (!quizzes || Object.keys(quizzes).length === 0) {
        quizContainer.innerHTML = '<p>No quizzes available.</p>';
        return;
    }

    const filteredQuizzes = Object.entries(quizzes).filter(([quizId, details]) =>
        !searchText || details.title.toLowerCase().includes(searchText)
    );

    if (filteredQuizzes.length === 0) {
        quizContainer.innerHTML = '<p>No quizzes found.</p>';
        return;
    }

    filteredQuizzes.forEach(([quizId, details]) => {
        const quizCard = document.createElement('div');
        quizCard.className = 'quiz-card';
        quizCard.innerHTML = `
            <h5>${details.title}</h5>
            <p>${details.description}</p>
            <button onclick="startQuiz('${quizId}')">Check Answers</button>
        `;
        quizContainer.appendChild(quizCard);
    });
}

function updateChartDisplay(calculator) {
    const ctx = document.getElementById('averageScoreChart').getContext('2d');
    const averages = calculator.getAveragesBySubject();

    document.getElementById('averageScoreChart').classList.remove('d-none');
    document.getElementById('no-data-message').classList.add('d-none');

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(averages),
            datasets: [{
                data: Object.values(averages).map(score => score.withoutHints),
                backgroundColor: Object.keys(averages).map(subject => subjectColors[subject])
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw.toFixed(1)}`
                    }
                }
            }
        }
    });

    const overallAverages = calculator.getOverallAverages();
    updateAverageScoreText(overallAverages);
}

function updateAverageScoreText(averages) {
    document.getElementById('average-score-title').innerText = 'Total account average';
    document.getElementById('average-score-text').innerHTML = `
        <span data-tooltip="With hints">${averages.withHints.toFixed(1)}</span>
        <div class="divider"></div>
        <span data-tooltip="Without hints">${averages.withoutHints.toFixed(1)}</span>
    `;
}

function updateRecentScoresDisplay(calculator) {
    const container = document.getElementById('dynamic-recent-exercises');
    const recentScores = calculator.getRecentScores();

    if (recentScores.length === 0) {
        container.innerHTML = '';
        return;
    }

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

function updateBestWorstDisplay(calculator) {
    const container = document.getElementById('dynamic-best-worst-scores');
    const { bestSubject, worstSubject } = calculator.getBestWorstSubjects();

    if (!bestSubject || !worstSubject) return;

    container.innerHTML = `
        <div class="score-card" id="best-subject">
            <div class="score-title" style="background-color: ${subjectColors[bestSubject.subject]}">
                Best Subject: ${bestSubject.subject}
            </div>
            <div class="score-values">
                <span class="score with-hints" data-tooltip="Average score with hints">
                    ${bestSubject.scores.withHints.toFixed(1)}
                </span>
                <span class="score without-hints" data-tooltip="Average score without hints">
                    ${bestSubject.scores.withoutHints.toFixed(1)}
                </span>
            </div>
        </div>
        <div class="score-card" id="worst-subject">
            <div class="score-title" style="background-color: ${subjectColors[worstSubject.subject]}">
                Subject with Room for Improvement: ${worstSubject.subject}
            </div>
            <div class="score-values">
                <span class="score with-hints" data-tooltip="Average score with hints">
                    ${worstSubject.scores.withHints.toFixed(1)}
                </span>
                <span class="score without-hints" data-tooltip="Average score without hints">
                    ${worstSubject.scores.withoutHints.toFixed(1)}
                </span>
            </div>
        </div>
    `;
}

export async function retrieveStudentsWithSameParentEmail(parentEmail, searchText = '') {
    try {
        const studentsRef = collection(db, "studentdb");
        const q = query(studentsRef, where("parentEmail", "==", parentEmail));
        const querySnapshot = await getDocs(q);

        // Clear existing lists and UI
        studentList = [];
        const studentListTable = $('#childUserList');
        const cardListContainer = $('#cardUserList');
        studentListTable.empty();
        cardListContainer.empty();

        if (querySnapshot.empty) {
            handleEmptyStudentList(studentListTable, cardListContainer);
            return;
        }

        // Process each student document
        querySnapshot.forEach((doc) => {
            const student = { ...doc.data(), id: doc.id };
            if (!searchText || student.username.toLowerCase().includes(searchText)) {
                studentList.push(student);

                // Create and append table row
                const tableRow = createTableRow(student);
                studentListTable.append(tableRow);

                // Create and append card
                const card = createStudentCard(student);
                cardListContainer.append(card);
            }
        });

        // Update UI based on current view state
        updateViewState();

    } catch (error) {
        console.error("Error retrieving students:", error);
        showMessage("Failed to load students. Please try again.", "error");
    }
}

// Helper function for empty student list
function handleEmptyStudentList(tableContainer, cardContainer) {
    const emptyMessage = '<tr><td colspan="3" class="text-center">No students found</td></tr>';
    tableContainer.html(emptyMessage);
    cardContainer.html('<div class="text-center p-4">No students found</div>');
}

// Helper function to create table row
function createTableRow(student) {
    const row = $('<tr>');
    row.on('click', () => showDetailedView(student));

    // Username cell
    const usernameCell = $('<td>').text(student.username);

    // Last login cell
    const lastLogin = formatLastLogin(student.last_login);
    const lastLoginCell = $('<td>').text(lastLogin);

    // Actions cell
    const actionsCell = $('<td>');
    const deleteButton = createActionButton('Delete', 'delete-btn btn btn-danger', (event) => {
        event.stopPropagation();
        handleDeleteButton(student.id, student.username);
    });
    actionsCell.append(deleteButton);

    return row.append(usernameCell, lastLoginCell, actionsCell);
}

// Helper function to create student card
function createStudentCard(student) {
    const basicCard = $('<div>', {
        class: 'card basic-card clickable-card',
        css: { backgroundColor: getColorForUsername(student.username) }
    }).on('click', () => showDetailedView(student));

    // Card Header
    const cardHeader = $('<div>', {
        class: 'card-header',
        text: student.username
    });

    // Card Body
    const cardBody = createCardBody(student);

    // Card Footer
    const cardFooter = createCardFooter(student);

    return basicCard.append(cardHeader, cardBody, cardFooter);
}

// Helper function to create card body
function createCardBody(student) {
    const cardBody = $('<div>', { class: 'card-body' });
    const lastLogin = formatLastLogin(student.last_login);
    const scores = calculateStudentScores(student.quizzes);

    cardBody.append(`
        <p><strong>Last Login:</strong> ${lastLogin}</p>
        <p><strong>Avg. Score (With Hints):</strong> ${scores.withHints}</p>
        <p><strong>Avg. Score (Without Hints):</strong> ${scores.withoutHints}</p>
        <p><strong>Quizzes Attempted:</strong> ${scores.attempted}</p>
    `);

    return cardBody;
}

// Helper function to create card footer
function createCardFooter(student) {
    const cardFooter = $('<div>', { class: 'card-footer text-center' });
    const viewDetailsButton = $('<button>', {
        class: 'btn btn-info btn-sm',
        text: 'View Details',
        click: (e) => {
            e.stopPropagation();
            showDetailedView(student);
        }
    });

    return cardFooter.append(viewDetailsButton);
}

// Helper function to format last login date
function formatLastLogin(lastLogin) {
    return lastLogin ?
        new Date(lastLogin.seconds * 1000).toLocaleString() :
        "No login data available";
}

// Helper function to calculate student scores
function calculateStudentScores(quizzes) {
    if (!quizzes || Object.keys(quizzes).length === 0) {
        return {
            withHints: 'N/A',
            withoutHints: 'N/A',
            attempted: 0
        };
    }

    const quizArray = Object.values(quizzes);
    const withHints = quizArray.reduce((sum, quiz) =>
        sum + (parseFloat(quiz.scoreWithHints) || 0), 0) / quizArray.length;
    const withoutHints = quizArray.reduce((sum, quiz) =>
        sum + (parseFloat(quiz.scoreWithoutHints) || 0), 0) / quizArray.length;

    return {
        withHints: withHints.toFixed(2),
        withoutHints: withoutHints.toFixed(2),
        attempted: quizArray.length
    };
}

// Helper function to update view state
function updateViewState() {
    if (isDetailedViewOpen) {
        populateDetailedView(studentList);
    }
}

function getColorForUsername(username) {
    if (!colorMap[username]) {
        colorMap[username] = getRandomColor();
    }
    return colorMap[username];
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
function createActionButton(text, className, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.onclick = onClick;
    return button;
}

function handleDeleteButton(userId, username) {
    const deleteConfirmationPopup = document.getElementById('deleteConfirmationPopup');
    document.getElementById('deleteStudentName').textContent = `"${username}"`;

    deleteConfirmationPopup.style.display = 'block';

    const confirmButton = document.getElementById('confirmDeleteButton');
    confirmButton.onclick = async () => {
        const success = await studentManager.deleteStudent(userId, username);
        if (success) {
            deleteConfirmationPopup.style.display = 'none';
            // Refresh the student list
            await retrieveStudentsWithSameParentEmail(currentUser.email);
        }
    };
}

function deleteUser(userId, username) {
    // Reference to the documents in both collections
    const studentDocRef = doc(db, 'studentdb', userId);
    const userDocRef = doc(db, 'users', userId);

    // Delete both documents concurrently using Promise.all
    Promise.all([
        deleteDoc(studentDocRef),
        deleteDoc(userDocRef)
    ])
        .then(() => {
            console.log("User successfully deleted from both collections!");
            showMessage(`Student "${username}" has been deleted.`, 'success');

            // Refresh the student list
            retrieveStudentsWithSameParentEmail(currentUser.email);
        })
        .catch((error) => {
            console.error("Error removing user:", error);
            showMessage(`Failed to delete student: ${error.message}`, 'error');
        });
}

async function fetchQuizzes() {
    console.log("Fetching quizzes...");
    const quizzesRef = collection(db, "quizzes");
    const querySnapshot = await getDocs(quizzesRef);

    // Include the quiz 'id' along with the data
    quizzesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("Quizzes fetched: ", quizzesList);
    displayAnswerSheets(quizzesList);
}

function displayAnswerSheets(quizzes) {
    const answerSheetList = document.getElementById('answerSheetList');
    answerSheetList.innerHTML = '';

    if (quizzes.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.className = "no-children";
        cell.textContent = "No answer sheets available.";
        row.appendChild(cell);
        answerSheetList.appendChild(row);
        return;
    }

    quizzes.forEach(quiz => {
        console.log("Displaying quiz: ", quiz);
        const row = document.createElement('tr');
        row.className = 'answer-sheet-row';
        row.style.backgroundImage = `url(${quiz.Banner || 'default-image-url'})`;
        row.onclick = () => redirectToQuizDetails(quiz.id); // Make the entire row clickable

        const titleCell = document.createElement('td');
        titleCell.textContent = quiz.Title || 'Untitled';
        row.appendChild(titleCell);

        const buttonCell = document.createElement('td');
        const button = document.createElement('button');
        button.className = 'details-button';
        button.textContent = 'Details';
        button.onclick = (event) => {
            event.stopPropagation(); // Prevent row click
            redirectToQuizDetails(quiz.id);
        };
        buttonCell.appendChild(button);
        row.appendChild(buttonCell);

        answerSheetList.appendChild(row);
    });
}

function searchAnswerSheets(searchText) {
    const filteredQuizzes = quizzesList.filter(quiz =>
        quiz.Title.toLowerCase().includes(searchText) ||
        (quiz.Description && quiz.Description.toLowerCase().includes(searchText))
    );
    console.log("Filtered quizzes: ", filteredQuizzes);
    displayAnswerSheets(filteredQuizzes);
}

function redirectToQuizDetails(quizId) {
    console.log("Redirect to quiz details page with ID: ", quizId);
    window.location.href = `answersheet_v1.html?id=${quizId}`;
}

// Add keypress event listener to trigger sign-up on Enter key press
const SignUpFormInputs = document.querySelectorAll('#addStudentForm input');
SignUpFormInputs.forEach(input => {
    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.querySelector('.add-student-btn').click();
        }
    });
});

// Add submit event listener to the form
document.getElementById('addStudentForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // After successful submission, close the popup:
    document.getElementById('addStudentPopup').style.display = 'none';
});

// Custom confrimation messages
function showMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// Export the showMessage function so it can be used in add_student.js
export { showMessage };
