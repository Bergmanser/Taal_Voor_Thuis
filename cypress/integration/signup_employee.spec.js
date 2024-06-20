describe('Employee Signup', () => {
    beforeEach(() => {
        cy.visit('http://127.0.0.1:5500/public/signup_employee.html');
    });

    it('should display the signup page', () => {
        cy.get('form').should('be.visible');
    });

    it('should allow an employee to sign up', () => {
        cy.get('#email-user-signup').type('newemployee@example.com');
        cy.get('#password-user-signup').type('password123');
        cy.get('#user-role-select').select('4'); // Select Editor role
        cy.get('#signup-button').click();

        cy.url().should('include', '/login_employee.html');
        cy.get('body').should('contain', 'User Created!');
    });

    it('should show an error message for invalid signup', () => {
        cy.get('#email-user-signup').type('invalidemail');
        cy.get('#password-user-signup').type('short');
        cy.get('#user-role-select').select('4'); // Select Editor role
        cy.get('#signup-button').click();

        cy.get('body').should('contain', 'auth/invalid-email');
    });
});
