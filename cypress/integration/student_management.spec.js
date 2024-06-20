describe('Student Management', () => {
    beforeEach(() => {
        cy.login('blackbox@gmail.co', '123456', 'parent'); // Use the provided test user
        cy.visit('http://127.0.0.1:5500/public/parent_overview.html'); // Adjust the URL to your parent dashboard
    });

    it('should load students related to the parent user', () => {
        cy.get('#childUserList').should('be.visible');
        cy.get('#childUserList tr').should('have.length.greaterThan', 0); // Ensure there are students listed
    });

    it('should add a new student', () => {
        cy.get('.btn-primary[data-target="#addStudentModal"]').click(); // Open the add student modal
        cy.get('#username-student-signup').type('NewStudent');
        cy.get('#password-student-signup').type('password123');
        cy.get('#addStudentForm').submit();

        cy.get('#childUserList').should('contain', 'NewStudent'); // Verify the student is added to the list
    });

    it('should delete a student', () => {
        cy.get('#childUserList tr').first().find('.delete-student-button').click(); // Click delete on the first student
        cy.get('#confirmDeleteButton').click(); // Confirm deletion

        cy.get('#childUserList').should('not.contain', 'NewStudent'); // Verify the student is deleted
    });
});
