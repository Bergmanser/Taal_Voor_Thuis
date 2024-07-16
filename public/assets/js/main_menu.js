import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";
import { auth, db } from '../js/firebase_config.js';

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
        // Call the function with the expected role for the parent dashboard (e.g., 3 and 4 for parents and organization users)
        redirectUserBasedOnRole([3, 4]);
    } else {
        window.location.href = "login_employee.html";
    }
});

const studentOverviewBtn = document.getElementById("studentOverview-btn");
const quizUpdateBtn = document.getElementById("quizUpdate-btn");
const quizSearchOverviewBtn = document.getElementById("quizSearchOverview-btn");

studentOverviewBtn.addEventListener("click", () => {
    window.location.href = "parent_overview.html";
});
quizUpdateBtn.addEventListener("click", () => {
    window.location.href = "quiz_creation_interface.html";
});
quizSearchOverviewBtn.addEventListener("click", () => {
    window.location.href = "quiz_search_interface.html";
});
