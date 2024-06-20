import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { where, getDocs, query, doc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";

let currentUser;
let studentList = [];

document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.getElementById('searchBar');
    searchBar.addEventListener('input', function () {
        if (auth.currentUser) {
            retrieveStudentsWithSameParentEmail(auth.currentUser.email, this.value.trim().toLowerCase());
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Currently logged in user: " + user.email);
            document.getElementById('welcomeHeader').textContent = `Welcome ${user.email}`;
            retrieveStudentsWithSameParentEmail(user.email);
            redirectUserBasedOnRole([1, 2]);
        } else {
            console.log("No user logged in");
            window.location.href = "login_parent_tvt.html";
        }
    });
});

export async function retrieveStudentsWithSameParentEmail(parentEmail, searchText = '') {
    const studentsRef = collection(db, "studentdb");
    const q = query(studentsRef, where("parentEmail", "==", parentEmail));
    const querySnapshot = await getDocs(q);

    const studentListTable = document.getElementById('childUserList');
    studentListTable.innerHTML = ''; // Clear existing rows

    if (querySnapshot.empty) {
        const row = studentListTable.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 4; // Adjust the colspan as per your table columns
        cell.className = "no-children";
        cell.textContent = "Er zijn op dit moment geen leerling accounts aangemaakt, voeg eerst nieuwe leerlingen toe";
        return;
    }

    querySnapshot.forEach((doc) => {
        const student = doc.data();
        if (!searchText || student.username.toLowerCase().includes(searchText)) {
            const row = studentListTable.insertRow();
            row.insertCell(0).textContent = student.username;
            row.insertCell(1).textContent = student.email;

            const deleteCell = row.insertCell(2);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'btn btn-danger';
            deleteButton.onclick = () => handleDeleteButton(doc.id, student.username);
            deleteCell.appendChild(deleteButton);

            const detailCell = row.insertCell(3);
            const detailButton = document.createElement('button');
            detailButton.textContent = 'View Details';
            detailButton.className = 'btn btn-info';
            detailButton.onclick = () => redirectToChild(doc.id);
            detailCell.appendChild(detailButton);
        }
    });
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
        retrieveStudentsWithSameParentEmail(auth.currentUser.email);
    }).catch((error) => {
        console.error("Error removing document: ", error);
        alert("Failed to delete user: " + error.message);
    });
}

function redirectToChild(userId) {
    console.log("Redirect to child's detail page with ID: ", userId);
    window.location.href = `overview_individual_student.html?id=${userId}`;
}
