describe("Metrics and logging", () => {
  beforeEach(() => {
    cy.registerNewUser();
  });

  it("creates a numeric metric and logs a value for it", () => {
    // Create a metric
    cy.visit("/metrics");
    cy.contains("button", "New Metric").click();
    cy.get("#metric-name").type("Sleep Hours");
    cy.get("#metric-unit").type("hours");
    cy.get('button[form="metric-form"]').click();

    cy.contains("td", "Sleep Hours").should("be.visible");

    // Log a value via Quick Log
    cy.visit("/log");
    cy.contains(".rounded-lg", "Sleep Hours").within(() => {
      cy.get('input[type="number"]').type("7.5");
      cy.contains("button", "Save").click();
    });
    cy.contains(/Saved/i).should("be.visible");

    // History reflects the entry
    cy.visit("/metrics");
    cy.contains("td", "Sleep Hours")
      .parent()
      .within(() => cy.contains("a, button", "History").click());
    cy.contains("td", "7.5").should("be.visible");
  });

  it("creates a boolean metric and toggles it on the log page", () => {
    cy.visit("/metrics");
    cy.contains("button", "New Metric").click();
    cy.get("#metric-name").type("Exercise");
    cy.get("#metric-type").select("boolean");
    cy.get('button[form="metric-form"]').click();
    cy.contains("td", "Exercise").should("be.visible");

    cy.visit("/log");
    cy.contains(".rounded-lg", "Exercise").within(() => {
      cy.contains("button", "YES").click();
      cy.contains("button", "Save").click();
    });
    cy.contains(/Saved/i).should("be.visible");
  });
});
