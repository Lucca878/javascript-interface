window.modelService = {
  getPrediction(text) {
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
  }
};