/* ============================================================
   BM25 retrieval over the site knowledge base.
   Shared by the Worker and by tune.mjs so the scores you
   calibrate against locally are the scores that run in prod.
   ============================================================ */

const STOP = new Set([
  "a","about","all","am","an","and","any","are","as","at","be","been","but","by","can","could","did","do","does",
  "for","from","get","had","has","have","he","her","him","his","how","i","if","in","into","is","it","its","just",
  "me","much","my","of","on","or","our","out","she","should","so","some","tell","than","that","the","their","them",
  "then","there","these","they","this","those","to","up","us","was","we","were","what","when","where","which","who",
  "whom","why","will","with","would","you","your","s","t"
]);

// Light suffix stripping: enough to match plural/gerund forms without a stemmer dependency.
function stem(w) {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text) {
  const raw = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, " ")
    .split(/\s+/);
  const out = [];
  for (const w of raw) {
    const t = w.replace(/^[.\-]+|[.\-]+$/g, "");
    if (!t || t.length < 2 || STOP.has(t)) continue;
    out.push(stem(t));
  }
  return out;
}

const K1 = 1.5;
const B = 0.75;

export function buildIndex(kb) {
  const docs = kb.chunks.map((c) => {
    // Title and tags are the human-written handles for a chunk, so they count
    // three times. Without this, a long body outranks an exact tag match.
    const terms = tokenize(
      [c.title, c.title, c.title, (c.tags || []).join(" "), (c.tags || []).join(" "), (c.tags || []).join(" "), c.text].join(" ")
    );
    const tf = new Map();
    for (const t of terms) tf.set(t, (tf.get(t) || 0) + 1);
    return { chunk: c, tf, len: terms.length };
  });

  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);

  const avgLen = docs.reduce((s, d) => s + d.len, 0) / (docs.length || 1);
  return { docs, df, avgLen, N: docs.length, vocab: new Set(df.keys()) };
}

export function search(index, query, topK = 4) {
  const qTerms = tokenize(query);
  if (!qTerms.length) return { hits: [], top: 0, coverage: 0, qTerms };

  const scored = index.docs.map((d) => {
    let score = 0;
    for (const t of qTerms) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = index.df.get(t) || 0;
      const idf = Math.log(1 + (index.N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + B * (d.len / index.avgLen))));
    }
    return { chunk: d.chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const hits = scored.filter((s) => s.score > 0).slice(0, topK);

  // Coverage: how much of the question the knowledge base even has words for.
  // This is what catches "who won the world cup" — high-IDF nonsense scores
  // near zero, but coverage names the problem directly.
  const known = qTerms.filter((t) => index.vocab.has(t)).length;

  return {
    hits,
    top: hits.length ? hits[0].score : 0,
    coverage: known / qTerms.length,
    qTerms,
  };
}
