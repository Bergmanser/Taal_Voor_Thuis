describe('Parent Login', () => {
    beforeEach(() => {
        cy.mockFirebase();
        cy.visit('http://127.0.0.1:5500/public/login_parent_tvt.html');
    });

    it('should display the login page', () => {
        cy.get('form').should('be.visible');
    });

    it('should allow a parent user to log in', () => {
        cy.get('#email-user-login').type('taalvoorthuis@gmail.com');
        cy.get('#password-user-login').type('654321');
        cy.get('#login-button').click();

        cy.url().should('include', '/parent_overview.html');
        cy.get('h1').should('contain', 'Parent Overview');
    });

    it('should prevent access with valid credentials but incorrect role', () => {
        cy.get('#email-user-login').type('editor@gmail.co');
        cy.get('#password-user-login').type('123456');
        cy.get('#login-button').click();

        cy.url().should('eq', 'http://127.0.0.1:5500/public/login_parent_tvt.html');
        cy.get('#notification-area').should('contain', 'Invalid user or user role.');
    });

    it('should show an error message for invalid login', () => {
        cy.get('#email-user-login').type('invalid@example.com');
        cy.get('#password-user-login').type('wrongpassword');
        cy.get('#login-button').click();

        cy.url().should('eq', 'http://127.0.0.1:5500/public/login_parent_tvt.html');
        cy.get('#notification-area').should('contain', 'Invalid user or user role.');
    });

    it('should send a password reset email', () => {
        cy.get('.forgot-password a').click();
        cy.get('#reset-email').type('taalvoorthuis@gmail.com');
        cy.get('#reset-button').click();

        cy.get('#modal-notification-area').should('contain', 'If an account with that email exists, a password reset email has been sent.');
    });
});
