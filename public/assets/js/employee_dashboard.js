import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";
import { auth, db } from './firebase_config.js';

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
        // Call the function with the expected role for the parent dashboard (e.g., 3 and 4 for parents and organization users)
        redirectUserBasedOnRole([3, 4]);
    } else {
        window.location.href = "login_employee_tvt.html";
    }
});

const menuItems = [
    { id: 'studentOverview', icon: 'home', label: 'Student Overview', color: '#4CAF50', href: 'parent_overview.html' },
    { id: 'quizUpdate', icon: 'book', label: 'Add New Quiz', color: '#2196F3', href: 'quiz_creation_interface.html' },
    { id: 'quizSearchOverview', icon: 'search', label: 'Search Quizzes', color: '#FF9800', href: 'quiz_search_interface.html' },
    { id: 'parentSignUp', icon: 'add', label: 'Add Parent/Teacher', color: '#ae2852', href: 'sign-up_tvt.html' }
];

function createDashboardItem(item) {
    const div = document.createElement('div');
    div.className = 'dashboard-item';
    div.style.backgroundColor = item.color;
    div.style.boxShadow = `0 4px 6px ${item.color}40`;
    div.innerHTML = `
        <i class="material-icons">${item.icon}</i>
        <span>${item.label}</span>
    `;
    div.addEventListener('click', () => {
        window.location.href = item.href;
    });
    return div;
}

function initDashboard() {
    const grid = document.getElementById('dashboardGrid');
    menuItems.forEach(item => {
        grid.appendChild(createDashboardItem(item));
    });
}

document.addEventListener('DOMContentLoaded', initDashboard)