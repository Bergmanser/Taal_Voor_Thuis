import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// Initialize Firebase
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

// Your Firebase config.
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);

// Define a function to initialize the page
function initializePage() {
    // Check if the user is logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('Current User Email:', user.email);

            // Get a reference to the "child-users-table" element
            const tableBody = document.getElementById('child-users-table').getElementsByTagName('tbody')[0];

            // Define a function to fetch child users based on the parent user's email
            function getChildUsers(parentEmail) {
                // Extract the base email from the parent email
                const baseEmail = parentEmail.split('+')[0];

                // Create a regex pattern for the parent email with a + and any number
                const parentEmailWithPlus = `${baseEmail}+*`;

                // Query the "studentdb" collection for documents where the email field matches the parentEmailWithPlus regex pattern
                return db.collection('studentdb')
                    .where('email', 'regex', parentEmailWithPlus)
                    .get()
                    .then((querySnapshot) => {
                        const childUsers = [];
                        querySnapshot.forEach((doc) => {
                            childUsers.push({ id: doc.id, ...doc.data() });
                        });
                        return childUsers;
                    })
                    .catch((error) => {
                        console.error('Error getting child users:', error);
                        return [];
                    });
            }

            // Fetch child users based on the parent user's email
            getChildUsers(user.email).then((childUsers) => {
                // Log the number of child users
                console.log("Number of child users:", childUsers.length);

                // Render the child users in the table
                let childUsersHtml = '';
                childUsers.forEach((childUser) => {
                    childUsersHtml += `<tr>
                                            <td>${childUser.username}</td>
                                            <td>${childUser.email}</td>
                                            <td>${childUser.customizable}</td>
                                        </tr>`;
                });
                tableBody.innerHTML = childUsersHtml;

                // Add event listeners to the table rows
                const rows = document.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
                    rows[i].addEventListener('click', () => {
                        const docId = rows[i].getElementsByTagName('td')[0].getAttribute('data-doc-id');
                        window.location.href = `child-info.html?id=${docId}`;
                    });
                }
            });

        } else {
            // Redirect the user to the 'login_student_tvt.html'
            window.location.href = "login_parent_tvt.html";
        }
    });
}

// Call the initializePage function when the page loads
window.onload = initializePage;
function init() {
    // Get the current user's email
    const user = auth.currentUser;
    const parentEmail = user.email;

    // Log the parent email
    console.log("Parent email:", parentEmail);

    // Fetch child users based on the parent user's email
    getChildUsers(parentEmail).then((childUsers) => {
        // Log the number of child users
        console.log("Number of child users:", childUsers.length);

        // Render the child users in the table
        let childUsersHtml = '';
        childUsers.forEach((childUser) => {
            childUsersHtml += `<tr>
                                            <td>${childUser.username}</td>
                                            <td>${childUser.email}</td>
                                            <td>${childUser.customizable}</td>
                                        </tr>`;
        });
        tableBody.innerHTML = childUsersHtml;

        // Add event listeners to the table rows
        const rows = document.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            rows[i].addEventListener('click', () => {
                const docId = rows[i].getElementsByTagName('td')[0].getAttribute('data-doc-id');
                window.location.href = `child-info.html?id=${docId}`;
            });
        }
    });
}

// const runBtn = document.getElementById("run-btn");
// runBtn.addEventListener("click", () => {
//     window.location.href = "add_students_tvt.html";

//     // Get the current user's email
//     // const userEmail = auth.currentUser.email;

//     // // Get the current user's UID
//     // const userRef = db.collection("users").where("email", "==", userEmail);
//     // let userUid;
//     // userRef.get().then((querySnapshot) => {
//     //     querySnapshot.forEach((doc) => {
//     //         userUid = doc.id;
//     //         getChildren(userUid);
//     //     });
//     // });

//     // Get all child users with the same email as the parent but with a "+" and a number behind them
//     // function getChildren(parentUid) {
//     //     const childrenRef = db.collection("users").where("parentEmail", "==", parentUid);
//     //     childrenRef.get().then((querySnapshot) => {
//     //         const children = [];
//     //         querySnapshot.forEach((doc) => {
//     //             children.push(doc.data());
//     //         });
//     //         console.log("Children: ", children);
//     //     });
//     // }
// });

