describe("app core", function () {
  beforeEach(function () {
    testHelpers.resetAppState();
    testHelpers.mountAppContainer();
  });

  afterEach(function () {
    testHelpers.clearTestRoot();
  });

  it("generates a fallback participant ID when none exists", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);

    app.initializeParticipantId();

    expect(state.participantId).toBeTruthy();
    expect(storage.getParticipantId()).toBe(state.participantId);
  });

  it("uses the Prolific ID when present", function () {
    spyOn(app, "getProlificIdFromUrl").and.returnValue("abc123");

    app.initializeParticipantId();

    expect(state.participantId).toBe("abc123");
    expect(storage.getParticipantId()).toBe("abc123");
  });

  it("reuses the stored participant ID when no Prolific ID exists", function () {
    storage.setParticipantId("stored-001");
    spyOn(app, "getProlificIdFromUrl").and.returnValue(null);

    app.initializeParticipantId();

    expect(state.participantId).toBe("stored-001");
  });
});