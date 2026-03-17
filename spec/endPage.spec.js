describe("end page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    app.showEndPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the end of study page", function () {
    expect(document.getElementById("app").textContent).toContain("End of Study");
    expect(document.getElementById("app").textContent).toContain("Thank you for participating in our study");
  });

  it("displays the debriefing section", function () {
    expect(document.getElementById("app").textContent).toContain("Debriefing");
    expect(document.getElementById("app").textContent).toContain("This study investigated how humans (you) modify statements");
    expect(document.getElementById("app").textContent).toContain("We will compare these human modifications");
    expect(document.getElementById("app").textContent).toContain("Thank you for your valuable contribution");
  });

  it("displays the Prolific redirect button with correct URL", function () {
    const prolificButton = Array.from(document.querySelectorAll("a")).find(
      (link) => link.textContent.trim() === "Return to Prolific"
    );

    expect(prolificButton).not.toBeNull();
    expect(prolificButton.href).toContain("https://app.prolific.com/submissions/complete?cc=CPSXYUWC");
    expect(prolificButton.target).toBe("_blank");
  });

  it("displays a backup Prolific link", function () {
    const backupLink = Array.from(document.querySelectorAll("a")).find(
      (link) => link.textContent.toLowerCase().includes("click here") && link.href.includes("prolific.com")
    );

    expect(backupLink).not.toBeNull();
    expect(backupLink.href).toContain("https://app.prolific.com/submissions/complete?cc=CPSXYUWC");
  });

  it("stores the current screen as 'end' when rendered", function () {
    const currentScreen = storage.getCurrentScreen();

    expect(currentScreen).toBe("end");
  });

  it("scrolls to the top when the end page is rendered", function () {
    spyOn(utils, "scrollToTop");

    app.showEndPage();

    expect(utils.scrollToTop).toHaveBeenCalled();
  });

  it("can be restored from storage", function () {
    storage.setCurrentScreen("end");

    app.restoreScreen();

    expect(document.getElementById("app").textContent).toContain("End of Study");
  });
});
