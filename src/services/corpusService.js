window.corpusService = {
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

  getRandomStatement() {
    const index = Math.floor(Math.random() * this.placeholderCorpus.length);
    return this.placeholderCorpus[index];
  }
};