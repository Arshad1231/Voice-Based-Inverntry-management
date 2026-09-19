// ============================================================
// MIXED-LANGUAGE VOICE NORMALIZER
// ============================================================
//
// Converts common Telugu-English / Hinglish-style phrases
// into simple English phrases that the existing command parser
// can understand.
//
// Example:
//
// "Anna 5 bags rice add cheyyi"
//              ↓
// "5 bags rice add"
//
// "Rice entha undi"
//              ↓
// "check rice"
// ============================================================


// ============================================================
// ADD PHRASES
// ============================================================

const ADD_PHRASES = [
  "add cheyyi",
  "add chey",
  "add cheyyandi",
  "add cheyandi",
  "add cheyyara",
  "add cheyara",

  "pettu",
  "petti",
  "pettandi",

  "kalupu",
  "kalapandi",

  "vesey",
  "vesi",
];


// ============================================================
// REMOVE PHRASES
// ============================================================

const REMOVE_PHRASES = [
  "remove cheyyi",
  "remove chey",
  "remove cheyyandi",
  "remove cheyandi",

  "teesey",
  "teesei",
  "teesuko",
  "teesukondi",

  "tagginchu",
  "tagginchandi",
];


// ============================================================
// CHECK / STOCK PHRASES
// ============================================================

const CHECK_PHRASES = [
  "entha undi",
  "entha undhi",

  "entha undi",
  "entha stock undi",
  "stock entha undi",
  "stock entha undhi",

  "enni unnayi",
  "enni unnai",
  "enni unnayi",
  "enni unnai",

  "entha undho",
  "entha stock",
];


// ============================================================
// COMMON FILLER PHRASES
// ============================================================

const FILLER_PHRASES = [
  "anna",
  "akka",
  "bro",
  "brother",
  "sir",
  "madam",

  "please",
  "plz",

  "lo",
  "lona",

  "na",
  "naa",

  "inka",
  "kuda",
];


// ============================================================
// NORMALIZE BASIC TEXT
// ============================================================

const cleanText = (text) => {
  return text
    .toLowerCase()
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};


// ============================================================
// REPLACE PHRASES
// ============================================================

const replacePhrases = (
  text,
  phrases,
  replacement
) => {
  let result = text;

  // Longer phrases first
  const sortedPhrases = [...phrases].sort(
    (a, b) => b.length - a.length
  );

  for (const phrase of sortedPhrases) {
    const escapedPhrase = phrase.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(
      `\\b${escapedPhrase}\\b`,
      "gi"
    );

    result = result.replace(
      regex,
      ` ${replacement} `
    );
  }

  return result;
};


// ============================================================
// REMOVE FILLERS
// ============================================================

const removeFillers = (text) => {
  let result = text;

  const sortedPhrases = [...FILLER_PHRASES].sort(
    (a, b) => b.length - a.length
  );

  for (const phrase of sortedPhrases) {
    const escapedPhrase = phrase.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(
      `\\b${escapedPhrase}\\b`,
      "gi"
    );

    result = result.replace(regex, " ");
  }

  return result;
};


// ============================================================
// MAIN NORMALIZER
// ============================================================

export const normalizeVoiceCommand = (text) => {
  if (!text || !text.trim()) {
    return "";
  }

  let normalized = cleanText(text);

  // ----------------------------------------------------------
  // CHECK COMMANDS
  // ----------------------------------------------------------

  normalized = replacePhrases(
    normalized,
    CHECK_PHRASES,
    "check"
  );

  // ----------------------------------------------------------
  // ADD COMMANDS
  // ----------------------------------------------------------

  normalized = replacePhrases(
    normalized,
    ADD_PHRASES,
    "add"
  );

  // ----------------------------------------------------------
  // REMOVE COMMANDS
  // ----------------------------------------------------------

  normalized = replacePhrases(
    normalized,
    REMOVE_PHRASES,
    "remove"
  );

  // ----------------------------------------------------------
  // REMOVE COMMON FILLERS
  // ----------------------------------------------------------

  normalized = removeFillers(normalized);

  // ----------------------------------------------------------
  // CLEAN SPACING
  // ----------------------------------------------------------

  normalized = normalized
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
};