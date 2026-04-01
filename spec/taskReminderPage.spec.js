describe("task reminder page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    app.showTaskReminderPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the reminder content", function () {
    const text = document.getElementById("app").textContent;

    expect(text).toContain("You are now about to start the main task.");
    expect(text).toContain("Please do not use any outside tools");
    expect(document.getElementById("taskReminderNextButton")).not.toBeNull();
  });

  it("continues to the main task when Next is clicked", function () {
    spyOn(app, "showTaskPage");

    document.getElementById("taskReminderNextButton").click();

    expect(app.showTaskPage).toHaveBeenCalled();
  });
});
