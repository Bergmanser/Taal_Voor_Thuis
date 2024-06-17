import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Initialize Main Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);


// firebase config keys for Project Plato Student Processing
// mainly used for seperation of adding a new student user without logging in the newly added-
// student user in the as the currently logged in user.
// There is nothing that can be done about this, that is just how firebase functions.
// But by having a secondary project handle the addition of new students this is prevented

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

// Initialize Secondary Firebase App
const secondaryApp = initializeApp(secondaryFirebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);
const secondaryDatabase = getFirestore(secondaryApp);

export { app, auth, db, secondaryApp, secondaryAuth, secondaryDatabase };
