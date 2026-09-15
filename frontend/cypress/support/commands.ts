/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Register a brand-new user via the UI and land on the dashboard. */
      registerNewUser(): Chainable<{ email: string; password: string }>;
    }
  }
}

Cypress.Commands.add("registerNewUser", () => {
  const unique = Date.now() + Math.floor(Math.random() * 1000);
  const email = `e2e_${unique}@tracky.test`;
  const password = "password123";

  cy.visit("/register");
  cy.get("#name").type("E2E User");
  cy.get("#email").type(email);
  cy.get("#password").type(password);
  cy.get("#password_confirmation").type(password);
  cy.get('button[type="submit"]').click();

  // Should land on the authenticated dashboard.
  cy.contains("Hi, E2E User", { timeout: 10000 }).should("be.visible");

  return cy.wrap({ email, password });
});

export {};
