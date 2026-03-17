describe("feedback page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    state.participantId = "pid-123";
    app.showFeedbackPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the feedback page", function () {
    expect(document.getElementById("app").textContent).toContain("Feedback");
    expect(document.getElementById("motivationScaleInput")).not.toBeNull();
    expect(document.getElementById("difficultyScaleInput")).not.toBeNull();
    expect(document.getElementById("strategiesInput")).not.toBeNull();
    expect(document.getElementById("submitFeedbackButton")).not.toBeNull();
  });

  it("shows validation warning when required strategies input is empty", function () {
    document.getElementById("strategiesInput").value = "   ";

    app.handleFeedbackSubmit();

    expect(document.getElementById("app").textContent).toContain("Please answer all required questions");
  });

  it("accepts strategies when the trimmed value is not empty", function () {
    document.getElementById("motivationScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("difficultyScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("strategiesInput").value = "   clear strategy with spaces   ";

    app.handleFeedbackSubmit();

    expect(document.getElementById("app").textContent).toContain("Thank you for your feedback.");
    expect(state.feedbackSubmission.strategies).toBe("   clear strategy with spaces   ");
  });

  it("allows optional feedback to remain empty", function () {
    document.getElementById("motivationScaleInput").value = "7";
    document.getElementById("motivationScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("difficultyScaleInput").value = "3";
    document.getElementById("difficultyScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("strategiesInput").value = "I preserved meaning and adjusted style cues.";
    document.getElementById("feedbackInput").value = "";

    app.handleFeedbackSubmit();

    expect(document.getElementById("app").textContent).toContain("Thank you for your feedback.");
    expect(state.feedbackSubmission.feedback).toBe("");
  });

  it("updates slider labels and feedback session values on input", function () {
    const motivationInput = document.getElementById("motivationScaleInput");
    const difficultyInput = document.getElementById("difficultyScaleInput");

    motivationInput.value = "8";
    motivationInput.dispatchEvent(new Event("input"));

    difficultyInput.value = "2";
    difficultyInput.dispatchEvent(new Event("input"));

    expect(document.getElementById("motivationScaleValue").textContent).toBe("8");
    expect(document.getElementById("difficultyScaleValue").textContent).toBe("2");
    expect(state.feedbackSession.motivationScale).toBe(8);
    expect(state.feedbackSession.difficultyScale).toBe(2);
  });

  it("restores feedback values after re-rendering the page", function () {
    document.getElementById("motivationScaleInput").value = "6";
    document.getElementById("motivationScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("difficultyScaleInput").value = "9";
    document.getElementById("difficultyScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("strategiesInput").value = "I changed lexical choices and kept semantics fixed.";
    document.getElementById("strategiesInput").dispatchEvent(new Event("input"));
    document.getElementById("feedbackInput").value = "Useful task.";
    document.getElementById("feedbackInput").dispatchEvent(new Event("input"));

    app.showFeedbackPage();

    expect(document.getElementById("motivationScaleInput").value).toBe("6");
    expect(document.getElementById("difficultyScaleInput").value).toBe("9");
    expect(document.getElementById("strategiesInput").value).toBe("I changed lexical choices and kept semantics fixed.");
    expect(document.getElementById("feedbackInput").value).toBe("Useful task.");
  });

  it("stores feedback submission payload on valid submit", function () {
    document.getElementById("motivationScaleInput").value = "9";
    document.getElementById("motivationScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("difficultyScaleInput").value = "4";
    document.getElementById("difficultyScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("strategiesInput").value = "I changed wording and sentence rhythm while preserving meaning.";
    document.getElementById("feedbackInput").value = "Good interface.";

    app.handleFeedbackSubmit();

    expect(document.getElementById("app").textContent).toContain("Thank you for your feedback.");
    expect(state.feedbackSession.submitted).toBeTrue();
    expect(state.feedbackSubmission.pid).toBe("pid-123");
    expect(state.feedbackSubmission.motivation_scale).toBe(9);
    expect(state.feedbackSubmission.difficulty_scale).toBe(4);
    expect(state.feedbackSubmission.strategies).toContain("sentence rhythm");

    const storedPayload = storage.getFeedbackSubmission();
    expect(storedPayload).not.toBeNull();
    expect(storedPayload.pid).toBe("pid-123");
  });

  it("shows a warning when sliders are not touched even if strategies are filled", function () {
    document.getElementById("strategiesInput").value = "I rewrote syntax and lexical cues.";

    app.handleFeedbackSubmit();

    expect(document.getElementById("app").textContent).toContain("Please answer all required questions");
    expect(state.feedbackSubmission).toBeNull();
  });

  it("accepts slider value 5 when user explicitly confirms it", function () {
    document.getElementById("motivationScaleInput").value = "5";
    document.getElementById("motivationScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("difficultyScaleInput").value = "5";
    document.getElementById("difficultyScaleInput").dispatchEvent(new Event("input"));
    document.getElementById("strategiesInput").value = "I preserved content and changed style markers.";

    app.handleFeedbackSubmit();

    expect(document.getElementById("app").textContent).toContain("Thank you for your feedback.");
    expect(state.feedbackSubmission.motivation_scale).toBe(5);
    expect(state.feedbackSubmission.difficulty_scale).toBe(5);
  });
});
