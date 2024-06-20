import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { redirectUserBasedOnRole } from './path/to/roleRedirect.js';
import { auth, db } from '../js/firebase_config.js'

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
        const studentOverwiewBtn = document.getElementById("studentOverview-btn");
        const quizUpdateBtn = document.getElementById("quizUpdate-btn");
        const quizSearchOverviewBtn = document.getElementById("quizSearchOverview-btn");
        studentOverwiewBtn.addEventListener("click", () => {
            window.location.href = "parent_overview.html";
        });
        quizSearchOverviewBtn.addEventListener("click", () => {
            window.location.href = "quiz_search_interface.html";
        });
        quizUpdateBtn.addEventListener("click", () => {
            window.location.href = "quiz_creation_interface.html";
        });
        // Call the function with the expected role for the parent dashboard (e.g., 1 and 2 for parents and organization users)
        redirectUserBasedOnRole([3, 4]);
    } else {
        window.location.href = "login_employee.html";
    }
});