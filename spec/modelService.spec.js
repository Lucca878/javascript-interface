describe("model service", function () {
  let originalFetch;
  let originalAppConfig;

  beforeEach(function () {
    originalFetch = window.fetch;
    originalAppConfig = window.APP_CONFIG;
  });

  afterEach(function () {
    window.fetch = originalFetch;
    window.APP_CONFIG = originalAppConfig;
  });

  it("falls back to sync prediction when no API endpoint is configured", async function () {
    window.APP_CONFIG = {};
    spyOn(modelService, "getPredictionSync").and.returnValue({
      label: 1,
      labelStr: "truthful",
      confidence: 88.8
    });

    const result = await modelService.getPrediction("test sentence");

    expect(modelService.getPredictionSync).toHaveBeenCalledWith("test sentence");
    expect(result.label).toBe(1);
    expect(result.labelStr).toBe("truthful");
    expect(result.confidence).toBe(88.8);
  });

  it("uses active backend endpoint when modelApiBackends is configured", function () {
    window.APP_CONFIG = {
      modelApiEndpoint: "https://legacy.example.com/predict",
      modelApiBackends: {
        gcloud: "https://gcloud.example.com/predict",
        hetzner: "https://hetzner.example.com/predict"
      },
      activeModelBackend: "hetzner"
    };

    expect(modelService.getApiEndpoint()).toBe("https://hetzner.example.com/predict");
  });

  it("falls back to legacy modelApiEndpoint when active backend endpoint is missing", function () {
    window.APP_CONFIG = {
      modelApiEndpoint: "https://legacy.example.com/predict",
      modelApiBackends: {
        gcloud: "https://gcloud.example.com/predict",
        hetzner: ""
      },
      activeModelBackend: "hetzner"
    };

    expect(modelService.getApiEndpoint()).toBe("https://legacy.example.com/predict");
  });

  it("throws when backend response shape is invalid", async function () {
    window.APP_CONFIG = { modelApiEndpoint: "http://127.0.0.1:8080/predict" };
    spyOn(window, "fetch").and.returnValue(
      Promise.resolve({
        ok: true,
        json: function () {
          return Promise.resolve({ foo: "bar" });
        }
      })
    );

    let thrown;

    try {
      await modelService.getPrediction("test sentence");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(thrown.message).toContain("Invalid prediction response shape");
  });
});
