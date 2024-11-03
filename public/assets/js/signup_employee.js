import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js"

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
                const userRef = doc(db, "users", user.uid);

                await setDoc(userRef, {
                    uid: user.uid,
                    email: email,
                    username: email, // Use email as username for simplicity
                    userRoleId: userRoleId // The user role id is decided the selected user rol in the frontend

                });

                // Insert redirect after sign-up here!
                alert("User Created!");
                window.location.href = "login_employee_tvt.html";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                alert(errorMessage);
            });
    }
});