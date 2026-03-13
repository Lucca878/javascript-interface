describe("consent page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    app.showConsentPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the informed consent page", function () {
    expect(document.getElementById("app").textContent).toContain("Informed Consent");
    expect(document.getElementById("acceptButton")).not.toBeNull();
    expect(document.getElementById("denyButton")).not.toBeNull();
  });

  it("sets consentData to Accepted and opens the instructions page when Accept is clicked", function () {
    document.getElementById("acceptButton").click();

    expect(state.consentData).toBe("Accepted");
    expect(document.getElementById("app").textContent).toContain("Instructions");
    expect(document.getElementById("instructionsNextButton")).not.toBeNull();
  });

  it("sets consentData to Denied when Deny is clicked", function () {
    document.getElementById("denyButton").click();

    expect(state.consentData).toBe("Denied");
  });
  it("scrolls to the top when the consent page is rendered", function () {
    spyOn(utils, "scrollToTop");

    app.showConsentPage();

    expect(utils.scrollToTop).toHaveBeenCalled();
  });
});