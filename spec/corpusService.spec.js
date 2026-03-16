describe("corpus service", function () {
  beforeEach(function () {
    corpusService.corpus = null;
    corpusService.loadPromise = null;
    corpusService.phpEndpoint = "api/statements.php";
  });

  afterEach(function () {
    corpusService.corpus = null;
    corpusService.loadPromise = null;
    corpusService.phpEndpoint = "api/statements.php";
  });

  it("loads statements returned by loadCorpusFromPhp", function (done) {
    spyOn(corpusService, "loadCorpusFromPhp").and.returnValue(
      Promise.resolve([{ index: "11", text_truncated: "Loaded from endpoint." }])
    );

    corpusService.preloadCorpus().then(function (rows) {
      expect(rows.length).toBe(1);
      expect(rows[0].index).toBe("11");
      expect(rows[0].text_truncated).toContain("Loaded from endpoint");
      done();
    });
  });

  it("parses CSV text into statement rows", function () {
    const rows = corpusService.parseCsvToStatements(`index,text_truncated
21,First CSV row
22,Second CSV row`);

    expect(rows.length).toBe(2);
    expect(rows[0].index).toBe("21");
    expect(rows[1].text_truncated).toBe("Second CSV row");
  });

  it("falls back to placeholder corpus when load fails", function (done) {
    spyOn(corpusService, "loadCorpusFromPhp").and.returnValue(Promise.reject(new Error("network down")));
    spyOn(console, "warn");

    corpusService.preloadCorpus().then(function (rows) {
      expect(rows).toBe(corpusService.placeholderCorpus);
      expect(console.warn).toHaveBeenCalled();
      done();
    });
  });

  it("uses loaded corpus in getRandomStatement", function () {
    corpusService.corpus = [{ index: "77", text_truncated: "Only loaded row" }];

    const statement = corpusService.getRandomStatement();

    expect(statement.index).toBe("77");
    expect(statement.text_truncated).toBe("Only loaded row");
  });
});
