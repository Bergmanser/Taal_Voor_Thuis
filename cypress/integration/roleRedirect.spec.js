describe('Student Role Redirect Functionality', () => {
    it('should redirect to the student dashboard if a student user tries to access a restricted page', () => {
        // Mock the user role and login
        cy.login('Trunks', '123456', 0);

        // Visit the restricted page
        cy.visit('/public/parent_overview.html');

        // Check if redirected to the student dashboard
        cy.url().should('include', '/public/student_dashboard.html');
    });

    it('should redirect to the appropriate login if not logged in and tries to access a restricted parent page', () => {
        // Log out the user
        cy.logout();

        // Visit the student login page to ensure proper logout
        cy.visit('/public/login_student_tvt.html');

        // Ensure that we are on the student login page before proceeding
        cy.url().should('include', '/public/login_student_tvt.html');

        // Try to visit the restricted parent page
        cy.visit('/public/parent_overview.html');

        // Check if redirected to one of the login pages
        cy.url().should('include', '/public/login_parent_tvt.html');
    });

    it('should redirect to the student dashboard if a student user logs in', () => {
        // Mock the user role and login
        cy.login('Trunks', '123456', 0);

        // Check if redirected to the student dashboard
        cy.url().should('include', '/public/student_dashboard.html');
    });
});
