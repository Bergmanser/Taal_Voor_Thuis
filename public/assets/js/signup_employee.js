import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

//Sign-up logic
const form = document.querySelector('.sign-up-form form');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    var emailInput = document.getElementById("email-user-signup");
    var passwordInput = document.getElementById("password-user-signup");
    var userRoleSelect = document.getElementById("user-role-select");

    if (emailInput.value && passwordInput.value && userRoleSelect.value !== "") {
        var email = emailInput.value;
        var password = passwordInput.value;
        var userRoleId = parseInt(userRoleSelect.value);

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // Signed up 
                const user = userCredential.user;

                // Send users info to Firestore
                const userRef = doc(database, "users", user.uid);

                await setDoc(userRef, {
                    uid: user.uid,
                    email: email,
                    username: email, // Use email as username for simplicity
                    userRoleId: userRoleId // The user role id is decided the selected user rol in the frontend

                });

                // Insert redirect after sign-up here!
                alert("User Created!");
                window.location.href = "login_employee.html";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                alert(errorMessage);
            });
    }
});