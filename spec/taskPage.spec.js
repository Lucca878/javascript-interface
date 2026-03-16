describe("task page", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
    state.taskSession = {
      statementId: "stmt-001",
      originalText: "I took the train to Rotterdam and met a friend by the river.",
      originalPrediction: { label: 1, labelStr: "truthful", confidence: 81.25 },
      attemptsUsed: 0,
      maxAttempts: 10,
      lastRewrite: "",
      draftText: "",
      latestPrediction: null,
      statusMessage: "",
      statusType: "info"
    };
    storage.setTaskSession(state.taskSession);
    app.showTaskPage();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("renders the main task page", function () {
    expect(document.getElementById("app").textContent).toContain("Main Task");
    expect(document.getElementById("taskSubmitButton")).not.toBeNull();
    expect(document.getElementById("app").textContent).toContain("Rotterdam");
  });

  it("shows a validation message when the rewrite is empty", function () {
    document.getElementById("taskRewriteInput").value = "   ";

    app.handleTaskSubmit();

    expect(document.getElementById("app").textContent).toContain("Please write a statement before submitting.");
  });

  it("shows a validation message when the rewrite is too long", function () {
    // Original has 13 words; this rewrite has 34 words (21 over the ±20 limit)
    document.getElementById("taskRewriteInput").value =
      "I took the train to Rotterdam and met a friend by the river and we walked along the waterfront and had coffee at a small café near the old docks with boats moored there.";

    app.handleTaskSubmit();

    expect(document.getElementById("app").textContent).toContain("+/- 20 words");
    expect(state.taskSession.attemptsUsed).toBe(0);
  });

  it("shows a validation message when the rewrite is too short", function () {
    // Set a 36-word original so a 4-word rewrite is 32 words shorter (beyond the ±20 limit)
    state.taskSession.originalText =
      "I took the train to Rotterdam and met a friend by the river and we walked along the waterfront and had coffee at a small café near the old docks with boats moored there right outside.";
    document.getElementById("taskRewriteInput").value = "I went to Rotterdam.";

    app.handleTaskSubmit();

    expect(document.getElementById("app").textContent).toContain("+/- 20 words");
    expect(state.taskSession.attemptsUsed).toBe(0);
  });

  it("records a rewrite attempt and shows model feedback", function () {
    document.getElementById("taskRewriteInput").value = "I took the train to Rotterdam and met a friend by the river, then we had coffee downtown.";

    app.handleTaskSubmit();

    expect(state.taskSession.attemptsUsed).toBe(1);
    expect(state.taskSession.latestPrediction).not.toBeNull();
    expect(document.getElementById("app").textContent).toContain("Latest rewrite feedback");
  });

  it("blocks submission and does not increment attempts when all attempts are used", function () {
    state.taskSession.attemptsUsed = 10;
    document.getElementById("taskRewriteInput").value = "I took the train to Rotterdam and met a friend by the river, then we had coffee downtown.";

    app.handleTaskSubmit();

    expect(document.getElementById("app").textContent).toContain("You have already used all available attempts");
    expect(state.taskSession.attemptsUsed).toBe(10);
  });

  it("shows a success message when the rewrite flips the model prediction", function () {
    // Original label is 1 (truthful); spy returns 0 (deceptive) to force a flip
    spyOn(modelService, "getPrediction").and.returnValue({ label: 0, labelStr: "deceptive", confidence: 72.5 });
    document.getElementById("taskRewriteInput").value = "I took the train to Rotterdam and met a friend by the river, then we had coffee downtown.";

    app.handleTaskSubmit();

    expect(state.taskSession.attemptsUsed).toBe(1);
    expect(document.getElementById("app").textContent).toContain("flipped");
  });

  it("shows an end-of-attempts message when the last attempt does not flip the prediction", function () {
    state.taskSession.attemptsUsed = 9;
    // Same label as original (1 = truthful) → no flip
    spyOn(modelService, "getPrediction").and.returnValue({ label: 1, labelStr: "truthful", confidence: 80.0 });
    document.getElementById("taskRewriteInput").value = "I took the train to Rotterdam and met a friend by the river, then we had coffee downtown.";

    app.handleTaskSubmit();

    expect(state.taskSession.attemptsUsed).toBe(10);
    expect(document.getElementById("app").textContent).toContain("maximum number of rewrites");
  });

  it("accepts a rewrite that is exactly 20 words longer than the original", function () {
    // Original: 13 words. This rewrite: 33 words. |33 - 13| = 20, which is NOT > 20 → should pass validation.
    document.getElementById("taskRewriteInput").value =
      "I took the train to Rotterdam and met a friend by the river, then we walked along the waterfront, had coffee at a small café, and talked about our plans for the evening.";

    app.handleTaskSubmit();

    // statusMessage should be empty (not the word-count warning) — the task goal panel always
    // shows "+/- 20 words" in its description, so we check state directly instead of page text.
    expect(state.taskSession.statusMessage).not.toContain("+/- 20 words");
    expect(state.taskSession.attemptsUsed).toBe(1);
  });

  it("prefills the textarea with an unsubmitted draft after re-rendering", function () {
    state.taskSession.draftText = "I took the train to Rotterdam and met an old friend there near the river.";

    app.showTaskPage();

    expect(document.getElementById("taskRewriteInput").value).toBe(
      "I took the train to Rotterdam and met an old friend there near the river."
    );
  });

  it("clears the textarea after a successful submission", function () {
    spyOn(modelService, "getPrediction").and.returnValue({ label: 1, labelStr: "truthful", confidence: 80.0 });
    document.getElementById("taskRewriteInput").value = "I took the train to Rotterdam and met a friend by the river, then we had coffee downtown.";

    app.handleTaskSubmit();

    expect(document.getElementById("taskRewriteInput").value).toBe("");
  });

  it("preserves the draft text in the textarea after a word-count validation failure", function () {
    // 34-word rewrite fails the ±20 guard; the textarea should still contain what the user typed
    const tooLong = "I took the train to Rotterdam and met a friend by the river and we walked along the waterfront and had coffee at a small café near the old docks with boats moored there.";
    document.getElementById("taskRewriteInput").value = tooLong;

    app.handleTaskSubmit();

    expect(document.getElementById("taskRewriteInput").value).toBe(tooLong);
    expect(state.taskSession.attemptsUsed).toBe(0);
  });

  it("scrolls to the top when the task page is rendered", function () {
    spyOn(utils, "scrollToTop");

    app.showTaskPage();

    expect(utils.scrollToTop).toHaveBeenCalled();
  });
});