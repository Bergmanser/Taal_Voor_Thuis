import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
    const studentsRef = doc(database, `users/${uid}`);
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
    const studentsRef = collection(database, "users");
    const studentQuery = query(studentsRef, where("email", "==", email));
    const studentSnapshot = await getDocs(studentQuery);

    return studentSnapshot.size > 0;
}


onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Currently logged in user: " + user.email)
        const uid = user.uid;
        const parentEmail = user.email;

        const counter = getStudentCounter();

        const form = document.querySelector('.form-content');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            var uniqueEmail = await generateUniqueEmail(parentEmail, counter);
            var username = document.getElementById("username-student-signup").value;
            var password = document.getElementById("password-student-signup").value;

            console.log(uniqueEmail);

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, uniqueEmail, password);
                const user = userCredential.user;

                // Send users info to Firestore
                const userRef = doc(database, `users/${user.uid}`);
                await setDoc(userRef, {
                    email: uniqueEmail,
                    username: username,
                    parentEmail: parentEmail, // Adds the parents email to user document
                    username: username,
                    userRoleId: 0 // Set userRoleId to 0 for students
                }, { merge: true });

                const studentRef = doc(database, `studentdb/${user.uid}`);
                await setDoc(studentRef, {
                    email: uniqueEmail,
                    username: username,
                    parentEmail: parentEmail, // Adds the parents email to user document
                    userRoleId: 0 // Set userRoleId to 0 for students
                }, { merge: true });

                // Insert redirect after sign-up here!
                alert("Student Added!");
                // window.location.href = "student_overview_parent_tvt.html";
            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(errorMessage);
            }
        });
    } else {
        // User is signed out
        window.location.href = "login_parent_tvt.html";
    }
});