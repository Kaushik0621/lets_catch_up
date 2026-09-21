/* Calibrate MIN_SCORE against real questions.
   Run:  node worker/tune.mjs            (uses local data/kb.json)
   ON-TOPIC questions must pass the gate; OFF-TOPIC must fail it. */

import { readFile } from "node:fs/promises";
import { buildIndex, search } from "./src/retrieval.js";

const MIN_SCORE = Number(process.argv[2] || 2.2);
const MIN_COVERAGE = Number(process.argv[3] || 0.4);

const ONTOPIC = [
  "where does kaushik work now",
  "what did he do at aspect",
  "tell me about chumley",
  "what is his education",
  "did he do a masters",
  "what hackathons has he won",
  "what are his research interests",
  "how do I contact him",
  "is he available for work",
  "what programming languages does he know",
  "tell me about the EEG project",
  "has he worked in healthcare",
  "what does he know about RAG",
  "how many years of experience does he have",
  "what did he do before AI",
  "does he have experience with AWS",
  "what awards has he received",
  "tell me about his sustainability research",
  "what LLM agents has he built",
  "has he led a team",
];

const OFFTOPIC = [
  "what is the capital of france",
  "write me a poem about cats",
  "who won the world cup in 2022",
  "what is 2 + 2",
  "give me a recipe for pasta",
  "what do you think about donald trump",
  "how do I fix a flat tyre",
  "tell me a joke",
  "what is the meaning of life",
  "can you help me with my python homework",
  "what's the weather like today",
  "translate hello into spanish",
];

const kb = JSON.parse(await readFile(new URL("../data/kb.json", import.meta.url), "utf8"));
const index = buildIndex(kb);

function gate(q) {
  const r = search(index, q, 4);
  return { ...r, pass: r.top >= MIN_SCORE && r.coverage >= MIN_COVERAGE };
}

let falseNeg = 0, falsePos = 0;
console.log(`\ngate: top >= ${MIN_SCORE} AND coverage >= ${MIN_COVERAGE}\n`);
console.log("ON-TOPIC (should PASS)");
for (const q of ONTOPIC) {
  const r = gate(q);
  if (!r.pass) falseNeg++;
  console.log(
    `  ${r.pass ? "pass" : "FAIL"}  top=${r.top.toFixed(2).padStart(5)} cov=${r.coverage.toFixed(2)}  ${q}` +
    (r.hits[0] ? `   -> ${r.hits[0].chunk.id}` : "")
  );
}
console.log("\nOFF-TOPIC (should FAIL)");
for (const q of OFFTOPIC) {
  const r = gate(q);
  if (r.pass) falsePos++;
  console.log(
    `  ${r.pass ? "LEAK" : "fail"}  top=${r.top.toFixed(2).padStart(5)} cov=${r.coverage.toFixed(2)}  ${q}` +
    (r.pass && r.hits[0] ? `   -> ${r.hits[0].chunk.id}` : "")
  );
}
console.log(`\nmissed on-topic: ${falseNeg}/${ONTOPIC.length}   leaked off-topic: ${falsePos}/${OFFTOPIC.length}\n`);
