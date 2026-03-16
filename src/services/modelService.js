window.modelService = {
  getPredictionSync(text) {
    const normalizedText = text.trim().toLowerCase();
    const hash = Array.from(normalizedText).reduce((total, character, index) => {
      return total + character.charCodeAt(0) * (index + 1);
    }, 0);
    const truthful = 45 + (hash % 46);
    const label = truthful >= 50 ? 1 : 0;

    return {
      label,
      labelStr: label === 1 ? "truthful" : "deceptive",
      confidence: label === 1 ? truthful : 100 - truthful
    };
  },

  getApiEndpoint() {
    const configured = window.APP_CONFIG && window.APP_CONFIG.modelApiEndpoint;
    if (configured && String(configured).trim()) {
      return String(configured).trim();
    }

    return "";
  },

  async getPrediction(text, metadata = {}) {
    const endpoint = this.getApiEndpoint();

    if (!endpoint) {
      return this.getPredictionSync(text);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        participant_id: metadata.participantId || null,
        statement_index: metadata.statementIndex || null,
        request_id: metadata.requestId || null
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload && payload.error && payload.error.message
        ? payload.error.message
        : "Model prediction failed.";
      throw new Error(message);
    }

    if (
      typeof payload.label !== "number" ||
      typeof payload.labelStr !== "string" ||
      typeof payload.confidence !== "number"
    ) {
      throw new Error("Invalid prediction response shape from backend.");
    }

    return {
      label: payload.label,
      labelStr: payload.labelStr,
      confidence: payload.confidence
    };
  }
};