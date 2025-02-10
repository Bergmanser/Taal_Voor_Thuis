import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    deleteUser,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { retrieveStudentsWithSameParentEmail, showMessage } from "../js/parent_overview.js";

// Firebase Configurations
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

const secondaryFirebaseConfig = {
    apiKey: "AIzaSyAb6cOf4ZXjI1t6s-Ks0DnKUA08FFu7Oow",
    authDomain: "project-plato-eb365.firebaseapp.com",
    databaseURL: "https://project-plato-eb365-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-plato-eb365",
    storageBucket: "project-plato-eb365.appspot.com",
    messagingSenderId: "753582080609",
    appId: "1:753582080609:web:72f850e85a54a0c156e020",
    measurementId: "G-8S3CL4DGY9"
};

// Initialize Firebase instances
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);
const secondaryApp = initializeApp(secondaryFirebaseConfig, "secondary");
const secondaryAuth = getAuth(secondaryApp);

class Toast {
    show(message, type = 'success') {
        // Create toast elements
        const toast = document.createElement('div');
        toast.className = 'toast';

        const content = document.createElement('div');
        content.className = 'toast-content';

        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕';

        const text = document.createElement('span');
        text.textContent = message;

        const progress = document.createElement('div');
        progress.className = 'toast-progress';

        // Build toast structure
        content.appendChild(icon);
        content.appendChild(text);
        toast.appendChild(content);
        toast.appendChild(progress);

        // Handle existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Show new toast
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        // Remove after animation
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

class StudentManager {
    constructor(db, auth, secondaryAuth, analytics) {
        this.db = db;
        this.auth = auth;
        this.secondaryAuth = secondaryAuth;
        this.analytics = analytics;
        this.toast = new Toast();
    }

    async getStudentCounter(parentUid) {
        try {
            const studentsRef = doc(this.db, `users/${parentUid}`);
            const studentDoc = await getDoc(studentsRef);

            if (!studentDoc.exists()) return 0;

            const students = studentDoc.data().students || [];
            if (students.length === 0) return 0;

            const existingCounters = students
                .map(student => parseInt(student.split("+")[0].split("@")[0]))
                .filter(num => !isNaN(num));

            return existingCounters.length > 0 ? Math.max(...existingCounters) + 1 : 0;
        } catch (error) {
            console.error("Error getting student counter:", error);
            return 0;
        }
    }

    // New helper method to get used numbers
    async getUsedEmailNumbers(parentEmail) {
        try {
            // Get all students with this parent email
            const studentsRef = collection(this.db, "users");
            const q = query(studentsRef, where("parentEmail", "==", parentEmail));
            const querySnapshot = await getDocs(q);

            // Extract all used numbers from emails
            const usedNumbers = new Set();
            querySnapshot.forEach(doc => {
                const email = doc.data().email;
                const match = email.match(/\+(\d+)@/);
                if (match) {
                    usedNumbers.add(parseInt(match[1]));
                }
            });

            return usedNumbers;
        } catch (error) {
            console.error("Error getting used email numbers:", error);
            return new Set();
        }
    }

    // New optimized generateUniqueEmail method
    async generateUniqueEmail(parentEmail, counter) {
        if (!parentEmail) {
            throw new Error("parentEmail is undefined or null");
        }

        // Parse email components
        const baseEmail = parentEmail.split("@")[0];
        const domain = parentEmail.split("@")[1];

        try {
            // Get all currently used numbers efficiently
            const usedNumbers = await this.getUsedEmailNumbers(parentEmail);

            // Find the next available number
            let newCounter = counter;
            while (usedNumbers.has(newCounter)) {
                newCounter++;
            }

            // Generate and verify the email
            while (true) {
                const uniqueEmail = `${baseEmail}+${newCounter}@${domain}`;

                // Check for invalid format
                if (uniqueEmail.includes('++')) {
                    newCounter++;
                    continue;
                }

                try {
                    // Final verification through auth attempt
                    await createUserWithEmailAndPassword(
                        this.secondaryAuth,
                        uniqueEmail,
                        'temp-pwd-' + Math.random()
                    );

                    // Clean up temp user
                    if (this.secondaryAuth.currentUser) {
                        await deleteUser(this.secondaryAuth.currentUser);
                    }

                    return uniqueEmail;
                } catch (authError) {
                    if (authError.code === 'auth/email-already-in-use') {
                        // Found an orphaned auth entry, try next number
                        console.log(`Found orphaned auth entry for email: ${uniqueEmail}`);
                        newCounter++;
                        continue;
                    }
                    // For any other auth error, assume email is available
                    return uniqueEmail;
                }
            }
        } catch (error) {
            console.error("Error generating unique email:", error);
            throw error;
        }
    }

    async checkUsernameExists(username) {
        const studentQuery = query(
            collection(this.db, "studentdb"),
            where("username", "==", username)
        );
        const snapshot = await getDocs(studentQuery);
        return snapshot.size > 0;
    }

    async createStudentRecords(uid, studentData) {
        try {
            await Promise.all([
                setDoc(doc(this.db, `users/${uid}`), studentData, { merge: true }),
                setDoc(doc(this.db, `studentdb/${uid}`), studentData, { merge: true })
            ]);
            return true;
        } catch (error) {
            console.error("Error creating student records:", error);
            throw error;
        }
    }

    async createStudent(username, password, parentEmail) {
        try {
            // Additional validation
            if (!username || !password || !parentEmail) {
                this.toast.show("Please fill in all fields", "error");
                return false;
            }

            // Check username length and format
            if (username.length < 3 || username.length > 20) {
                this.toast.show("Username must be between 3 and 20 characters", "error");
                return false;
            }

            // Check password strength
            if (password.length < 6) {
                this.toast.show("Password must be at least 6 characters long", "error");
                return false;
            }

            // First check if username exists with better error handling
            const usernameExists = await this.checkUsernameExists(username);
            if (usernameExists) {
                this.toast.show("Username already exists. Please choose another.", "error");
                return false;
            }

            // Generate unique email for the new student
            const counter = await this.getStudentCounter(this.auth.currentUser.uid);
            const uniqueEmail = await this.generateUniqueEmail(parentEmail, counter);

            // Create user in Authentication with additional checks
            let userCredential;
            try {
                // Sign out any existing secondary auth user first
                if (this.secondaryAuth.currentUser) {
                    await this.secondaryAuth.signOut();
                }

                userCredential = await createUserWithEmailAndPassword(
                    this.secondaryAuth,
                    uniqueEmail,
                    password
                );
            } catch (authError) {
                if (authError.code === 'auth/email-already-in-use') {
                    this.toast.show("Email already in use. Please try again.", "error");
                    return false;
                }
                throw authError;
            }

            // Double check no records exist before creating
            const [userExists, studentExists] = await Promise.all([
                this.checkDocumentExists('users', userCredential.user.uid),
                this.checkDocumentExists('studentdb', userCredential.user.uid)
            ]);

            if (userExists || studentExists) {
                this.toast.show("Student record already exists", "error");
                // Clean up auth if possible
                try {
                    await deleteUser(userCredential.user);
                } catch (error) {
                    console.error("Cleanup error:", error);
                }
                return false;
            }

            // Prepare student data
            const studentData = {
                email: uniqueEmail,
                username: username,
                parentEmail: parentEmail,
                userRoleId: 0,
                created_at: new Date(),
                last_login: null
            };

            // Create database records
            await Promise.all([
                setDoc(doc(this.db, `users/${userCredential.user.uid}`), studentData),
                setDoc(doc(this.db, `studentdb/${userCredential.user.uid}`), studentData)
            ]);

            this.toast.show(`Student "${username}" has been added successfully`, "success");
            return true;

        } catch (error) {
            console.error("Error creating student:", error);
            this.toast.show(
                this.getErrorMessage(error.code) || "Failed to create student",
                "error"
            );
            return false;
        }
    }

    async deleteStudent(userId, username) {
        try {
            // Get the user document first
            const userDoc = await getDoc(doc(this.db, 'users', userId));
            if (!userDoc.exists()) {
                this.toast.show("Student not found", "error");
                return false;
            }

            // Delete from both collections first
            await Promise.all([
                deleteDoc(doc(this.db, 'users', userId)),
                deleteDoc(doc(this.db, 'studentdb', userId))
            ]);

            this.toast.show(`Student "${username}" has been deleted`, "success");
            return true;
        } catch (error) {
            console.error("Error deleting student:", error);
            this.toast.show(`Failed to delete student: ${error.message}`, "error");
            return false;
        }
    }

    // Helper method to check if a document exists
    async checkDocumentExists(collection, docId) {
        const docRef = doc(this.db, collection, docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    }

    // Enhanced error messages
    getErrorMessage(code) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/invalid-email': 'Invalid email format.',
            'auth/operation-not-allowed': 'Student creation is currently disabled.',
            'auth/weak-password': 'Password must be at least 6 characters long.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'Student not found.',
            'auth/username-exists': 'This username is already taken.',
            'auth/requires-recent-login': 'Please log in again to perform this action.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        return errorMessages[code] || `An error occurred: ${code}`;
    }
}

// Initialize StudentManager
const studentManager = new StudentManager(db, auth, secondaryAuth, analytics);

// DOM Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login_parent_tvt.html";
            return;
        }

        const form = document.querySelector('#addStudentForm');
        if (!form) {
            console.error("Add student form not found");
            return;
        }

        // Form submission handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById("username-student-signup").value;
            const password = document.getElementById("password-student-signup").value;

            const success = await studentManager.createStudent(
                username,
                password,
                user.email
            );

            if (success) {
                document.getElementById('addStudentPopup').style.display = 'none';
                form.reset();
                retrieveStudentsWithSameParentEmail(user.email);
            }
        });

        // Enter key handler
        const signUpFormInputs = document.querySelectorAll('#addStudentForm input');
        signUpFormInputs.forEach(input => {
            input.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    document.querySelector('.add-student-btn').click();
                }
            });
        });
    });
});

export { studentManager, showMessage };