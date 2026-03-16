window.storage = {
  PARTICIPANT_ID_KEY: "participantId",
  CURRENT_SCREEN_KEY: "currentScreen",
  TASK_SESSION_KEY: "taskSession",

  getParticipantId() {
    return sessionStorage.getItem(this.PARTICIPANT_ID_KEY);
  },

  setParticipantId(participantId) {
    sessionStorage.setItem(this.PARTICIPANT_ID_KEY, participantId);
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
  }
};