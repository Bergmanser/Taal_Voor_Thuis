import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// import { database, firestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-admin.js";
// import { user } from "firebase-functions/v1/auth";
// import { Expression } from "firebase-functions/params";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: "AIzaSyCHFj9oABXSxiWm7u1yPOvyhXQw_FRp5Lw",
    authDomain: "project-plato-eb365.firebaseapp.com",
    projectId: "project-plato-eb365",
    storageBucket: "project-plato-eb365.appspot.com",
    messagingSenderId: "753582080609",
    appId: "1:753582080609:web:98b2db93e63a500a56e020",
    measurementId: "G-KHJXGLJM4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// initialize variables
const db = getFirestore(app);
const auth = firebase.auth()

//set up for sign-up function
function register() {
    email = document.getElementById("email-user").value
    password = document.getElementById("password-user").value
}

// validate input fields
if (validateEmail(email) == false || validatePassword(password) == false) {
    alert("Email or Password is incorrect")
    // return
    // Stop running code
}

// authorization
auth.createUserWithEmailAndPassword(email, password)
    .then(function () {
        // declare user
        var user = auth.currentUser

        // add user to firestore db
        var firestore_ref = getFirestore.ref()

        // create user data
        var user_data = {
            email: email,
            last_login: Date.now(),
        }

        firestore_ref.child("users/" + user.uid).set(user_data)

    })
    .catch(function (error) {
        var error_code = error.code
        var error_message = error.message

        alert(error_message)
    })

function validateEmail(email) {
    expression = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (expression.test(email) == true) {
        return true
    }
    else {
        return false
    }
}

function validatePassword(password) {
    if (password < 6) {
        return false
    }
    else {
        return true
    }
}

function validateField(field) {
    if (field == 0) {
        return false
    }
    if (field.lenght <= 0) {
        return false
    }
    else {
        return true
    }
}
















// function validate_password() {

//     let password = document.getElementById('password').value;
//     let confirm_password = document.getElementById('confirm_password').value;
//     if (password != confirm_password) {
//         document.getElementById('wrong_password_alert').style.color = 'red';
//         document.getElementById('wrong_password_alert').innerHTML
//             = '☒ Use same password';
//         document.getElementById('create').disabled = true;
//         document.getElementById('create').style.opacity = (0.4);
//     } else {
//         document.getElementById('wrong_pass_alert').style.color = 'green';
//         document.getElementById('wrong_pass_alert').innerHTML =
//             '🗹 Password Matched';
//         document.getElementById('create').disabled = false;
//         document.getElementById('create').style.opacity = (1);
//     }
// }

// function wrong_password_alert() {
//     if (document.getElementById('password').value != "" &&
//         document.getElementById('confirm_password').value != "") {
//         alert("Your response is submitted");
//     } else {
//         alert("Please fill all the fields");
//     }
// }

// console.log("hello world")