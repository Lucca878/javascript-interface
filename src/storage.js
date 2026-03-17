window.storage = {
  PARTICIPANT_ID_KEY: "participantId",
  CURRENT_SCREEN_KEY: "currentScreen",
  TASK_SESSION_KEY: "taskSession",
  FEEDBACK_SESSION_KEY: "feedbackSession",
  FEEDBACK_SUBMISSION_KEY: "feedbackSubmission",

  getParticipantId() {
    const localValue = localStorage.getItem(this.PARTICIPANT_ID_KEY);

    if (localValue) {
      return localValue;
    }

    // Migrate legacy participant IDs that were stored in sessionStorage.
    const legacySessionValue = sessionStorage.getItem(this.PARTICIPANT_ID_KEY);

    if (legacySessionValue) {
      localStorage.setItem(this.PARTICIPANT_ID_KEY, legacySessionValue);
      return legacySessionValue;
    }

    return null;
  },

  setParticipantId(participantId) {
    localStorage.setItem(this.PARTICIPANT_ID_KEY, participantId);
  },

  getCurrentScreen() {
    return sessionStorage.getItem(this.CURRENT_SCREEN_KEY);
  },

  setCurrentScreen(screenName) {
    sessionStorage.setItem(this.CURRENT_SCREEN_KEY, screenName);
  },

  getTaskSession() {
    const storedValue = sessionStorage.getItem(this.TASK_SESSION_KEY);

    if (!storedValue) {
      return null;
    }

    return JSON.parse(storedValue);
  },

  setTaskSession(taskSession) {
    sessionStorage.setItem(this.TASK_SESSION_KEY, JSON.stringify(taskSession));
  },

  clearTaskSession() {
    sessionStorage.removeItem(this.TASK_SESSION_KEY);
  },

  getFeedbackSession() {
    const storedValue = sessionStorage.getItem(this.FEEDBACK_SESSION_KEY);

    if (!storedValue) {
      return null;
    }

    return JSON.parse(storedValue);
  },

  setFeedbackSession(feedbackSession) {
    sessionStorage.setItem(this.FEEDBACK_SESSION_KEY, JSON.stringify(feedbackSession));
  },

  clearFeedbackSession() {
    sessionStorage.removeItem(this.FEEDBACK_SESSION_KEY);
  },

  getFeedbackSubmission() {
    const storedValue = sessionStorage.getItem(this.FEEDBACK_SUBMISSION_KEY);

    if (!storedValue) {
      return null;
    }

    return JSON.parse(storedValue);
  },

  setFeedbackSubmission(payload) {
    sessionStorage.setItem(this.FEEDBACK_SUBMISSION_KEY, JSON.stringify(payload));
  },

  clearFeedbackSubmission() {
    sessionStorage.removeItem(this.FEEDBACK_SUBMISSION_KEY);
  }
};