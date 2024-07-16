import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js"

// Function to redirect user based on their role
export async function redirectUserBasedOnRole(allowedRoles) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userRoleId = userDoc.data().userRoleId;

                if (!allowedRoles.includes(userRoleId)) {
                    switch (userRoleId) {
                        case 0: // Student
                            window.location.href = "student_dashboard.html";
                            break;
                        case 1: // Parent
                            window.location.href = "parent_overview.html";
                            break;
                        case 2: // Business
                            window.location.href = "parent_overview.html";
                            break;
                        case 3: // Admin
                            window.location.href = "employee_dashboard.html";
                            break;
                        case 4: // Editor
                            window.location.href = "employee_dashboard.html";
                            break;
                        // Add cases for more roles as needed
                        default:
                            console.error("Unknown user role");
                            break;
                    }
                }
            } else {
                console.error("User document does not exist.");
            }
        } else {
            // Redirect to login page if not logged in
            window.location.href = "https://www.taalvoorthuis.nl";
        }
    });
}


// Import the following code to make sure that logged in users with a different user role,
// is not allowed on pages that does not match the expected user role

{/* <script type="module">
import { redirectUserBasedOnRole } from './path/to/roleRedirect.js';

// Call the function with the expected role for the parent dashboard (e.g., 1 and 2 for parents and organization users)
redirectUserBasedOnRole([1, 2]);
</script> */}