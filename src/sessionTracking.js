/**
 * Session Tracking Helpers
 * Records timing and data events throughout the participant's session
 */

function persistSessionData() {
  if (window.storage && typeof window.storage.setSessionData === "function") {
    window.storage.setSessionData(state.sessionData);
  }
}
window.persistSessionData = persistSessionData;

// Record when a participant enters a page
window.recordPageEnter = function(pageName) {
  if (!state.sessionData.pages[pageName]) {
    state.sessionData.pages[pageName] = {
      enterTime: null,
      exitTime: null,
      duration: null
    };
  }
  const enterTimestamp = new Date().toISOString();
  state.sessionData.pages[pageName].enterTime = enterTimestamp;

  // Task timing baseline for rewrite duration tracking.
  if (pageName === "task") {
    state.sessionData.pages.task.currentAttemptStartedAt = enterTimestamp;
  }

  persistSessionData();

  console.log(`[Session] Entered ${pageName} at ${state.sessionData.pages[pageName].enterTime}`);
};

// Record when a participant exits a page (calculates duration)
window.recordPageExit = function(pageName) {
  if (!state.sessionData.pages[pageName]) {
    console.warn(`[Session] Page "${pageName}" not found in sessionData`);
    return;
  }
  
  const exitTime = new Date().toISOString();
  state.sessionData.pages[pageName].exitTime = exitTime;
  
  // Calculate duration in milliseconds
  const enterTime = new Date(state.sessionData.pages[pageName].enterTime);
  const exitTimeObj = new Date(exitTime);
  state.sessionData.pages[pageName].duration = exitTimeObj - enterTime;

  persistSessionData();
  
  console.log(`[Session] Exited ${pageName} at ${exitTime} (duration: ${state.sessionData.pages[pageName].duration}ms)`);
};

// Record a rewrite attempt with text, model prediction, and confidence
window.recordRewriteAttempt = function(rewriteText, label, confidence) {
  // Ensure task array exists
  if (!state.sessionData.pages.task.statements) {
    state.sessionData.pages.task.statements = [];
  }
  
  // Get the current statement being worked on (from taskSession)
  const currentStatement = state.taskSession;
  
  // Find or create the statement object
  let statementRecord = state.sessionData.pages.task.statements.find(
    s => s.statementId === currentStatement.statementId
  );
  
  if (!statementRecord) {
    statementRecord = {
      statementId: currentStatement.statementId,
      originalText: currentStatement.originalText,
      originalLabel: currentStatement.originalPrediction.label,
      originalConfidence: currentStatement.originalPrediction.confidence,
      attempts: []
    };
    state.sessionData.pages.task.statements.push(statementRecord);
  }
  
  // Add this attempt
  const submittedAt = new Date().toISOString();
  const rewriteStartedAt =
    state.sessionData.pages.task.currentAttemptStartedAt ||
    state.sessionData.pages.task.enterTime ||
    submittedAt;
  const rewriteDurationMs = Math.max(0, new Date(submittedAt) - new Date(rewriteStartedAt));

  const attemptNumber = statementRecord.attempts.length + 1;
  statementRecord.attempts.push({
    attemptNumber: attemptNumber,
    rewriteText: rewriteText,
    rewriteLabel: label,
    rewriteConfidence: confidence,
    rewriteStartedAt: rewriteStartedAt,
    rewriteSubmittedAt: submittedAt,
    rewriteDurationMs: rewriteDurationMs,
    timestamp: submittedAt
  });

  // The next rewrite starts timing from this submission moment.
  state.sessionData.pages.task.currentAttemptStartedAt = submittedAt;

  persistSessionData();
  
  console.log(`[Session] Recorded rewrite attempt ${attemptNumber} for statement ${currentStatement.statementId}`);
};

// Record feedback submission data
window.recordFeedback = function(formData) {
  state.sessionData.pages.feedback.formData = {
    difficulty: formData.difficulty,
    motivation: formData.motivation,
    strategies: formData.strategies,
    feedbackText: formData.feedbackText,
    timestamp: new Date().toISOString()
  };
  persistSessionData();
  console.log(`[Session] Recorded feedback submission`);
};

// Record session completion
window.recordSessionEnd = function() {
  state.sessionData.sessionEndTime = new Date().toISOString();
  
  // Calculate total duration
  const startTime = new Date(state.sessionData.sessionStartTime);
  const endTime = new Date(state.sessionData.sessionEndTime);
  state.sessionData.totalDuration = endTime - startTime;

  persistSessionData();
  
  console.log(`[Session] Session ended at ${state.sessionData.sessionEndTime} (total duration: ${state.sessionData.totalDuration}ms)`);
};

// Post the complete session data to backend
window.postSessionData = function() {
  console.log('[Session] Posting session data to backend...');
  console.log(JSON.stringify(state.sessionData, null, 2));
  
  return fetch('/api/participantData.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state.sessionData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('[Session] Session data posted successfully:', data);
      storage.clearSessionData();
      return data;
    })
    .catch(error => {
      console.error('[Session] Error posting session data:', error);
      throw error;
    });
};
