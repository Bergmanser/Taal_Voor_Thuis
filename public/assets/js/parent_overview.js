import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { where, getDocs, query, doc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";

let currentUser;
let studentList = [];
let quizzesList = [];

document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.getElementById('searchBar');
    searchBar.addEventListener('input', function () {
        if (auth.currentUser) {
            retrieveStudentsWithSameParentEmail(auth.currentUser.email, this.value.trim().toLowerCase());
        }
    });

    const answerSheetSearchBar = document.getElementById('answerSheetSearchBar');
    answerSheetSearchBar.addEventListener('input', function () {
        if (auth.currentUser) {
            searchAnswerSheets(this.value.trim().toLowerCase());
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Currently logged in user: " + user.email);
            currentUser = user;
            document.getElementById('welcomeHeader').textContent = `Welcome ${user.email}`;
            retrieveStudentsWithSameParentEmail(user.email);
            fetchQuizzes();
            redirectUserBasedOnRole([1, 2]);
        } else {
            console.log("No user logged in");
            window.location.href = "login_parent_tvt.html";
        }
    });
});

async function retrieveStudentsWithSameParentEmail(parentEmail, searchText = '') {
    const studentsRef = collection(db, "studentdb");
    const q = query(studentsRef, where("parentEmail", "==", parentEmail));
    const querySnapshot = await getDocs(q);

    const studentListTable = document.getElementById('childUserList');
    studentListTable.innerHTML = ''; // Clear existing rows

    if (querySnapshot.empty) {
        const row = studentListTable.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 3; // Adjust the colspan as per your table columns
        cell.className = "no-children";
        cell.textContent = "Er zijn op dit moment geen leerling accounts aangemaakt, voeg eerst nieuwe leerlingen toe";
        return;
    }

    querySnapshot.forEach((doc) => {
        const student = doc.data();
        if (!searchText || student.username.toLowerCase().includes(searchText)) {
            const row = studentListTable.insertRow();
            row.onclick = () => redirectToChild(doc.id); // Make the entire row clickable
            row.insertCell(0).textContent = student.username;

            const actionsCell = row.insertCell(1);
            actionsCell.appendChild(createActionButton('Delete', 'btn btn-danger', (event) => {
                event.stopPropagation(); // Prevent row click
                handleDeleteButton(doc.id, student.username);
            }));
            actionsCell.appendChild(createActionButton('View Details', 'btn btn-info', (event) => {
                event.stopPropagation(); // Prevent row click
                redirectToChild(doc.id);
            }));
        }
    });
}

function createActionButton(text, className, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.onclick = onClick;
    return button;
}

function handleDeleteButton(userId, username) {
    const deleteModal = $('#deleteConfirmationModal');
    document.getElementById('deleteStudentName').textContent = `"${username}"`;

    // Remove existing backdrop if any
    $('.modal-backdrop').remove();

    deleteModal.modal({
        backdrop: 'static',
        keyboard: false
    }).modal('show');

    const confirmButton = document.getElementById('confirmDeleteButton');
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    document.getElementById('confirmDeleteButton').addEventListener('click', () => {
        deleteUser(userId);
        deleteModal.modal('hide');
    });
}

function deleteUser(userId) {
    const docRef = doc(db, 'studentdb', userId);
    deleteDoc(docRef).then(() => {
        console.log("Document successfully deleted!");
        retrieveStudentsWithSameParentEmail(currentUser.email);
    }).catch((error) => {
        console.error("Error removing document: ", error);
        alert("Failed to delete user: " + error.message);
    });
}

function redirectToChild(userId) {
    console.log("Redirect to child's detail page with ID: ", userId);
    window.location.href = `overview_individual_student.html?id=${userId}`;
}

async function fetchQuizzes() {
    console.log("Fetching quizzes...");
    const quizzesRef = collection(db, "quizzes");
    const querySnapshot = await getDocs(quizzesRef);
    quizzesList = querySnapshot.docs.map(doc => doc.data());
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
    window.location.href = `quiz_details.html?id=${quizId}`;
}
