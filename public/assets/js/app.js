import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js"

$(document).ready(function () {
    const $menuButton = $("#menuButton");
    const $menu = $("#menu");
    const $homeLogo = $("#homeLogo");
    const $overlay = $("#overlay");
    const $logoutButton = $("#logoutButton");
    const $logoutModal = $("#logoutModal");
    const $closeModal = $("#closeModal");
    const $cancelLogout = $("#cancelLogout");

    // Handle menu toggle
    $menuButton.click(function () {
        $menu.toggleClass("menu-open");
        $overlay.toggle();
    });

    // Hide menu when overlay is clicked
    $overlay.click(function () {
        $menu.removeClass("menu-open");
        $overlay.hide();
    });

    // Redirect to home page based on user role when logo is clicked
    $homeLogo.click(async function () {
        try {
            const userRole = await getUserRole();
            redirectToDashboard(userRole);
        } catch (error) {
            console.error('Error getting user role:', error);
        }
    });

    // Show logout modal when logout button is clicked
    $logoutButton.click(function () {
        $logoutModal.show();
    });

    // Hide logout modal when close button is clicked
    $closeModal.click(function () {
        $logoutModal.hide();
    });

    // Hide logout modal when cancel button is clicked
    $cancelLogout.click(function () {
        $logoutModal.hide();
    });

    // Handle user logout and redirect based on user role
    $('#confirmLogout').click(async function () {
        try {
            const userRole = await getUserRole();
            await signOut(auth);
            console.log('User logged out');
            redirectToLogin(userRole);
        } catch (error) {
            console.error('Error logging out:', error);
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
                window.location.href = 'parent_dashboard.html';
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

        // Append menu links to the menu list
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
            console.log('User found:', user.uid);
            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("email", "==", user.email)); // Change to query by email
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.size > 0) {
                userSnapshot.forEach(doc => {
                    console.log('User document data:', doc.data());
                });
                const userData = userSnapshot.docs[0].data();
                console.log('User data:', userData);
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

    // Initialize menu based on user role
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                console.log('User state changed:', user.uid);
                const userRole = await getUserRole();
                console.log('User role:', userRole);
                populateMenu(userRole);
            } catch (error) {
                console.error("Error getting user role:", error);
            }
        } else {
            console.log("No user is logged in.");
        }
    });
});
