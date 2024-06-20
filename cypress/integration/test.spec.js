describe('Student Role Redirect Functionality', () => {
    const studentUser = { emailOrUsername: 'Trunks', password: '123456', role: 0 };
    const restrictedUrl = '/public/parent_overview.html';
    const studentDashboardUrl = '/public/student_dashboard.html';
    const loginUrl = '/public/login_student_tvt.html';

    beforeEach(() => {
        cy.visit('http://127.0.0.1:5500/public/index.html'); // Ensure we are on a page that contains the header
    });

    it('should redirect to the student dashboard if a student user tries to access a restricted page', () => {
        // Log in as a student user
        cy.login(studentUser.emailOrUsername, studentUser.password, 'student');

        // Visit a restricted page
        cy.visit(restrictedUrl);

        // Check if redirected to the student dashboard
        cy.url().should('include', studentDashboardUrl);
    });

    it('should redirect to login if not logged in and tries to access a restricted page', () => {
        // Ensure logged out
        cy.logout();

        // Visit a restricted page without login
        cy.visit(restrictedUrl);

        // Check if redirected to login page
        cy.url().should('include', loginUrl);
    });

    it('should redirect to the student dashboard if a student user logs in', () => {
        // Log in as a student user
        cy.login(studentUser.emailOrUsername, studentUser.password, 'student');

        // Check if redirected to the student dashboard
        cy.url().should('include', studentDashboardUrl);
    });
});

// Custom command for login
Cypress.Commands.add('login', (emailOrUsername, password, role) => {
    let loginUrl;
    switch (role) {
        case 'student':
            loginUrl = '/public/login_student_tvt.html';
            break;
        case 'parent':
            loginUrl = '/public/login_parent_tvt.html';
            break;
        case 'employee':
            loginUrl = '/public/login_employee.html';
            break;
        default:
            loginUrl = '/public/login.html';
    }

    cy.visit(loginUrl);

    if (role === 'student') {
        cy.get('#username-user-login').type(emailOrUsername);
        cy.get('#password-user-login').type(password);
    } else {
        cy.get('#email-user-login').type(emailOrUsername);
        cy.get('#password-user-login').type(password);
    }

    cy.get('#login-button').click();
});

// Custom command for logout
Cypress.Commands.add('logout', () => {
    cy.get('#logoutButton').click();
    cy.get('#logoutModal').should('be.visible');
    cy.get('#confirmLogout').click({ force: true });
});
