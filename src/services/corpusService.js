window.corpusService = {
  phpEndpoint: "api/statements.php",
  corpus: null,
  loadPromise: null,
  corpusSource: "placeholder",

  placeholderCorpus: [
    {
      index: 1,
      text_truncated: "Last summer I took the train to Rotterdam, met a friend near the station, and we spent the afternoon eating sandwiches by the river before heading home."
    },
    {
      index: 2,
      text_truncated: "I remember arriving late to the family dinner because my bike tire went flat on the way, so I had to stop and walk the rest of the distance."
    },
    {
      index: 3,
      text_truncated: "A few years ago I visited a small museum on a rainy day, bought a postcard in the gift shop, and later had coffee in a quiet cafe nearby."
    },
    {
      index: 4,
      text_truncated: "I told my colleague I had already submitted the report that morning, even though I was still revising the final section and had not sent it yet."
    }
  ],

  setPhpEndpoint(endpoint) {
    if (typeof endpoint === "string" && endpoint.trim()) {
      this.phpEndpoint = endpoint.trim();
    }
  },

  normalizeStatement(raw) {
    if (!raw) {
      return null;
    }

    const indexValue = raw.index ?? raw.id;
    const textValue = raw.text_truncated ?? raw.text;

    if (indexValue === undefined || !textValue) {
      return null;
    }

    return {
      index: String(indexValue),
      text_truncated: String(textValue).trim()
    };
  },

  parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const character = line[i];

      if (character === '"') {
        const escapedQuote = inQuotes && line[i + 1] === '"';

        if (escapedQuote) {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }

        continue;
      }

      if (character === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += character;
      }
    }

    values.push(current.trim());
    return values;
  },

  parseCsvToStatements(csvText) {
    const lines = String(csvText)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
    const indexColumn = headers.indexOf("index");
    const textColumn = headers.indexOf("text_truncated");

    if (indexColumn === -1 || textColumn === -1) {
      return [];
    }

    const statements = [];

    for (let i = 1; i < lines.length; i += 1) {
      const rowValues = this.parseCsvLine(lines[i]);
      const statement = this.normalizeStatement({
        index: rowValues[indexColumn],
        text_truncated: rowValues[textColumn]
      });

      if (statement) {
        statements.push(statement);
      }
    }

    return statements;
  },

  async loadCorpusFromPhp() {
    if (typeof fetch !== "function") {
      return [];
    }

    const response = await fetch(this.phpEndpoint, {
      method: "GET",
      headers: {
        Accept: "application/json, text/csv, text/plain"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load statements from ${this.phpEndpoint} (${response.status})`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : payload?.data;

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map((row) => this.normalizeStatement(row)).filter(Boolean);
    }

    const csvText = await response.text();
    return this.parseCsvToStatements(csvText);
  },

  preloadCorpus() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadCorpusFromPhp()
      .then((statements) => {
        if (Array.isArray(statements) && statements.length > 0) {
          this.corpus = statements;
          this.corpusSource = "php";
          return statements;
        }

        this.corpus = this.placeholderCorpus;
        this.corpusSource = "placeholder";
        return this.placeholderCorpus;
      })
      .catch((error) => {
        this.corpus = this.placeholderCorpus;
        this.corpusSource = "placeholder";
        console.warn("Falling back to placeholder corpus:", error.message || error);
        return this.placeholderCorpus;
      });

    return this.loadPromise;
  },

  getActiveCorpus() {
    if (Array.isArray(this.corpus) && this.corpus.length > 0) {
      return this.corpus;
    }

    return this.placeholderCorpus;
  },

  getRandomStatement() {
    const activeCorpus = this.getActiveCorpus();
    const index = Math.floor(Math.random() * activeCorpus.length);
    return activeCorpus[index];
  }
};