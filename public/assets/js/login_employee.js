import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

//Login logic
addEventListener("change", (e) => {
    var emailInput = document.getElementById("email-user-login");
    var passwordInput = document.getElementById("password-user-login");

    // Check if both input fields have valid data
    if (emailInput.value && passwordInput.value) {
        var email = emailInput.value;
        var password = passwordInput.value;

        // Get the user document from Firestore using the email address
        getUserByEmail(email)
            .then((userDoc) => {
                const userRoleId = userDoc.data().userRoleId;

                // Check if the user exists and has a valid user role (i.e. userRoleId === 3 or userRoleId === 4)
                if (userDoc.exists() && (userRoleId === 3 || userRoleId === 4)) {
                    signInWithEmailAndPassword(auth, email, password)
                        .then((userCredential) => {
                            // Signed in
                            const user = userCredential.user;
                            const date = new Date();

                            // Update the user document in Firestore
                            const userRef = doc(database, "users", user.uid);
                            updateDoc(userRef, {
                                last_login: date,
                            })
                                .then(() => {
                                    // Redirect to main menu
                                    alert("User logged in!");
                                    window.location.href = "main_menu.html";
                                })
                                .catch((error) => {
                                    console.error("Error updating user document:", error);
                                });
                        })
                        .catch((error) => {
                            const errorCode = error.code;
                            const errorMessage = error.message;

                            alert(errorMessage);
                        });
                } else {
                    alert("Invalid user or user role.");
                }
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                alert(errorMessage);
            });
    }
});

// Get the user document from Firestore using the email address
async function getUserByEmail(email) {
    const usersRef = collection(database, "users");
    const userQuery = query(usersRef, where("email", "==", email));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.size === 1) {
        console.log("Found user:", userSnapshot.docs[0].data());
        return userSnapshot.docs[0];
    } else {
        throw new Error("User not found.");
    }
}