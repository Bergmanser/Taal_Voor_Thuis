import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { retrieveStudentsWithSameParentEmail } from "../js/parent_overview.js";
import { showMessage } from "../js/parent_overview.js";
// import { app, auth, db, secondaryApp, secondaryAuth } from "./firebase_config.js";

// Main Config for Project Plato
const firebaseConfig = {
    apiKey: "AIzaSyCHFj9oABXSxiWm7u1yPOvyhXQw_FRp5Lw",
    authDomain: "project-plato-eb365.firebaseapp.com",
    databaseURL: "https://project-plato-eb365-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-plato-eb365",
    storageBucket: "project-plato-eb365.appspot.com",
    messagingSenderId: "753582080609",
    appId: "1:753582080609:web:98b2db93e63a500a56e020",
    measurementId: "G-KHJXGLJM4Y"
};

// Secondary Config for Project Plato
const secondaryFirebaseConfig = {
    apiKey: "AIzaSyAb6cOf4ZXjI1t6s-Ks0DnKUA08FFu7Oow",
    authDomain: "project-plato-eb365.firebaseapp.com",
    databaseURL: "https://project-plato-eb365-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-plato-eb365",
    storageBucket: "project-plato-eb365.appspot.com",
    messagingSenderId: "753582080609",
    appId: "1:753582080609:web:72f850e85a54a0c156e020",
    measurementId: "G-8S3CL4DGY9"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);

// Secondary Firebase app initialization
const secondaryApp = initializeApp(secondaryFirebaseConfig, "secondary");
const secondaryAuth = getAuth(secondaryApp);

function getStudentCounter() {
    const parentUid = auth.currentUser.uid;

    // Initialize the counter to 0
    let counter = 0;

    // Check if there are any existing students under the parent role
    getStudentsAmount(parentUid).then((students) => {
        if (students.length > 0) {
            // If there are existing students, set the counter to the highest counter value
            const existingCounters = students.map((student) => parseInt(student.split("+")[0].split("@")[0]));
            counter = Math.max(...existingCounters) + 1;
        }
    });

    return counter;
}

async function getStudentsAmount(uid) {
    const studentsRef = doc(db, `users/${uid}`);
    const studentDoc = await getDoc(studentsRef);

    if (studentDoc.exists()) {
        const students = studentDoc.data().students || [];
        return students.length;
    } else {
        return 0;
    }
}

// Add the generateUniqueEmail function
async function generateUniqueEmail(parentEmail, counter) {
    if (!parentEmail) {
        throw new Error("parentEmail is undefined or null");
    }

    // Extract the local part of the email address
    const baseEmail = parentEmail.split("@")[0];

    let existingCounter = 0;

    // Check if there are any existing + symbols in baseEmail
    baseEmail.split("+").forEach((part) => {
        if (existingCounter < parseInt(part.split("@")[0])) {
            existingCounter = parseInt(part.split("@")[0]);
        }
    });

    let newCounter = counter;

    // If there are existing + symbols, use the highest existing counter
    if (existingCounter > 0) {
        newCounter += existingCounter;
    }

    let uniqueEmail = `${baseEmail}+${newCounter}@${parentEmail.split("@")[1]}`;

    // Check if the unique email already exists in the database
    const exists = await getStudent(uniqueEmail);

    if (exists) {
        newCounter++;
        uniqueEmail = `${baseEmail}+${newCounter}@${parentEmail.split("@")[1]}`;
        return generateUniqueEmail(parentEmail, newCounter);
    }

    // Make sure there is only one '+' sign
    if (uniqueEmail.includes('++')) {
        newCounter++;
        uniqueEmail = `${baseEmail}+${newCounter}@${parentEmail.split("@")[1]}`;
        return generateUniqueEmail(parentEmail, newCounter);
    }

    return uniqueEmail;
}

async function getStudent(email) {
    const studentsRef = collection(db, "users");
    const studentQuery = query(studentsRef, where("email", "==", email));
    const studentSnapshot = await getDocs(studentQuery);

    return studentSnapshot.size > 0;
}


// Ensure the DOM is fully loaded before executing
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const uid = user.uid;
            const parentEmail = user.email;

            const counter = getStudentCounter();

            // Ensure the form exists before accessing it
            const form = document.querySelector('#addStudentForm');

            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    var uniqueEmail = await generateUniqueEmail(parentEmail, counter);
                    var username = document.getElementById("username-student-signup").value;
                    var password = document.getElementById("password-student-signup").value;

                    console.log(uniqueEmail);

                    try {
                        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, uniqueEmail, password);
                        const user = userCredential.user;

                        // Send user info to Firestore
                        const userRef = doc(db, `users/${user.uid}`);
                        await setDoc(userRef, {
                            email: uniqueEmail,
                            username: username,
                            parentEmail: parentEmail,
                            userRoleId: 0 // Set userRoleId to 0 for students
                        }, { merge: true });

                        const studentRef = doc(db, `studentdb/${user.uid}`);
                        await setDoc(studentRef, {
                            email: uniqueEmail,
                            username: username,
                            parentEmail: parentEmail,
                            userRoleId: 0 // Set userRoleId to 0 for students
                        }, { merge: true });

                        // Show success message
                        showMessage(`Student "${username}" has been added.`, 'success');

                        // Close the popup
                        document.getElementById('addStudentPopup').style.display = 'none';

                        // Clear the form
                        form.reset();

                        // Refresh the student list
                        retrieveStudentsWithSameParentEmail(auth.currentUser.email);
                    } catch (error) {
                        const errorCode = error.code;
                        const errorMessage = error.message;
                        showMessage(`Failed to add student: ${errorMessage}`, 'error');
                    }
                });
            } else {
                console.error("Form element '.addStudentForm' not found in the DOM.");
            }
        } else {
            // User is signed out
            window.location.href = "login_parent_tvt.html";
        }
    });
});
