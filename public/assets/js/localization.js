// localization.js
const messages = {
    en: {
        // General Login Page
        loginTitle: "Login",
        loginPrompt: "Please fill out all the required fields to log in to your account",
        usernamePlaceholder: "Username",
        passwordPlaceholder: "Password",
        loginButton: "Login",
        notificationTitle: "Notification",
        loginSuccess: "User logged in!",
        loginError: "Username or password is incorrect. Please try again.",
        invalidRole: "Invalid user role.",
        fillFields: "Please fill in both username and password fields.",
        generalError: "An error occurred. Please try again later.",

        // Parent and Employee Login Specific
        emailPlaceholder: "Email",
        rememberMe: "Remember me",
        forgotPasswordLink: "Forgot Password?",
        resetPasswordTitle: "Reset Password",
        resetModalText: "Please enter your email address to receive a password reset link.",
        sendResetLink: "Send Reset Link",
        enterValidEmail: "Please enter a valid email address.",
        passwordResetSent: "If an account with that email exists, a password reset email has been sent."
    },
    nl: {
        // General Login Page
        loginTitle: "Inloggen",
        loginPrompt: "Vul alle vereiste velden in om in te loggen op je account",
        usernamePlaceholder: "Gebruikersnaam",
        passwordPlaceholder: "Wachtwoord",
        loginButton: "Inloggen",
        notificationTitle: "Melding",
        loginSuccess: "Gebruiker ingelogd!",
        loginError: "Gebruikersnaam of wachtwoord is onjuist. Probeer het opnieuw.",
        invalidRole: "Ongeldige gebruikersrol.",
        fillFields: "Vul zowel gebruikersnaam als wachtwoord in.",
        generalError: "Er is een fout opgetreden. Probeer het later opnieuw.",

        // Parent and Employee Login Specific
        emailPlaceholder: "E-mail",
        rememberMe: "Onthoud mij",
        forgotPasswordLink: "Vergeten?",
        resetPasswordTitle: "Wachtwoord resetten",
        resetModalText: "Vul je e-mailadres in om een link voor het opnieuw instellen van je wachtwoord te ontvangen.",
        sendResetLink: "Link versturen",
        enterValidEmail: "Voer een geldig e-mailadres in.",
        passwordResetSent: "Als er een account met dat e-mailadres bestaat, is een e-mail voor wachtwoordherstel verzonden."
    }
};

let currentLanguage = 'nl';

function setLanguage(language) {
    currentLanguage = language;
    updateUIText();
}

function t(key) {
    return messages[currentLanguage][key] || messages['en'][key];
}

function updateUIText() {
    // General Login Page
    const formHeading = document.getElementById('form-heading');
    if (formHeading) formHeading.textContent = t('loginTitle');

    const formSubheading = document.getElementById('form-subheading');
    if (formSubheading) formSubheading.textContent = t('loginPrompt');

    const usernameInput = document.getElementById('username-user-login');
    if (usernameInput) usernameInput.placeholder = t('usernamePlaceholder'); // Specific to student login

    const passwordInput = document.getElementById('password-user-login');
    if (passwordInput) passwordInput.placeholder = t('passwordPlaceholder');

    const loginButton = document.getElementById('login-button');
    if (loginButton) loginButton.textContent = t('loginButton');

    // Parent Login Specific Elements
    const emailInput = document.getElementById('email-user-login');
    if (emailInput) emailInput.placeholder = t('emailPlaceholder'); // Specific to parent login

    const rememberMeLabel = document.getElementById('remember-me-label');
    if (rememberMeLabel) rememberMeLabel.textContent = t('rememberMe');

    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) forgotPasswordLink.textContent = t('forgotPasswordLink');

    const resetModalTitle = document.getElementById('resetPasswordModalLabel');
    if (resetModalTitle) resetModalTitle.textContent = t('resetPasswordTitle');

    const resetModalText = document.getElementById('reset-modal-text');
    if (resetModalText) resetModalText.textContent = t('resetModalText');

    const resetButton = document.getElementById('reset-button');
    if (resetButton) resetButton.textContent = t('sendResetLink');
}

// Export functions to be used in login scripts
export { setLanguage, t, updateUIText };
