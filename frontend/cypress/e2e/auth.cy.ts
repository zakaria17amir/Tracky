describe("Authentication", () => {
  it("registers a new user and lands on the dashboard", () => {
    cy.registerNewUser();
    cy.contains("Dashboard").should("be.visible");
  });

  it("logs out and back in", () => {
    cy.registerNewUser().then(({ email, password }) => {
      cy.contains("button", "Log out").click();
      cy.url().should("include", "/login");

      cy.get("#email").type(email);
      cy.get("#password").type(password);
      cy.get('button[type="submit"]').click();

      cy.contains("Hi, E2E User", { timeout: 10000 }).should("be.visible");
    });
  });

  it("blocks protected routes when unauthenticated", () => {
    cy.visit("/metrics");
    cy.url().should("include", "/login");
  });

  it("shows a validation error on bad login", () => {
    cy.visit("/login");
    cy.get("#email").type("nobody@example.com");
    cy.get("#password").type("wrongpassword");
    cy.get('button[type="submit"]').click();
    cy.contains(/unable to sign in|credentials/i).should("be.visible");
  });
});
