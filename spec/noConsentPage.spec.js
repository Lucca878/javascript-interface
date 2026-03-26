describe("no consent page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    app.showNoConsentPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the separate no-consent exit page", function () {
    expect(document.getElementById("app").textContent).toContain("Study Ended");
    expect(document.getElementById("app").textContent).toContain("You did not provide consent");
    expect(document.getElementById("app").textContent).toContain("responses will not be submitted");
  });

  it("scrolls to the top when the no-consent page is rendered", function () {
    spyOn(utils, "scrollToTop");

    app.showNoConsentPage();

    expect(utils.scrollToTop).toHaveBeenCalled();
  });
});