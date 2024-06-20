// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// cypress/support/commands.js

// Mock Firebase services
// Cypress.Commands.add('mockFirebase', () => {
//     const { mockAuth, mockFirestore, mockStorage, initializeApp } = require('./firebaseMock');
//     return { auth: mockAuth, firestore: mockFirestore, storage: mockStorage, initializeApp };
// });

// Custom command for login
Cypress.Commands.add('login', (emailOrUsername, password, role) => {
    let loginUrl = '';
    switch (role) {
        case 0: // student
            loginUrl = '/public/login_student_tvt.html';
            cy.visit(loginUrl);
            cy.get('#username-user-login').type(emailOrUsername);
            cy.get('#password-user-login').type(password);
            break;
        case 1: // parent
        case 2: // business
            loginUrl = '/public/login_parent_tvt.html';
            cy.visit(loginUrl);
            cy.get('#email-user-login').type(emailOrUsername);
            cy.get('#password-user-login').type(password);
            break;
        case 3: // admin
        case 4: // editor
            loginUrl = '/public/login_employee.html';
            cy.visit(loginUrl);
            cy.get('#email-user-login').type(emailOrUsername);
            cy.get('#password-user-login').type(password);
            break;
        default:
            throw new Error('Invalid role');
    }
    cy.get('#login-button').click();
});

// Custom command for logout
Cypress.Commands.add('logout', () => {
    cy.visit('/public/index.html');
    cy.get('#logoutButton').click();
    cy.get('#logoutModal').should('be.visible');
    cy.get('#confirmLogout').click({ force: true });
    cy.wait(2000); // Adjust the wait time if necessary
});


// Custom command to assert notification message
Cypress.Commands.add('assertNotification', (message, isModal = false) => {
    const notificationArea = isModal ? '#modal-notification-area' : '#notification-area';
    cy.get(notificationArea).should('contain', message);
});

// Custom command to reset password
Cypress.Commands.add('resetPassword', (email) => {
    cy.get('.forgot-password a').click();
    cy.get('#reset-email').type(email);
    cy.get('#reset-button').click();
});
