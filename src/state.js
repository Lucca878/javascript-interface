// UUID v4 generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Extract prolificId from URL params
function getProlificId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('PROLIFIC_ID') || 'unknown';
}

window.state = {
  participantId: null,
  consentData: null,
  taskSession: null,
  feedbackSession: null,
  feedbackSubmission: null,
  
  // Session-wide data for comprehensive tracking
  sessionData: {
    sessionId: generateUUID(),
    prolificId: getProlificId(),
    sessionStartTime: new Date().toISOString(),
    sessionEndTime: null,
    pages: {
      consent: { enterTime: null, exitTime: null, duration: null, decision: null },
      instructions: { enterTime: null, exitTime: null, duration: null },
      task: { enterTime: null, exitTime: null, duration: null, currentAttemptStartedAt: null, statements: [] },
      feedback: { enterTime: null, exitTime: null, duration: null, formData: null },
      end: { enterTime: null, exitTime: null, duration: null }
    },
    totalDuration: null
  }
};