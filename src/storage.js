window.storage = {
  PARTICIPANT_ID_KEY: "participantId",
  CURRENT_SCREEN_KEY: "currentScreen",

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
  }
};