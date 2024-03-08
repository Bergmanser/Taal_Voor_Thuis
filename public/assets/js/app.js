// // Import the functions you need from the SDKs you need
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
// import { getAnalytics } from "firebase/analytics";
// import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
// // import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//     apiKey: "AIzaSyCHFj9oABXSxiWm7u1yPOvyhXQw_FRp5Lw",
//     authDomain: "project-plato-eb365.firebaseapp.com",
//     projectId: "project-plato-eb365",
//     storageBucket: "project-plato-eb365.appspot.com",
//     messagingSenderId: "753582080609",
//     appId: "1:753582080609:web:98b2db93e63a500a56e020",
//     measurementId: "G-KHJXGLJM4Y"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// const auth = getAuth(app);
// const database = getDatabase(app);


// // function validate_password() {

// //     let password = document.getElementById('password').value;
// //     let confirm_password = document.getElementById('confirm_password').value;
// //     if (password != confirm_password) {
// //         document.getElementById('wrong_password_alert').style.color = 'red';
// //         document.getElementById('wrong_password_alert').innerHTML
// //             = '☒ Use same password';
// //         document.getElementById('create').disabled = true;
// //         document.getElementById('create').style.opacity = (0.4);
// //     } else {
// //         document.getElementById('wrong_pass_alert').style.color = 'green';
// //         document.getElementById('wrong_pass_alert').innerHTML =
// //             '🗹 Password Matched';
// //         document.getElementById('create').disabled = false;
// //         document.getElementById('create').style.opacity = (1);
// //     }
// // }

// // function wrong_password_alert() {
// //     if (document.getElementById('password').value != "" &&
// //         document.getElementById('confirm_password').value != "") {
// //         alert("Your response is submitted");
// //     } else {
// //         alert("Please fill all the fields");
// //     }
// // }

// // console.log("hello world")