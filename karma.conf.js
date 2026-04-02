module.exports = function (config) {
  config.set({
    frameworks: ["jasmine"],
    files: [
      "spec/helpers/testBootstrap.js",
      "src/state.js",
      "src/storage.js",
      "src/utils.js",
      "src/sessionTracking.js",
      "src/services/corpusService.js",
      "src/services/modelService.js",
      "src/pages/welcomePage.js",
      "src/pages/consentPage.js",
      "src/pages/noConsentPage.js",
      "src/pages/instructionsPage.js",
      "src/pages/attentionCheckPage.js",
      "src/pages/taskReminderPage.js",
      "src/pages/taskPage.js",
      "src/pages/feedbackPage.js",
      "src/pages/endPage.js",
      "src/app.js",
      "src/init.js",
      "spec/helpers/domHelpers.js",
      "spec/**/*.spec.js"
    ],
    reporters: ["progress"],
    browsers: ["ChromeHeadlessNoSandbox"],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
      }
    },
    singleRun: true,
    autoWatch: false,
    client: {
      clearContext: false
    }
  });
};
