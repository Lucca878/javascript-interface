describe("attention check page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    app.showAttentionCheckPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders both attention-check questions", function () {
    const text = document.getElementById("app").textContent;

    expect(text).toContain("Comprehension");
    expect(text).toContain("In the model output, what do the label and confidence score mean?");
    expect(text).toContain("How many attempts do you have to modify the statement?");
  });

  it("requires both answers before continuing", function () {
    document.querySelector('input[name="q1"][value="C"]').checked = true;
    document.getElementById("attentionCheckNextButton").click();

    expect(document.getElementById("app").textContent).toContain("Please answer both attention-check questions");
    expect(storage.getCurrentScreen()).toBe("attentionCheck");
  });

  it("records answers and proceeds to task when both are selected", function () {
    spyOn(window, "recordAttentionCheck").and.callThrough();
    spyOn(app, "showTaskPage");

    document.querySelector('input[name="q1"][value="C"]').checked = true;
    document.querySelector('input[name="q2"][value="C"]').checked = true;
    document.getElementById("attentionCheckNextButton").click();

    expect(window.recordAttentionCheck).toHaveBeenCalled();
    expect(app.showTaskPage).toHaveBeenCalled();
  });
});
