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
    expect(text).toContain("What To Do");
    expect(text).toContain("What Not To Do");
    expect(text).toContain("No outside tools:");
    expect(text).toContain("Key facts and events must remain recognizable");
    expect(document.getElementById("taskReminderNextButton")).not.toBeNull();
  });

  it("continues to the main task when Next is clicked", function () {
    spyOn(app, "showTaskPage");

    document.getElementById("taskReminderNextButton").click();

    expect(app.showTaskPage).toHaveBeenCalled();
  });
});
