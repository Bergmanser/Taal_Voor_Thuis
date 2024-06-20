describe('Student Login', () => {
    beforeEach(() => {
        cy.visit('http://127.0.0.1:5500/public/login_student_tvt.html');
    });

    it('should display the login page', () => {
        cy.get('form').should('be.visible');
    });

    it('should allow a student user to log in', () => {
        cy.login('Trunks', '123456', 0);

        cy.url().should('include', '/public/student_dashboard.html');
        cy.get('h1').should('contain', 'Student Dashboard');
    });

    it('should prevent access with valid credentials but incorrect role', () => {
        cy.login('taalvoorthuis@gmail.com', '654321', 1);

        cy.url().should('eq', 'http://127.0.0.1:5500/public/login_student_tvt.html');
        cy.get('#notification-area').should('contain', 'Invalid user or user role.');
    });

    it('should show an error message for invalid login', () => {
        cy.login('invaliduser', 'wrongpassword', 0);

        cy.url().should('eq', 'http://127.0.0.1:5500/public/login_student_tvt.html');
        cy.get('#notification-area').should('contain', 'Invalid user or user role.');
    });
});
