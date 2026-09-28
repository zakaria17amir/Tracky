describe("Dashboards and widgets", () => {
  beforeEach(() => {
    cy.registerNewUser();
  });

  it("creates a dashboard, then adds a widget via the configurator", () => {
    // Need a metric first
    cy.visit("/metrics");
    cy.contains("button", "New Metric").click();
    cy.get("#metric-name").type("Steps");
    cy.get("#metric-unit").type("steps");
    cy.get('button[form="metric-form"]').click();
    cy.contains("td", "Steps").should("be.visible");

    // Create a dashboard
    cy.visit("/dashboards");
    cy.contains("button", "New Dashboard").click();
    cy.get("#dash-name").type("My Health");
    cy.get('button[form="dashboard-form"]').click();
    cy.contains("h3", "My Health").should("be.visible");

    // Open it and add a widget through the 3-step configurator
    cy.contains("h3", "My Health").click();
    cy.contains("button", "Add Widget").first().click();

    // Scope all configurator interactions to the modal dialog.
    cy.get('[role="dialog"]').within(() => {
      // Step 1: select metric
      cy.contains("Select Metric").should("be.visible");
      cy.contains("button", "Steps").click();

      // Step 2: choose chart type
      cy.contains("Choose Chart").should("be.visible");
      cy.contains("button", "Line Chart").click();

      // Step 3: configure + submit
      cy.contains("Configuration").should("be.visible");
      cy.contains("button", "Add Widget").click();
    });

    // The widget card appears on the dashboard
    cy.get('[data-testid="widget-card"]').should("have.length.at.least", 1);
    cy.contains('[data-testid="widget-card"]', "Steps").should("be.visible");
  });

  it("loads the whole dashboard body in one GraphQL request", () => {
    cy.intercept("POST", "/api/graphql").as("graph");
    cy.intercept("GET", "/api/metrics/*/entries*").as("perWidgetEntries");

    cy.window().then((win) => {
      const headers = { Authorization: `Bearer ${win.localStorage.getItem("tracky_token")}`, Accept: "application/json" };
      cy.request({ method: "POST", url: "/api/metrics", headers, body: { name: "Water", type: "numeric", unit: "l" } })
        .its("body.data.id")
        .then((metricId) =>
          cy
            .request({ method: "POST", url: "/api/dashboards", headers, body: { name: "Hydration" } })
            .its("body.data.id")
            .then((dashboardId) => {
              for (const chart_type of ["line", "stat"]) {
                cy.request({ method: "POST", url: `/api/dashboards/${dashboardId}/widgets`, headers, body: { metric_id: metricId, chart_type } });
              }
              cy.visit(`/?d=${dashboardId}`);
            }),
        );
    });

    cy.get('[data-testid="widget-card"]').should("have.length", 2);
    cy.get("@graph.all").should("have.length", 1);
    cy.get("@perWidgetEntries.all").should("have.length", 0);
  });
});
