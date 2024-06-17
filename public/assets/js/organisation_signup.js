import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";

//Sign-up logic
const form = document.querySelector('.form-content');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    var emailInput = document.getElementById("email-user-signup");
    var usernameInput = document.getElementById("email-user-signup");
    var passwordInput = document.getElementById("password-user-signup");

    if (emailInput.value && passwordInput.value) {
        var email = emailInput.value;
        var username = usernameInput.value;
        var password = passwordInput.value;

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // Signed up 
                const user = userCredential.user;

                // Send users info to Firestore
                const userRef = doc(db, "users", user.uid);

                await setDoc(userRef, {
                    uid: user.uid,
                    email: email,
                    username: username,
                    userRoleId: 2 // Set userRoleId to 2 for organisations (parent user)
                });

                // Insert redirect after sign-up here!
                alert("User Created!");
                window.location.href = "login_parent_tvt.html";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                alert(errorMessage);
            });
    }
});