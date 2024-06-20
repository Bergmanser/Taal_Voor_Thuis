const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://127.0.0.1:5500", // Base URL for your local server
    supportFile: "cypress/support/e2e.js", // Support file location for E2E tests
    fixturesFolder: "cypress/fixtures", // Fixture folder location
    specPattern: 'cypress/integration/**/*.spec.js', // Spec pattern to recognize your tests
    video: true,
    screenshotOnRunFailure: true,
  },
  component: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    devServer: {
      framework: 'html', // Use 'html' since you are not using a specific framework | html is currently not supported yet by Cypress
      bundler: 'webpack',
      webpackConfig: require('./webpack.config.cjs'),
    },
    specPattern: 'cypress/component/**/*.cy.js',
    supportFile: "cypress/support/component.js", // Add this line to specify the support file
  },
});
