describe('Student Login', () => {
    beforeEach(() => {
        cy.mockFirebase();
        cy.visit('http://127.0.0.1:5500/public/login_student_tvt.html');
    });

    it('should display the login page', () => {
        cy.get('form').should('be.visible');
    });

    it('should allow a student user to log in', () => {
        cy.get('#username-user-login').type('Bulla');
        cy.get('#password-user-login').type('123456');
        cy.get('#login-button').click();

        cy.url().should('include', '/student_dashboard.html');
        cy.get('h1').should('contain', 'Student Dashboard');
    });

    it('should prevent access with valid credentials but incorrect role', () => {
        cy.get('#username-user-login').type('taalvoorthuis@gmail.com');
        cy.get('#password-user-login').type('654321');
        cy.get('#login-button').click();

        cy.url().should('eq', 'http://127.0.0.1:5500/public/login_student_tvt.html');
        cy.get('#notification-area').should('contain', 'Invalid user or user role.');
    });

    it('should show an error message for invalid login', () => {
        cy.get('#username-user-login').type('invaliduser');
        cy.get('#password-user-login').type('wrongpassword');
        cy.get('#login-button').click();

        cy.url().should('eq', 'http://127.0.0.1:5500/public/login_student_tvt.html');
        cy.get('#notification-area').should('contain', 'Invalid user or user role.');
    });
});
