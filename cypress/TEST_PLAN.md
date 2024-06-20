# Cypress E2E Test Plan

## Objective
Ensure the reliability of user authentication processes, validate the accuracy of data management functionalities, and verify the overall user experience and system performance.

## Scope
This test plan covers:
- User authentication for Parent, Employee, and Student roles.
- Role-based access control.
- Signup functionality for different roles.
- Password reset functionality.
- UI interactions and error handling.

## Test Scenarios

### Parent Login
- **Load Login Page**: Verify the login page loads correctly.
- **Successful Login**: Test login with valid credentials.
- **Role-Based Access Control**: Test login with valid credentials but incorrect role.
- **Invalid Login**: Test login with invalid credentials.
- **Password Reset**: Test password reset functionality.

### Employee Login
- **Load Login Page**: Verify the login page loads correctly.
- **Successful Login**: Test login with valid credentials.
- **Role-Based Access Control**: Test login with valid credentials but incorrect role.
- **Invalid Login**: Test login with invalid credentials.
- **Password Reset**: Test password reset functionality.

### Student Login
- **Load Login Page**: Verify the login page loads correctly.
- **Successful Login**: Test login with valid credentials.
- **Role-Based Access Control**: Test login with valid credentials but incorrect role.
- **Invalid Login**: Test login with invalid credentials.

### Role Redirects
- **Student Role Redirect**: Verify that a student user is redirected correctly based on their role.
- **Parent Role Redirect**: Verify that a parent user is redirected correctly based on their role.
- **Editor Role Redirect**: Verify that an editor user is redirected correctly based on their role.
- **Admin Role Redirect**: Verify that an admin user is redirected correctly based on their role.

### Signups
- **Employee Signup**: Verify that an employee user can sign up successfully.
- **Parent Signup**: Verify that a parent user can sign up successfully.

## Configuration
- **Video Recording**: Enabled
- **Screenshots on Failure**: Enabled

## Firebase Mocks
- **Authentication**: Mocked authentication service to simulate login and password reset.
- **Firestore**: Mocked Firestore service to simulate data retrieval and updates.
- **Storage**: Mocked storage service if applicable.

## Test Environment
- **Base URL**: http://127.0.0.1:5500
- **Browsers**: Chrome (default), can be configured to use others as needed.
- **Operating System**: macOS, Windows, or Linux as applicable.

## Risk Management
- **Data Privacy**: Ensure test data is anonymized and complies with data protection regulations.
- **Test Data Management**: Regularly update and maintain test data to reflect current project requirements.
- **Resource Management**: Prioritize critical test cases and functionalities to manage limited resources effectively.
- **Requirement Changes**: Establish a change management process to handle updates in project requirements.

## Commands and Customizations
- **Custom Commands**: Describe any custom Cypress commands used in the tests.
  - `cy.mockFirebase()`: Custom command to mock Firebase services.
    - **Purpose**: Mocks Firebase authentication, Firestore, and storage services to simulate real Firebase interactions without actual backend calls.
    - **Usage**: `cy.mockFirebase();`
    
  - `cy.login(emailOrUsername, password, role)`: Custom command to log in a user with specific credentials and role.
    - **Purpose**: Automates the login process for different user roles (student, parent, editor, admin) by filling in the login form and clicking the login button.

  - `cy.assertNotification(message, isModal = false)`: Custom command to assert the presence of a notification message.
    - **Purpose**: Checks for the presence of a notification message in the specified area (modal or non-modal).
  
  - `cy.resetPassword(email)`: Custom command to trigger the password reset process.
    - **Purpose**: Automates the password reset process by navigating to the reset password form, entering the email, and clicking the reset button.


## Test Cases

### Parent Login
**Test Case: Load Login Page**
- **Test ID**: TC001
- **Description**: Verify the parent login page loads correctly.
- **Preconditions**: None.
- **Test Steps**:
  1. Navigate to the parent login page.
- **Expected Result**: The login page should load without any errors.
- **Status**: 
- **Comments**: 

**Test Case: Successful Login**
- **Test ID**: TC002
- **Description**: Verify that a parent user can log in successfully.
- **Preconditions**: The parent user must have valid credentials.
- **Test Steps**:
  1. Navigate to the parent login page.
  2. Enter the email and password.
  3. Click the login button.
- **Expected Result**: The user should be redirected to the parent overview page.
- **Status**: 
- **Comments**: 

**Test Case: Role-Based Access Control**
- **Test ID**: TC003
- **Description**: Test login with valid credentials but incorrect role.
- **Preconditions**: The user must have valid credentials but an incorrect role.
- **Test Steps**:
  1. Navigate to the parent login page.
  2. Enter the email and password.
  3. Click the login button.
- **Expected Result**: The user should see an error message and not be granted access.
- **Status**: 
- **Comments**: 

**Test Case: Invalid Login**
- **Test ID**: TC004
- **Description**: Test login with invalid credentials.
- **Preconditions**: The user must have invalid credentials.
- **Test Steps**:
  1. Navigate to the parent login page.
  2. Enter an invalid email and password.
  3. Click the login button.
- **Expected Result**: The user should see an error message.
- **Status**: 
- **Comments**: 

**Test Case: Password Reset**
- **Test ID**: TC005
- **Description**: Test password reset functionality.
- **Preconditions**: The user must have a valid email address.
- **Test Steps**:
  1. Navigate to the parent login page.
  2. Click on the "Forgot Password?" link.
  3. Enter the email address.
  4. Click the reset button.
- **Expected Result**: A password reset email should be sent if the email exists.
- **Status**: 
- **Comments**: 

### Employee Login
**Test Case: Load Login Page**
- **Test ID**: TC006
- **Description**: Verify the employee login page loads correctly.
- **Preconditions**: None.
- **Test Steps**:
  1. Navigate to the employee login page.
- **Expected Result**: The login page should load without any errors.
- **Status**: 
- **Comments**: 

**Test Case: Successful Login**
- **Test ID**: TC007
- **Description**: Verify that an employee user can log in successfully.
- **Preconditions**: The employee user must have valid credentials.
- **Test Steps**:
  1. Navigate to the employee login page.
  2. Enter the email and password.
  3. Click the login button.
- **Expected Result**: The user should be redirected to the main menu page.
- **Status**: 
- **Comments**: 

**Test Case: Role-Based Access Control**
- **Test ID**: TC008
- **Description**: Test login with valid credentials but incorrect role.
- **Preconditions**: The user must have valid credentials but an incorrect role.
- **Test Steps**:
  1. Navigate to the employee login page.
  2. Enter the email and password.
  3. Click the login button.
- **Expected Result**: The user should see an error message and not be granted access.
- **Status**: 
- **Comments**: 

**Test Case: Invalid Login**
- **Test ID**: TC009
- **Description**: Test login with invalid credentials.
- **Preconditions**: The user must have invalid credentials.
- **Test Steps**:
  1. Navigate to the employee login page.
  2. Enter an invalid email and password.
  3. Click the login button.
- **Expected Result**: The user should see an error message.
- **Status**: 
- **Comments**: 

**Test Case: Password Reset**
- **Test ID**: TC010
- **Description**: Test password reset functionality.
- **Preconditions**: The user must have a valid email address.
- **Test Steps**:
  1. Navigate to the employee login page.
  2. Click on the "Forgot Password?" link.
  3. Enter the email address.
  4. Click the reset button.
- **Expected Result**: A password reset email should be sent if the email exists.
- **Status**: 
- **Comments**: 

### Student Login
**Test Case: Load Login Page**
- **Test ID**: TC011
- **Description**: Verify the student login page loads correctly.
- **Preconditions**: None.
- **Test Steps**:
  1. Navigate to the student login page.
- **Expected Result**: The login page should load without any errors.
- **Status**: 
- **Comments**: 

**Test Case: Successful Login**
- **Test ID**: TC012
- **Description**: Verify that a student user can log in successfully.
- **Preconditions**: The student user must have valid credentials.
- **Test Steps**:
  1. Navigate to the student login page.
  2. Enter the username and password.
  3. Click the login button.
- **Expected Result**: The user should be redirected to the student dashboard.
- **Status**: 
- **Comments**: 

**Test Case: Role-Based Access Control**
- **Test ID**: TC013
- **Description**: Test login with valid credentials but incorrect role.
- **Preconditions**: The user must have valid credentials but an incorrect role.
- **Test Steps**:
  1. Navigate to the student login page.
  2. Enter the username and password.
  3. Click the login button.
- **Expected Result**: The user should see an error message and not be granted access.
- **Status**: 
- **Comments**: 

**Test Case: Invalid Login**
- **Test ID**: TC014
- **Description**: Test login with invalid credentials.
- **Preconditions**: The user must have invalid credentials.
- **Test Steps**:
  1. Navigate to the student login page.
  2. Enter an invalid username and password.
  3. Click the login button.
- **Expected Result**: The user should see an error message.
- **Status**: 
- **Comments**: 

### Role Redirects
**Test Case: Role Redirect - Student**
- **Test ID**: TC015
- **Description**: Verify that a student user is redirected correctly based on their role.
- **Preconditions**: The student user must have valid credentials.
- **Test Steps**:
  1. Log in as a student user.
  2. Attempt to navigate to the parent overview page.
- **Expected Result**: The user should be redirected to the student dashboard.
- **Status**: 
- **Comments**: 

**Test Case: Role Redirect - Parent**
- **Test ID**: TC016
- **Description**: Verify that a parent user is redirected correctly based on their role.
- **Preconditions**: The parent user must have valid credentials.
- **Test Steps**:
  1. Log in as a parent user.
  2. Attempt to navigate to the parent overview page.
- **Expected Result**: The user should remain on the parent overview page.
- **Status**: 
- **Comments**: 

**Test Case: Role Redirect - Editor**
- **Test ID**: TC017
- **Description**: Verify that an editor user is redirected correctly based on their role.
- **Preconditions**: The editor user must have valid credentials.
- **Test Steps**:
  1. Log in as an editor user.
  2. Attempt to navigate to the parent overview page.
- **Expected Result**: The user should be redirected to the main menu page.
- **Status**: 
- **Comments**: 

**Test Case: Role Redirect - Admin**
- **Test ID**: TC018
- **Description**: Verify that an admin user is redirected correctly based on their role.
- **Preconditions**: The admin user must have valid credentials.
- **Test Steps**:
  1. Log in as an admin user.
  2. Attempt to navigate to the parent overview page.
- **Expected Result**: The user should be redirected to the main menu page.
- **Status**: 
- **Comments**: 

### Signups
**Test Case: Signup - Employee**
- **Test ID**: TC019
- **Description**: Verify that an employee user can sign up successfully.
- **Preconditions**: None.
- **Test Steps**:
  1. Navigate to the employee signup page.
  2. Enter the email, password, and select the user role (Administrator or Editor).
  3. Click the signup button.
- **Expected Result**: The user should be redirected to the employee login page with a success message.
- **Status**: 
- **Comments**: 

**Test Case: Signup - Parent**
- **Test ID**: TC020
- **Description**: Verify that a parent user can sign up successfully.
- **Preconditions**: None.
- **Test Steps**:
  1. Navigate to the parent signup page.
  2. Enter the email and password.
  3. Click the signup button.
- **Expected Result**: The user should be redirected to the parent login page with a success message.
- **Status**: 
- **Comments**: 

## Conclusion
This document serves as the comprehensive test plan for the Cypress E2E tests, ensuring all relevant functionalities are covered, tested, and documented to maintain the quality and reliability of the web application.
