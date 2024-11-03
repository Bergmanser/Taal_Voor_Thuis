import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDocs, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";
import { setLanguage, t, updateUIText } from './localization.js';

// Set initial language to Dutch ('nl')
setLanguage('nl');

// Listen for language changes
document.getElementById('language-switcher').addEventListener('change', (event) => {
    setLanguage(event.target.value);
});

// Show toast feedback with localized messages
function showToast(key, isSuccess = true, isModal = false) {
    const message = t(key);
    const notificationArea = isModal ? document.getElementById('modal-notification-area') : document.getElementById('notification-area');
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

// Retrieve and display stored email if "Remember Me" was previously checked
const rememberMeCheckbox = document.getElementById('remember-me-user');
const emailInput = document.getElementById('email-user-login');
const storedEmail = localStorage.getItem('rememberedEmployeeEmail');

if (storedEmail) {
    emailInput.value = storedEmail;
    rememberMeCheckbox.checked = true;
}

// Login button event listener
document.getElementById('login-button').addEventListener('click', async () => {
    const email = emailInput.value;
    const password = document.getElementById('password-user-login').value;

    if (!email || !password) {
        showToast('fillFields', false);
        return;
    }

    try {
        // Attempt to sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user document and verify role
        const userDoc = await getUserByEmail(email);
        const userRoleId = userDoc.data().userRoleId;

        if (userRoleId === 3 || userRoleId === 4) {
            await updateDoc(doc(db, "users", user.uid), { last_login: new Date() });

            // "Remember Me" functionality
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('rememberedEmployeeEmail', email);
            } else {
                localStorage.removeItem('rememberedEmployeeEmail');
            }

            showToast('loginSuccess');
            setTimeout(() => window.location.href = "employee_dashboard.html", 2000);
        } else {
            showToast('invalidRole', false);
        }
    } catch {
        showToast('loginError', false);
    }
});

// Add keypress event listener for Enter key
document.querySelectorAll('.form-content input').forEach(input => {
    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            document.getElementById('login-button').click();
        }
    });
});

// Enable/disable reset button based on email input
const resetEmailInput = document.getElementById('reset-email');
resetEmailInput.addEventListener('input', () => {
    document.getElementById('reset-button').disabled = !validateEmail(resetEmailInput.value);
});

// Password reset functionality with localized text
document.getElementById('reset-button').addEventListener('click', async () => {
    const email = resetEmailInput.value;

    if (!validateEmail(email)) {
        showToast('enterValidEmail', false, true);
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showToast('passwordResetSent', true, true);
    } catch {
        showToast('passwordResetSent', true, true);
    }

    // Countdown timer
    let timeLeft = 30;
    const resetButton = document.getElementById('reset-button');
    resetButton.disabled = true;
    resetButton.textContent = `Wait ${timeLeft}s`;

    const countdown = setInterval(() => {
        timeLeft -= 1;
        resetButton.textContent = `Wait ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            resetButton.disabled = false;
            resetButton.textContent = t('sendResetLink');
        }
    }, 1000);

    $('#resetPasswordModal').modal('hide');
});

// Validate email structure
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
}

// Fetch user document from Firestore by email
async function getUserByEmail(email) {
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", email));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.size === 1) {
        return userSnapshot.docs[0];
    } else {
        throw new Error("User not found.");
    }
}

// Update initial UI text
updateUIText();
