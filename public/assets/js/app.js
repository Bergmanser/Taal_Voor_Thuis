// import { auth, secondaryAuth, secondaryDatabase } from './firebase.js';
// import { createUserWithEmailAndPassword, deleteUser } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// import { doc, setDoc, getDocs, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// $(document).ready(function () {
//     const modal = $('#signupModal');
//     const deleteModal = $('#deleteModal');
//     const openSignupBtn = $('#openSignupBtn');
//     const closeBtns = $('.close');
//     const confirmDeleteBtn = $('#confirmDeleteBtn');
//     const cancelDeleteBtn = $('#cancelDeleteBtn');
//     let childToDelete = null;

//     openSignupBtn.on('click', function () {
//         modal.show();
//     });

//     closeBtns.on('click', function () {
//         modal.hide();
//         deleteModal.hide();
//     });

//     $(window).on('click', function (event) {
//         if (event.target == modal[0]) {
//             modal.hide();
//         }
//         if (event.target == deleteModal[0]) {
//             deleteModal.hide();
//         }
//     });

//     async function createChildUser(username, age, gender, password, parentInfo) {
//         const uniqueEmail = `${username}+${parentInfo.email}`;

//         try {
//             const userCredential = await createUserWithEmailAndPassword(secondaryAuth, uniqueEmail, password);
//             const user = userCredential.user;

//             await setDoc(doc(secondaryDatabase, `users/${user.uid}`), {
//                 email: uniqueEmail,
//                 username: username,
//                 age: age,
//                 gender: gender,
//                 parentEmail: parentInfo.email,
//                 userRoleId: 0
//             });

//             await setDoc(doc(secondaryDatabase, `studentdb/${user.uid}`), {
//                 email: uniqueEmail,
//                 username: username,
//                 age: age,
//                 gender: gender,
//                 parentEmail: parentInfo.email,
//                 userRoleId: 0
//             });

//             secondaryAuth.signOut();

//             modal.hide();
//             alert("Student Added!");
//             displayChildren();
//         } catch (error) {
//             alert(error.message);
//         }
//     }

//     function getParentInfo() {
//         const parentUser = auth.currentUser;
//         if (parentUser) {
//             return {
//                 uid: parentUser.uid,
//                 email: parentUser.email
//             };
//         } else {
//             throw new Error('No parent user is currently logged in');
//         }
//     }

//     $('#signupForm').on('submit', async function (event) {
//         event.preventDefault();
//         try {
//             const parentInfo = getParentInfo();
//             const username = $('#username-student-signup').val();
//             const age = $('#age-student-signup').val();
//             const gender = $('#gender-student-signup').val();
//             const password = $('#password-student-signup').val();
//             await createChildUser(username, age, gender, password, parentInfo);
//         } catch (error) {
//             alert(error.message);


//         }
//     })
// });