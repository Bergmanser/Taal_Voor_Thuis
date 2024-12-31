import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";

const avatarPaths = {
    1: '../public/assets/images/background_2.png',
    2: '../public/assets/images/background_2.png',
    3: '../public/assets/images/background_2.png',
    4: '../public/assets/images/background_2.png',
    5: '../public/assets/images/background_2.png',
    6: '../public/assets/images/background_2.png',
    // Expected format:
    // 1: '../public/assets/images/avatars/avatar1.png'
};


$(document).ready(function () {
    const elements = {
        homeLogo: $("#homeLogo"),
        userInfo: $("#userInfo"),
        userMenu: $("#userMenu"),
        accountInfo: $("#accountInfo"),
        username: $("#username"),
        avatar: $("#avatar")
    };

    // Event Handlers
    elements.homeLogo.click(async () => {
        try {
            const userRole = await getUserRole();
            redirectToDashboard(userRole);
        } catch (error) {
            console.error('Error getting user role:', error);
        }
    });

    elements.userInfo.click(() => elements.userMenu.toggle());
    elements.accountInfo.click(() => window.location.href = 'user_info_student.html');

    // Close menu on outside click
    $(window).click(event => {
        if (!elements.userInfo[0].contains(event.target) && !elements.userMenu[0].contains(event.target)) {
            elements.userMenu.hide();
        }
    });

    // Role-based Navigation
    function redirectToDashboard(userRole) {
        const dashboards = {
            0: 'student_dashboard.html',
            1: 'parent_overview.html',
            2: 'parent_overview.html',
            3: 'employee_dashboard.html',
            4: 'employee_dashboard.html'
        };
        window.location.href = dashboards[userRole] || console.error("Unknown user role");
    }

    function redirectToLogin(userRole) {
        const loginPages = {
            0: 'login_student_tvt.html',
            1: 'login_parent_tvt.html',
            2: 'login_parent_tvt.html',
            3: 'login_employee_tvt.html',
            4: 'login_employee_tvt.html'
        };
        window.location.href = loginPages[userRole] || 'https://www.taalvoorthuis.nl';
    }

    // Firebase User Management
    async function getUserRole() {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No user is logged in.");
        }

        const userSnapshot = await getDocs(
            query(collection(db, "users"), where("email", "==", user.email))
        );

        if (!userSnapshot.empty) {
            return userSnapshot.docs[0].data().userRoleId;
        }
        throw new Error("User not found.");
    }

    async function updateUserInfo() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userSnapshot = await getDocs(
                query(collection(db, "users"), where("email", "==", user.email))
            );

            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                let username = userData.username;

                if (userData.userRoleId === 0) {
                    const studentSnapshot = await getDocs(
                        query(collection(db, "studentdb"), where("email", "==", user.email))
                    );
                    if (!studentSnapshot.empty) {
                        const studentData = studentSnapshot.docs[0].data();
                        username = studentData.username;

                        elements.username.text(username);
                        if (studentData.studentAvatar) {
                            elements.avatar
                                .html(`<img src="${avatarPaths[studentData.studentAvatar]}" 
                                      alt="User avatar" style="width: 100%; height: 100%; object-fit: cover; 
                                      border-radius: 8px; border: 2px solid #ad2852;">`)
                                .css({
                                    'border-radius': '8px',
                                    'background-color': 'transparent'
                                });
                        } else {
                            elements.avatar
                                .text(username.charAt(0).toUpperCase())
                                .css({
                                    'border-radius': '50%',
                                    'background-color': '#ad2852'
                                });
                        }
                        return;
                    }
                }

                elements.username.text(username || user.email);
                elements.avatar
                    .text((username || user.email).charAt(0).toUpperCase())
                    .css({
                        'border-radius': '50%',
                        'background-color': '#ad2852'
                    });
            }
        } catch (error) {
            console.error("Error getting user data:", error);
            elements.username.text(user.email);
            elements.avatar
                .text(user.email.charAt(0).toUpperCase())
                .css({
                    'border-radius': '50%',
                    'background-color': '#ad2852'
                });
        }
    }

    // Logout Popup Management
    function initializeLogoutPopup() {
        if (window.popupState?.initialized) return;

        const elements = {
            popup: document.getElementById('logoutPopup'),
            cancelBtn: document.getElementById('cancelLogout'),
            confirmBtn: document.getElementById('confirmLogout'),
            logoutBtn: document.getElementById('logoutButton')
        };

        if (!Object.values(elements).every(Boolean)) {
            console.error('Required logout popup elements not found');
            return;
        }

        elements.popup.removeAttribute('style');

        const handlers = {
            showPopup: () => {
                document.querySelectorAll('.popup').forEach(p => {
                    if (p !== elements.popup) p.classList.remove('show');
                });
                elements.popup.classList.add('show');
                document.body.style.overflow = 'hidden';
            },
            hidePopup: () => {
                elements.popup.classList.remove('show');
                document.body.style.overflow = '';
            },
            logout: async () => {
                try {
                    const userRole = await getUserRole();
                    await signOut(auth);
                    handlers.hidePopup();
                    redirectToLogin(userRole);
                } catch (error) {
                    console.error('Error logging out:', error);
                }
            }
        };

        elements.logoutBtn.addEventListener('click', e => {
            e.stopPropagation();
            handlers.showPopup();
            document.getElementById('userMenu')?.style.setProperty('display', 'none');
        });

        elements.popup.addEventListener('click', e => {
            if (e.target === elements.popup) handlers.hidePopup();
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && elements.popup.classList.contains('show')) {
                handlers.hidePopup();
            }
        });

        elements.cancelBtn.addEventListener('click', handlers.hidePopup);
        elements.confirmBtn.addEventListener('click', handlers.logout);

        window.popupState = { initialized: true };
    }

    // Initialize header and auth state
    auth.onAuthStateChanged(async user => {
        if (user) {
            await updateUserInfo();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLogoutPopup);
    } else {
        initializeLogoutPopup();
    }

    $(document).ready(initializeLogoutPopup);
});

// Sticky header behavior
let prevScrollpos = window.pageYOffset;
window.onscroll = function () {
    const currentScrollPos = window.pageYOffset;
    const header = document.querySelector(".header");
    header.style.top = prevScrollpos > currentScrollPos ? "0" : "-88px";
    prevScrollpos = currentScrollPos;
}