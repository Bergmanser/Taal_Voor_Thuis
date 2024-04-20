import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
const database = getDatabase(app);

//Login logic
addEventListener("change", (e) => {
  var emailInput = document.getElementById("email-user-login");
  var passwordInput = document.getElementById("password-user-login");

  // Check if both input fields have valid data
  if (emailInput.value && passwordInput.value) {
    var email = emailInput.value;
    var password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        const date = new Date();

        update(ref(database, "users/" + user.uid), {
          last_login: date,
        })

        // Insert redirect after sign-up here!
        alert("User logged in!");

        // (temporarily) Redirects parent account to main_menu after log in
        window.location.href = "main_menu.html";
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        alert(errorMessage);
      });
  }
});
