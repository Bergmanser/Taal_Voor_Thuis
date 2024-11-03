import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";

$(document).ready(function () {
    const $homeLogo = $("#homeLogo");
    const $userInfo = $("#userInfo");
    const $userMenu = $("#userMenu");
    const $logoutButton = $("#logoutButton");
    const $logoutModal = $("#logoutModal");
    const $closeModal = $("#closeModal");
    const $confirmLogout = $("#confirmLogout");
    const $accountInfo = $("#accountInfo");
    const $username = $("#username");
    const $avatar = $("#avatar");

    // Redirect to home page based on user role when logo is clicked
    $homeLogo.click(async function () {
        try {
            const userRole = await getUserRole();
            redirectToDashboard(userRole);
        } catch (error) {
            console.error('Error getting user role:', error);
        }
    });

    $userInfo.click(function () {
        $userMenu.toggle();
    });

    $logoutButton.click(function () {
        $logoutModal.show();
        $userMenu.hide();
    });

    $closeModal.click(function () {
        $logoutModal.hide();
    });

    $confirmLogout.click(async function () {
        try {
            const userRole = await getUserRole();
            await signOut(auth);
            console.log('User logged out');
            redirectToLogin(userRole);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });

    $accountInfo.click(function () {
        window.location.href = 'user_info.html';
    });

    // Close the user menu if clicked outside
    $(window).click(function (event) {
        if (!$userInfo[0].contains(event.target) && !$userMenu[0].contains(event.target)) {
            $userMenu.hide();
        }
    });

    // Function to redirect user to the appropriate dashboard based on user role
    function redirectToDashboard(userRole) {
        switch (userRole) {
            case 0: // student
                window.location.href = 'student_dashboard.html';
                break;
            case 1: // private
            case 2: // business
                window.location.href = 'parent_overview.html';
                break;
            case 3: // admin
            case 4: // editor
                window.location.href = 'employee_dashboard.html';
                break;
            default:
                console.error("Unknown user role");
                break;
        }
    }

    // Function to redirect user to the appropriate login page based on user role
    function redirectToLogin(userRole) {
        switch (userRole) {
            case 0: // student
                window.location.href = 'login_student_tvt.html';
                break;
            case 1: // private
            case 2: // business
                window.location.href = 'login_parent_tvt.html';
                break;
            case 3: // admin
            case 4: // editor
                window.location.href = 'login_employee_tvt.html';
                break;
            default:
                window.location.href = 'https://www.taalvoorthuis.nl';
        }
    }

    // Get user role from Firestore
    async function getUserRole() {
        const user = auth.currentUser;
        if (user) {
            console.log('User found:', user.uid);
            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("email", "==", user.email));
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.size > 0) {
                userSnapshot.forEach(doc => {
                    console.log('User document data:', doc.data());
                });
                const userData = userSnapshot.docs[0].data();
                return userData.userRoleId;
            } else {
                console.log('No user document found');
                throw new Error("User not found.");
            }
        } else {
            console.log('No user is logged in');
            throw new Error("No user is logged in.");
        }
    }

    async function updateUserInfo() {
        try {
            const user = auth.currentUser;
            if (user) {
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("email", "==", user.email));
                const userSnapshot = await getDocs(userQuery);

                if (userSnapshot.size > 0) {
                    const userData = userSnapshot.docs[0].data();
                    const userRoleId = userData.userRoleId;
                    let username;

                    if (userRoleId === 0) {
                        // For students, look in the studentdb collection, this will allow us to use a users real name in the future
                        const studentdbRef = collection(db, "studentdb");
                        const studentQuery = query(studentdbRef, where("email", "==", user.email));
                        const studentSnapshot = await getDocs(studentQuery);

                        if (studentSnapshot.size > 0) {
                            const studentData = studentSnapshot.docs[0].data();
                            username = studentData.username;
                        }
                    } else {
                        // For non-students, use the username from the users collection
                        username = userData.username;
                    }

                    if (username) {
                        $username.text(username);
                        $avatar.text(username.charAt(0).toUpperCase());
                    } else {
                        $username.text(user.email);
                        $avatar.text(user.email.charAt(0).toUpperCase());
                    }
                } else {
                    console.log('No user document found');
                    $username.text(user.email);
                    $avatar.text(user.email.charAt(0).toUpperCase());
                }
            }
        } catch (error) {
            console.error("Error getting user data:", error);
            // In case of error, display email as fallback
            $username.text(user.email);
            $avatar.text(user.email.charAt(0).toUpperCase());
        }
    }

    // Initialize header based on user role
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                console.log('User state changed:', user.uid);
                await updateUserInfo();
            } catch (error) {
                console.error("Error getting user role:", error);
            }
        } else {
            console.log("No user is logged in.");
            // window.location.href = 'login.html'; // Redirect to login page if no user is logged in
        }
    });
});

// Sticky header logic
let prevScrollpos = window.pageYOffset;
window.onscroll = function () {
    const currentScrollPos = window.pageYOffset;
    if (prevScrollpos > currentScrollPos) {
        document.querySelector(".header").style.top = "0";
    } else {
        document.querySelector(".header").style.top = "-88px";
    }
    prevScrollpos = currentScrollPos;
}