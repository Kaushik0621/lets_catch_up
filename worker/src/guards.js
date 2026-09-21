/* ============================================================
   Input guards. Everything here runs before a single token is
   spent, so a bad request costs nothing.
   ============================================================ */

export const MAX_QUESTION_CHARS = 320;
export const MAX_HISTORY_TURNS = 6;

// Attempts to rewrite the bot's instructions or extract them.
const INJECTION = [
  /ignore\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier|system)\s+(instruction|prompt|rule|message)/i,
  /disregard\s+(all\s+|any\s+|the\s+)?(previous|prior|above|your)\s+/i,
  /you\s+are\s+now\s+(a|an|no longer)\b/i,
  /\b(act|behave|pretend|roleplay)\s+as\s+(if\s+you\s+are\s+)?(a|an|my)\b/i,
  /\b(system|developer)\s*(prompt|message|instruction)s?\b/i,
  /(reveal|repeat|print|show|output|reproduce|what are)\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instruction|rule|context|config)/i,
  /\bdeveloper\s+mode\b|\bDAN\b|\bjailbreak\b/i,
  /<\/?(system|assistant|user|instructions?)>/i,
  /\bapi[_\s-]?key\b|\btoken\b.*\bsecret\b/i,
  /forget\s+(everything|all|your\s+instruction)/i,
];

// Things the site does not publish. Asking is fine; guessing is not.
const PRIVATE = [
  /\b(home|residential|postal|street)\s*address\b|\bwhere\s+does\s+he\s+live\b|\bwhich\s+(street|flat|postcode)\b/i,
  /\b(phone|mobile|cell|whatsapp)\s*(number|no\.?)\b/i,
  /\b(salary|pay|compensation|day\s*rate|how\s+much\s+does\s+he\s+(earn|make)|net\s+worth|income)\b/i,
  /\b(passport|visa\s+status|national\s+insurance|nhs\s+number|date\s+of\s+birth|dob|how\s+old\s+is\s+he|age)\b/i,
  /\b(girlfriend|wife|partner|married|relationship|dating|family|religion|politic|vote[ds]?\s+for)\b/i,
  /\b(medical|health\s+condition|mental\s+health)\b.*\b(he|his|kaushik)\b/i,
];

export function checkInput(question) {
  const q = String(question || "").trim();

  if (!q) return { ok: false, kind: "empty" };
  if (q.length > MAX_QUESTION_CHARS) return { ok: false, kind: "too_long" };
  // A wall of repeated characters is either a paste accident or an attempt to
  // push the system prompt out of attention. Neither deserves a model call.
  if (/(.)\1{30,}/.test(q)) return { ok: false, kind: "spam" };

  for (const re of INJECTION) if (re.test(q)) return { ok: false, kind: "injection" };
  for (const re of PRIVATE) if (re.test(q)) return { ok: false, kind: "private" };

  return { ok: true, question: q };
}

export function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_TURNS)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_QUESTION_CHARS) }));
}

export function pickDeflection(kb, seed) {
  const list = kb.deflections || ["I only answer questions about Kaushik Das."];
  return list[Math.abs(seed) % list.length];
}

// Stable-ish seed so the same off-topic question gets the same quip within a
// session, instead of the bot looking like it is rolling dice.
export function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
