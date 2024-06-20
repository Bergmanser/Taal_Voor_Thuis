describe('Parent Login', () => {
    beforeEach(() => {
        cy.visit('http://127.0.0.1:5500/public/login_parent_tvt.html');
    });

    it('should display the login page', () => {
        cy.get('form').should('be.visible');
    });

    it('should allow a parent user to log in', () => {
        cy.login('taalvoorthuis@gmail.com', '654321', 1);

        cy.url().should('include', '/public/parent_overview.html');
        cy.get('h1').should('contain', 'Parent Overview');
    });

    it('should prevent access with valid credentials but incorrect role', () => {
        cy.login('editor@gmail.co', '123456', 3);

        cy.url().should('eq', 'http://127.0.0.1:5500/public/login_parent_tvt.html');
        cy.get('#notification-area').should('contain', 'Invalid user or user role.');
    });

    it('should show an error message for invalid login', () => {
        cy.login('invalid@example.com', 'wrongpassword', 1);

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
