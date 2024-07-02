import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js"

// Function to show toast feedback
function showToast(message, isSuccess = true, isModal = false) {
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
    toastTitle.textContent = 'Notification';

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

// Email validation function
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
}

// Login button event listener
document.getElementById('login-button').addEventListener('click', async () => {
    const email = document.getElementById('email-user-login').value;
    const password = document.getElementById('password-user-login').value;

    if (!email || !password) {
        showToast('Please fill in both email and password fields.', false);
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getUserByEmail(email);
        const userRoleId = userDoc.data().userRoleId;

        if (userRoleId === 3 || userRoleId === 4) {
            await updateDoc(doc(db, "users", user.uid), {
                last_login: new Date()
            });

            showToast("User logged in!");
            setTimeout(() => {
                window.location.href = "main_menu.html";
            }, 2000);
        } else {
            showToast("Invalid user or user role.", false);
        }
    } catch (error) {
        showToast(error.message, false);
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

// Event listener for enabling/disabling the reset button based on email input
document.getElementById('reset-email').addEventListener('input', () => {
    const email = document.getElementById('reset-email').value;
    document.getElementById('reset-button').disabled = !validateEmail(email);
});

// Event listener for sending password reset email with countdown timer
document.getElementById('reset-button').addEventListener('click', async () => {
    const email = document.getElementById('reset-email').value;
    const resetButton = document.getElementById('reset-button');

    // Validate email structure
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address.', false, true);
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showToast('If an account with that email exists, a password reset email has been sent.', true, true);
    } catch (error) {
        // Uniform response for both valid and invalid emails
        showToast('If an account with that email exists, a password reset email has been sent.', true, true);
    }

    let timeLeft = 30;
    resetButton.disabled = true;
    resetButton.textContent = `Wait ${timeLeft}s`;

    const countdown = setInterval(() => {
        timeLeft -= 1;
        resetButton.textContent = `Wait ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            resetButton.disabled = false;
            resetButton.textContent = 'Send Reset Link';
        }
    }, 1000);

    // Close the modal only if the email structure is valid and email has been sent
    $('#resetPasswordModal').modal('hide');
});

// Function to get user document from Firestore by email
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
