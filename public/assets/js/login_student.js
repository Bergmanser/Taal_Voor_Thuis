import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const database = getFirestore(app);

// Login logic
const loginForm = document.querySelector('.form-content');
loginForm.addEventListener('change', (e) => {
    const usernameInput = document.getElementById("email-user-login");
    const passwordInput = document.getElementById("password-user-login");

    if (usernameInput.value && passwordInput.value) {
        logInStudent();
    }
});

async function logInStudent() {
    console.log("Logging in student...");
    // Retrieve the entered username and password
    var usernameInput = document.getElementById("email-user-login").value;
    var passwordInput = document.getElementById("password-user-login").value;

    console.log(`Username: ${usernameInput}`);
    console.log(`Password: ${passwordInput}`);

    // Retrieve the user document from Firestore using the username
    const usersRef = collection(database, "users");
    const userQuery = query(usersRef, where("username", "==", usernameInput));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.size === 1) {
        const userDoc = userSnapshot.docs[0];
        const email = userDoc.data().email;
        const userRoleId = userDoc.data().userRoleId;

        console.log(`Found user with email ${email} and userRoleId ${userRoleId}`);

        // Check if the user has a valid user role (i.e. userRoleId === 0)
        if (userRoleId === 0) {
            // Authenticate the user using the retrieved email address and the entered password
            signInWithEmailAndPassword(auth, email, passwordInput)
                .then((userCredential) => {
                    const user = userCredential.user;
                    const date = new Date();

                    console.log(`Authenticated user ${user.uid} with email ${user.email}`);

                    // Update the last_login timestamp
                    updateDoc(doc(database, "users", user.uid), {
                        last_login: date,
                    })
                        .then(() => {
                            console.log("Updated last_login timestamp");
                            // Insert redirect after sign-up here!
                            alert("User logged in!");
                            // (temporarily) Redirects parent account to main_menu after log in
                            window.location.href = "student_dashboard.html";
                        })
                        .catch((error) => {
                            console.error("Error updating last_login timestamp:", error);
                            alert("Error updating last_login timestamp.");
                        });
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;

                    console.error(`Error authenticating user: ${errorCode} - ${errorMessage}`);
                    alert(errorMessage);
                });
        } else {
            console.log(`User with username ${usernameInput} has invalid user role`);
            alert("Invalid user role.");
        }
    } else {
        console.log(`No user found with username ${usernameInput}`);
        alert("User not found.");
    }
}