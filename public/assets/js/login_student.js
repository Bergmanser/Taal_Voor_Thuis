import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDocs, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";
import { setLanguage, t, updateUIText } from './localization.js';

// Set initial language and update UI texts
setLanguage('nl');  // Set to Dutch ('nl') if preferred

// Listen for language changes
document.getElementById('language-switcher').addEventListener('change', (event) => {
    setLanguage(event.target.value);
});

// Function to show toast feedback with localized messages
function showToast(key, isSuccess = true) {
    const message = t(key);
    const notificationArea = document.getElementById('notification-area');
    const toast = document.createElement('div');
    toast.className = `toast ${isSuccess ? 'bg-success' : 'bg-danger'} show`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';

    const toastHeader = document.createElement('div');
    toastHeader.className = 'toast-header';

    const toastTitle = document.createElement('strong');
    toastTitle.className = 'mr-auto';
    toastTitle.textContent = t('notificationTitle');

    const toastTime = document.createElement('small');
    toastTime.className = 'text-muted';
    toastTime.textContent = 'just now';

    const toastClose = document.createElement('button');
    toastClose.type = 'button';
    toastClose.className = 'ml-2 mb-1 close';
    toastClose.ariaLabel = 'Close';
    toastClose.innerHTML = '<span aria-hidden="true">&times;</span>';
    toastClose.addEventListener('click', () => {
        $(toast).toast('hide');
    });

    toastHeader.appendChild(toastTitle);
    toastHeader.appendChild(toastTime);
    toastHeader.appendChild(toastClose);

    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';
    toastBody.textContent = message;

    toast.appendChild(toastHeader);
    toast.appendChild(toastBody);

    notificationArea.appendChild(toast);

    $(toast).toast({ delay: 5000 });
    $(toast).toast('show');
}

// Login button event listener
document.getElementById('login-button').addEventListener('click', async () => {
    const username = document.getElementById('username-user-login').value;
    const password = document.getElementById('password-user-login').value;

    if (!username || !password) {
        showToast('fillFields', false);
        return;
    }

    try {
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("username", "==", username));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.size === 1) {
            const userDoc = userSnapshot.docs[0];
            const email = userDoc.data().email;
            const userRoleId = userDoc.data().userRoleId;

            if (userRoleId === 0) {
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    await updateDoc(doc(db, "users", userCredential.user.uid), { last_login: new Date() });
                    showToast('loginSuccess');
                    setTimeout(() => {
                        window.location.href = "student_dashboard.html";
                    }, 2000);
                } catch {
                    showToast('loginError', false);
                }
            } else {
                showToast('invalidRole', false);
            }
        } else {
            showToast('loginError', false);
        }
    } catch {
        showToast('generalError', false);
    }
});

// Add keypress event listener to trigger login on Enter key press
const loginFormInputs = document.querySelectorAll('.form-content input');
loginFormInputs.forEach(input => {
    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            document.getElementById('login-button').click();
        }
    });
});

// Update initial UI text
updateUIText();
