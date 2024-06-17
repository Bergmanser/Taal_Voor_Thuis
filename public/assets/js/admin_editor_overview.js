import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { query, getDocs, collection, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { redirectUserBasedOnRole } from './roleRedirect';
import { app, auth, db } from "./firebase_config.js"

document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.getElementById('searchBar');
    searchBar.addEventListener('input', function () {
        if (auth.currentUser) {
            retrieveQuizzes(this.value.trim().toLowerCase());
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Currently logged in user: " + user.email);
            document.getElementById('welcomeHeader').textContent = `Welcome ${user.email}`;
            retrieveQuizzes();
            // Call the function with the expected role for the parent dashboard (e.g., 1 and 2 for parents and organization users)
            redirectUserBasedOnRole([3, 4]);
        } else {
            console.log("No user logged in");
            // Redirect to login page or show message
        }
    });
});

async function retrieveQuizzes(searchText = '') {
    const quizzesRef = collection(db, "quizzes");
    const q = query(quizzesRef, orderBy("title"));
    const querySnapshot = await getDocs(q);

    const quizListTable = document.getElementById('quizList');
    quizListTable.innerHTML = ''; // Clear existing rows

    if (querySnapshot.empty) {
        const row = quizListTable.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 3; // Adjust the colspan as per your table columns
        cell.className = "no-quizzes";
        cell.textContent = "No quizzes available at the moment. Please add new quizzes.";
        return;
    }

    querySnapshot.forEach((doc) => {
        const quiz = doc.data();
        if (!searchText || quiz.title.toLowerCase().includes(searchText)) {
            const row = quizListTable.insertRow();
            row.insertCell(0).textContent = quiz.title;

            const editCell = row.insertCell(1);
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'btn btn-info';
            editButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the row click event
                openEditModal(doc.id, quiz);
            });
            editCell.appendChild(editButton);

            const deleteCell = row.insertCell(2);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'btn btn-danger';
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the row click event
                openDeleteModal(doc.id);
            });
            deleteCell.appendChild(deleteButton);

            row.className = 'clickable-row';
            row.dataset.id = doc.id;
            row.addEventListener('click', () => {
                openEditModal(doc.id, quiz);
            });
        }
    });
}

function openEditModal(quizId, quizData) {
    const editQuizModal = $('#editQuizModal');
    $('#editQuizModalBody').load('quiz_editing_interface.html', function () {
        $.getScript('quiz_editor.js', function () {
            document.getElementById('edit-quiz-title').value = quizData.title;
            document.getElementById('edit-quiz-description').value = quizData.description;
        });
    });

    const editForm = document.getElementById('editQuizForm');
    editForm.onsubmit = (event) => {
        event.preventDefault();
        const updatedQuizData = {
            title: document.getElementById('edit-quiz-title').value,
            description: document.getElementById('edit-quiz-description').value
        };
        updateQuiz(quizId, updatedQuizData);
        editQuizModal.modal('hide');
    };
    editQuizModal.modal('show');
}

async function updateQuiz(quizId, updatedQuizData) {
    const quizRef = doc(db, 'quizzes', quizId);
    await setDoc(quizRef, updatedQuizData, { merge: true });
    retrieveQuizzes();
}

function openDeleteModal(quizId) {
    const deleteModal = $('#confirmDeleteModal');
    document.getElementById('confirmDeleteButton').onclick = () => {
        deleteQuiz(quizId);
        deleteModal.modal('hide');
    };
    deleteModal.modal('show');
}

async function deleteQuiz(quizId) {
    const quizRef = doc(db, 'quizzes', quizId);
    await deleteDoc(quizRef);
    retrieveQuizzes();
}