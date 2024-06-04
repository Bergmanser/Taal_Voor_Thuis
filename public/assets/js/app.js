// header.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
const auth = getAuth();
const database = getFirestore(app);

$(document).ready(function () {
    const $menuButton = $("#menuButton");
    const $menu = $("#menu");
    const $homeLogo = $("#homeLogo");
    const $overlay = $("#overlay");
    const $logoutButton = $("#logoutButton");
    const $logoutModal = $("#logoutModal");
    const $closeModal = $("#closeModal");
    const $cancelLogout = $("#cancelLogout");

    $menuButton.click(function () {
        $menu.toggleClass("menu-open");
        $overlay.toggle();
    });

    $overlay.click(function () {
        $menu.removeClass("menu-open");
        $overlay.hide();
    });

    $homeLogo.click(function () {
        window.location.href = "home.html";  // Redirect to home page
    });

    $logoutButton.click(function () {
        $logoutModal.show();
    });

    $closeModal.click(function () {
        $logoutModal.hide();
    });

    $cancelLogout.click(function () {
        $logoutModal.hide();
    });

    // Event listener for logout button
    $('#confirmLogout').click(function () {
        signOut(auth).then(() => {
            console.log('User logged out');
            // Redirect to login page after logout
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Error logging out:', error);
        });
    });

    // Function to populate menu based on user type
    async function populateMenu(userRole) {
        const $menuList = $menu.find("ul");
        $menuList.empty();  // Clear existing menu items

        let links = [];
        switch (userRole) {
            case 0: // student
                links = [
                    { text: "Link 1", url: "link1_student.html" },
                    { text: "Link 2", url: "link2_student.html" },
                    { text: "Link 3", url: "link3_student.html" },
                    { text: "Link 4", url: "link4_student.html" },
                    { text: "Link 5", url: "link5_student.html" },
                ];
                break;
            case 1: // private
                links = [
                    { text: "Link 1", url: "link1_private.html" },
                    { text: "Link 2", url: "link2_private.html" },
                    { text: "Link 3", url: "link3_private.html" },
                    { text: "Link 4", url: "link4_private.html" },
                    { text: "Link 5", url: "link5_private.html" },
                ];
                break;
            case 2: // business
                links = [
                    { text: "Link 1", url: "link1_business.html" },
                    { text: "Link 2", url: "link2_business.html" },
                    { text: "Link 3", url: "link3_business.html" },
                    { text: "Link 4", url: "link4_business.html" },
                    { text: "Link 5", url: "link5_business.html" },
                ];
                break;
            case 3: // admin
                links = [
                    { text: "Link 1", url: "link1_admin.html" },
                    { text: "Link 2", url: "link2_admin.html" },
                    { text: "Link 3", url: "link3_admin.html" },
                    { text: "Link 4", url: "link4_admin.html" },
                    { text: "Link 5", url: "link5_admin.html" },
                ];
                break;
            case 4: // editor
                links = [
                    { text: "Link 1", url: "link1_editor.html" },
                    { text: "Link 2", url: "link2_editor.html" },
                    { text: "Link 3", url: "link3_editor.html" },
                    { text: "Link 4", url: "link4_editor.html" },
                    { text: "Link 5", url: "link5_editor.html" },
                ];
                break;
            case 5: // MeerDanBijles
                links = [
                    { text: "Link 1", url: "link1_meerdanbijles.html" },
                    { text: "Link 2", url: "link2_meerdanbijles.html" },
                    { text: "Link 3", url: "link3_meerdanbijles.html" },
                    { text: "Link 4", url: "link4_meerdanbijles.html" },
                    { text: "Link 5", url: "link5_meerdanbijles.html" },
                ];
                break;
        }

        links.forEach(link => {
            const $li = $("<li></li>");
            const $a = $("<a></a>").attr("href", link.url).text(link.text);
            $li.append($a);
            $menuList.append($li);
        });
    }

    // Get user role from Firestore
    async function getUserRole() {
        const user = auth.currentUser;
        if (user) {
            const userRef = collection(database, "users");
            const userQuery = query(userRef, where("uid", "==", user.uid));
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.size === 1) {
                const userData = userSnapshot.docs[0].data();
                return userData.userRoleId;
            } else {
                throw new Error("User not found.");
            }
        } else {
            throw new Error("No user is logged in.");
        }
    }

    // Initialize menu based on user role
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userRole = await getUserRole();
                populateMenu(userRole);
            } catch (error) {
                console.error("Error getting user role:", error);
            }
        } else {
            console.log("No user is logged in.");
        }
    });
});
