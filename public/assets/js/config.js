// // Detect the current domain and port
// const currentDomain = window.location.hostname;
// const currentPort = window.location.port;

// // Check if running in development environment (localhost or 127.0.0.1 with ports 5500 or 5501)
// const isDevelopment = (currentDomain.includes("localhost") || currentDomain === "127.0.0.1") &&
//     (currentPort === "5500" || currentPort === "5501");

// // Determine the base URL based on the domain
// const apiUrl = isDevelopment
//     ? `http://${currentDomain}:${currentPort}/` // Development mode - will use actual port
//     : `https://${currentDomain}/`;    // Production domain

// // Define friendly URLs for navigation
// export const pageUrls = {
//     // Development URLs use direct file paths
//     loginPagina: isDevelopment ? `${apiUrl}public/login_student_tvt.html` : `${apiUrl}loginpagina`,
//     quiz: isDevelopment ? `${apiUrl}public/quiz.html` : `${apiUrl}quiz`,
//     userInfoStudent: isDevelopment ? `${apiUrl}public/user_info_student.html` : `${apiUrl}user-info-student`,
//     studentDashboard: isDevelopment ? `${apiUrl}public/student_dashboard.html` : `${apiUrl}student-dashboard`,
//     loginParent: isDevelopment ? `${apiUrl}public/login_parent_tvt.html` : `${apiUrl}login-parent`,
//     loginEmployee: isDevelopment ? `${apiUrl}public/login_employee_tvt.html` : `${apiUrl}login-employee`,
//     loginStudent: isDevelopment ? `${apiUrl}public/login_student_tvt.html` : `${apiUrl}login-student`,
//     answersheet: isDevelopment ? `${apiUrl}public/answersheet_v1.html` : `${apiUrl}answersheet-v1`,
//     globalHeader: isDevelopment ? `${apiUrl}public/global_header.html` : `${apiUrl}global-header`,
//     parentDashboard: isDevelopment ? `${apiUrl}public/parent_overview.html` : `${apiUrl}parent-overview`,
//     employeeDashboard: isDevelopment ? `${apiUrl}public/employee_dashboard.html` : `${apiUrl}employee-dashboard`,
// };