describe("instructions page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    app.showInstructionsPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the instructions page", function () {
    expect(document.getElementById("app").textContent).toContain("Instructions");
    expect(document.getElementById("instructionsNextButton")).not.toBeNull();
  });

  it("shows the attempt limit in the instructions text", function () {
    expect(document.getElementById("app").textContent).toContain("10");
  });

  it("shows a placeholder message when Next is clicked", function () {
    document.getElementById("instructionsNextButton").click();

    expect(document.getElementById("messageBox").textContent).toContain("task page");
  });
  it("scrolls to the top when the instructions page is rendered", function () {
    spyOn(utils, "scrollToTop");

    app.showInstructionsPage();

    expect(utils.scrollToTop).toHaveBeenCalled();
  });
});