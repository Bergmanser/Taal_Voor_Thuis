import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { where, getDocs, query, doc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";

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

document.addEventListener('DOMContentLoaded', function () {

    // Initialize the tab indicator animation
    const $tabIndicator = $('.tab-indicator');

    // Function to update the tab indicator
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


    // Initialize the indicator position
    window.addEventListener('load', function () {
        updateTabIndicator(); // Recalculate after fonts and styles are loaded
    });


    // Toggle Design within Student Collection Info
    $('#toggleDesignButton').on('click', function () {
        $('#tableDesign').toggle();
        $('#cardDesign').toggle();
    });

    // Click events for the tab buttons
    $('#showStudentInfoSection').on('click', function () {
        $('#navigateQuizOptions').hide(); // Hide the quiz options section
        $('.tab-button').removeClass('active'); // Remove active class from all tabs
        $(this).addClass('active'); // Add active class to the clicked tab
        updateTabIndicator(); // Update the tab indicator

        // Show the last active view when navigating back to the "Student Collection Info" tab
        if (isDetailedViewOpen) {
            $('#studentDetailedView').show();
            $('#studentCollectionInfo').hide();
        } else {
            $('#studentCollectionInfo').show();
            $('#studentDetailedView').hide();
        }
    });

    $('#showQuizOptionsSection').on('click', function () {
        $('#navigateQuizOptions').show(); // Show the quiz options section
        $('#studentCollectionInfo').hide(); // Hide the student collection info
        $('#studentDetailedView').hide(); // Hide the detailed view, but do not reset isDetailedViewOpen
        $('.tab-button').removeClass('active'); // Remove active class from all tabs
        $(this).addClass('active'); // Add active class to the clicked tab
        updateTabIndicator(); // Update the tab indicator
    });

    // Initialize to show the student collection info section first
    $('#showStudentInfoSection').trigger('click');
    const searchBar = document.getElementById('searchBar');
    searchBar.addEventListener('input', function () {
        if (auth.currentUser) {
            retrieveStudentsWithSameParentEmail(auth.currentUser.email, this.value.trim().toLowerCase());
        }
    });

    // Add event listener for the new detailed view search bar
    const detailedViewSearchBar = document.getElementById('detailedViewSearchBar');
    detailedViewSearchBar.addEventListener('input', function () {
        if (auth.currentUser) {
            filterDetailedView(this.value.trim().toLowerCase());
        }
    });

    // Allows searching for a specifc answersheet
    const answerSheetSearchBar = document.getElementById('answerSheetSearchBar');
    answerSheetSearchBar.addEventListener('input', function () {
        if (auth.currentUser) {
            searchAnswerSheets(this.value.trim().toLowerCase());
        }
    });

    // Add Student Popup
    const addStudentPopup = document.getElementById('addStudentPopup');
    const openAddStudentPopupBtn = document.getElementById('openAddStudentPopup');
    const closePopupBtns = document.querySelectorAll('.close-popup');

    openAddStudentPopupBtn.addEventListener('click', () => {
        addStudentPopup.style.display = 'block';
    });

    closePopupBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            addStudentPopup.style.display = 'none';
            deleteConfirmationPopup.style.display = 'none';
        });
    });

    // Close popup when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === addStudentPopup || event.target === deleteConfirmationPopup) {
            addStudentPopup.style.display = 'none';
            deleteConfirmationPopup.style.display = 'none';
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Currently logged in user: " + user.email);
            currentUser = user;
            // document.getElementById('welcomeHeader').textContent = `Welcome ${user.email}`;
            retrieveStudentsWithSameParentEmail(user.email);
            fetchQuizzes();
            redirectUserBasedOnRole([1, 2]);
        } else {
            console.log("No user logged in");
            window.location.href = "login_parent_tvt.html";
        }
    });

});


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
function updateDashboard(quizzes) {
    const scores = Object.values(quizzes).map(quiz => ({
        title: quiz.title,
        subject: quiz.type.toLowerCase(),
        scoreWithHints: parseFloat(quiz.scoreWithHints),
        scoreWithoutHints: parseFloat(quiz.scoreWithoutHints),
        date: new Date(quiz.dateTime)
    }));

    if (scores.length === 0) {
        document.getElementById('averageScoreChart').classList.add('d-none');
        document.getElementById('no-data-message').classList.remove('d-none');
    } else {
        document.getElementById('averageScoreChart').classList.remove('d-none');
        document.getElementById('no-data-message').classList.add('d-none');
        updateChart(scores);
        updateRecentScores(scores);
        updateBestWorstScores(scores);
    }
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

export async function retrieveStudentsWithSameParentEmail(parentEmail, searchText = '') {
    const studentsRef = collection(db, "studentdb");
    const q = query(studentsRef, where("parentEmail", "==", parentEmail));
    const querySnapshot = await getDocs(q);

    studentList = []; // Clear the existing list
    const studentListTable = $('#childUserList');
    studentListTable.empty(); // Clear table rows

    const cardListContainer = $('#cardUserList');
    cardListContainer.empty(); // Clear existing cards

    querySnapshot.forEach((doc) => {
        const student = doc.data();
        if (!searchText || student.username.toLowerCase().includes(searchText)) {
            studentList.push(student);

            // Populate the table row
            const row = studentListTable[0].insertRow();
            row.onclick = () => showDetailedView(student);
            row.insertCell(0).textContent = student.username;
            row.insertCell(1).textContent = student.last_login ? new Date(student.last_login.seconds * 1000).toLocaleString() : "No login data available";

            // Create the delete button and append it to the third cell
            const deleteButton = createActionButton('Delete', 'delete-btn btn btn-danger', (event) => {
                event.stopPropagation(); // Prevents the row click event from being triggered
                handleDeleteButton(doc.id, student.username);
            });
            row.insertCell(2).appendChild(deleteButton);


            // Create the card for the basic layout with relevant information
            const basicCard = $('<div>', {
                class: 'card basic-card clickable-card',
                css: { backgroundColor: getColorForUsername(student.username) },
                click: () => showDetailedView(student),
            });

            // Card Header
            const cardHeader = $('<div>', { class: 'card-header', text: student.username });
            basicCard.append(cardHeader);

            // Card Body with available details
            const cardBody = $('<div>', { class: 'card-body' });

            // Last login
            const lastLogin = student.last_login ? new Date(student.last_login.seconds * 1000).toLocaleString() : "No login data available";
            cardBody.append(`<p><strong>Last Login:</strong> ${lastLogin}</p>`);

            // Average Scores
            const avgScoreWithHints = calculateAverageScore(student.quizzes, 'scoreWithHints');
            const avgScoreWithoutHints = calculateAverageScore(student.quizzes, 'scoreWithoutHints');

            cardBody.append(`<p><strong>Avg. Score (With Hints):</strong> ${avgScoreWithHints}</p>`);
            cardBody.append(`<p><strong>Avg. Score (Without Hints):</strong> ${avgScoreWithoutHints}</p>`);

            // Number of quizzes attempted
            const quizzesAttempted = student.quizzes ? Object.keys(student.quizzes).length : 0;
            cardBody.append(`<p><strong>Quizzes Attempted:</strong> ${quizzesAttempted}</p>`);

            basicCard.append(cardBody);

            // Card Footer with actions
            const cardFooter = $('<div>', { class: 'card-footer text-center' });
            const viewDetailsButton = $('<button>', {
                class: 'btn btn-info btn-sm',
                text: 'View Details',
                click: () => showDetailedView(student),
            });
            cardFooter.append(viewDetailsButton);
            basicCard.append(cardFooter);

            cardListContainer.append(basicCard);
        }
    });

    // If the detailed view is open, update it with the new student list
    if (isDetailedViewOpen) {
        populateDetailedView(studentList);
    }
}

function calculateAverageScore(quizzes, scoreType) {
    if (!quizzes || Object.keys(quizzes).length === 0) return 'N/A';
    const scores = Object.values(quizzes).map(quiz => parseFloat(quiz[scoreType]) || 0);
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return (sum / scores.length).toFixed(2);
}

function calculateOverallAverage(scores) {
    const totalScore = scores.reduce((sum, score) => sum + score.scoreWithoutHints, 0);
    return totalScore / scores.length;
}

function calculateOverallAverageWithHints(scores) {
    const totalScore = scores.reduce((sum, score) => sum + score.scoreWithHints, 0);
    return totalScore / scores.length;
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
    confirmButton.onclick = () => {
        deleteUser(userId, username);
        deleteConfirmationPopup.style.display = 'none';
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
