// // Detect the current domain
// const currentDomain = window.location.hostname;

// // Determine the base URL based on the domain
// const apiUrl = currentDomain.includes("localhost") || currentDomain === "127.0.0.1"
//     ? "http://127.0.0.1:5500/public/" // Development mode
//     : `https://${currentDomain}/`;    // Use the current production domain

// // Define friendly URLs for navigation
// export const pageUrls = {
//     loginPagina: `${apiUrl}loginpagina`,
//     quiz: `${apiUrl}quiz`,
//     userInfoStudent: `${apiUrl}user-info-student`,
//     studentDashboard: `${apiUrl}student-dashboard`,
//     loginParent: `${apiUrl}login-parent`,
//     loginEmployee: `${apiUrl}login-employee`,
//     globalHeader: `${apiUrl}global-header`,
// };

// // Optional: Log the current environment for debugging
// console.log(`Environment: ${currentDomain.includes("localhost") ? "Development" : "Production"}`);
// console.log(`API Base URL: ${apiUrl}`);
















// // // Base URL detection for local or production
// // const apiUrl = window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1"
// //     ? "http://127.0.0.1:5500/public/"
// //     : "https://www.taalvoorthuis.nl/";

// // // Define friendly URLs for navigation
// // export const pageUrls = {
// //     loginPagina: `${apiUrl}loginpagina`, // Student login is now "loginpagina"
// //     quiz: `${apiUrl}quiz`,
// //     userInfoStudent: `${apiUrl}user-info-student`,
// //     studentDashboard: `${apiUrl}student-dashboard`,
// //     loginParent: `${apiUrl}login-parent`,
// //     loginEmployee: `${apiUrl}login-employee`,
// //     globalHeader: `${apiUrl}global-header`,
// // };

// // // Redirect to a specific page by friendly name
// // function goToPage(page) {
// //     if (pageUrls[page]) {
// //         window.location.href = pageUrls[page];
// //     } else {
// //         console.error("Page not found:", page);
// //     }
// // }

// // // Example usage
// // // Redirect to the student login page
// // goToPage('loginPagina');
