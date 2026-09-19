const ADD_ACTIONS = [
  "add",
  "increase",
  "put",
  "stock",
];

const REMOVE_ACTIONS = [
  "remove",
  "decrease",
  "take",
  "sell",
  "sold",
];

const CHECK_PHRASES = [
  "how much",
  "how many",
  "how much do we have",
  "how much is there",
  "how many are there",
  "what is the stock",
  "what's the stock",
  "whats the stock",
  "stock of",
  "stock for",
  "check stock",
  "check",
  "show stock",
  "show me",
  "show",
];

const FILLER_PHRASES = [
  "can you",
  "could you",
  "would you",
  "please",
  "i want to",
  "i need to",
  "i would like to",
  "i'd like to",
  "for me",
  "let me",
  "give me",
  "the",
  "some",
  "of",
  "by",
  "are",
  "is",
  "there",
  "do we have",
];

const UNIT_ALIASES = {
  kilograms: "kg",
  kilogram: "kg",
  kilos: "kg",
  kilo: "kg",
  kgs: "kg",
  kg: "kg",

  grams: "g",
  gram: "g",
  g: "g",

  bags: "bags",
  bag: "bags",

  boxes: "boxes",
  box: "boxes",

  cartons: "cartons",
  carton: "cartons",

  pieces: "pieces",
  piece: "pieces",
  pcs: "pieces",
  pc: "pieces",

  packets: "packets",
  packet: "packets",
  packs: "packets",
  pack: "packets",

  bottles: "bottles",
  bottle: "bottles",

  liters: "liters",
  litre: "liters",
  litres: "liters",
  liter: "liters",
  l: "liters",

  milliliters: "ml",
  milliliter: "ml",
  millilitres: "ml",
  millilitre: "ml",
  ml: "ml",
};

const NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
};

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[?!,.:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const escapeRegex = (text) => {
  return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const removePhrase = (text, phrase) => {
  const regex = new RegExp(
    `\\b${escapeRegex(phrase)}\\b`,
    "gi"
  );

  return text.replace(regex, " ");
};

const removePhrases = (text, phrases) => {
  let result = text;

  const sorted = [...phrases].sort(
    (a, b) => b.length - a.length
  );

  for (const phrase of sorted) {
    result = removePhrase(result, phrase);
  }

  return result;
};

/*
 * Converts:
 *
 * "twenty five"
 * "one hundred"
 * "two hundred fifty"
 * "one thousand two hundred"
 *
 * into numbers.
 */
const parseNumberWords = (text) => {
  const words = text.split(/\s+/).filter(Boolean);

  let total = 0;
  let current = 0;
  let found = false;

  for (const word of words) {
    if (!(word in NUMBER_WORDS)) {
      continue;
    }

    found = true;

    const value = NUMBER_WORDS[word];

    if (value === 100) {
      current = current === 0 ? 100 : current * 100;
    } else if (value === 1000) {
      total +=
        (current === 0 ? 1 : current) * 1000;

      current = 0;
    } else {
      current += value;
    }
  }

  if (!found) {
    return null;
  }

  return total + current;
};

const extractQuantity = (text) => {
  // First try normal numbers.
  const numericMatch = text.match(
    /\b\d+(?:\.\d+)?\b/
  );

  if (numericMatch) {
    return {
      quantity: Number(numericMatch[0]),
      matchedText: numericMatch[0],
    };
  }

  /*
   * Try spoken numbers.
   *
   * Example:
   * "twenty five bags rice"
   */
  const words = text.split(/\s+/);

  let bestMatch = null;

  for (let start = 0; start < words.length; start++) {
    let candidateWords = [];

    for (
      let end = start;
      end < Math.min(start + 6, words.length);
      end++
    ) {
      const word = words[end];

      if (!(word in NUMBER_WORDS)) {
        break;
      }

      candidateWords.push(word);

      const candidate = candidateWords.join(" ");
      const value = parseNumberWords(candidate);

      if (value !== null) {
        bestMatch = {
          quantity: value,
          matchedText: candidate,
        };
      }
    }
  }

  return bestMatch;
};

const extractUnit = (text) => {
  const units = Object.keys(UNIT_ALIASES).sort(
    (a, b) => b.length - a.length
  );

  for (const unit of units) {
    const regex = new RegExp(
      `\\b${escapeRegex(unit)}\\b`,
      "i"
    );

    if (regex.test(text)) {
      return {
        unit: UNIT_ALIASES[unit],
        matchedText: unit,
      };
    }
  }

  return {
    unit: null,
    matchedText: null,
  };
};

const detectIntent = (text) => {
  /*
   * Check commands first because phrases like
   * "check stock" contain the word stock.
   */
  for (const phrase of CHECK_PHRASES) {
    if (
      new RegExp(
        `\\b${escapeRegex(phrase)}\\b`,
        "i"
      ).test(text)
    ) {
      return "CHECK_STOCK";
    }
  }

  for (const action of ADD_ACTIONS) {
    if (
      new RegExp(
        `\\b${escapeRegex(action)}\\b`,
        "i"
      ).test(text)
    ) {
      return "ADD_STOCK";
    }
  }

  for (const action of REMOVE_ACTIONS) {
    if (
      new RegExp(
        `\\b${escapeRegex(action)}\\b`,
        "i"
      ).test(text)
    ) {
      return "REMOVE_STOCK";
    }
  }

  return "UNKNOWN";
};

const cleanItemName = (
  text,
  quantityMatch,
  unitMatch
) => {
  let item = text;

  if (quantityMatch?.matchedText) {
    item = removePhrase(
      item,
      quantityMatch.matchedText
    );
  }

  if (unitMatch?.matchedText) {
    item = removePhrase(
      item,
      unitMatch.matchedText
    );
  }

  item = removePhrases(
    item,
    ADD_ACTIONS
  );

  item = removePhrases(
    item,
    REMOVE_ACTIONS
  );

  item = removePhrases(
    item,
    CHECK_PHRASES
  );

  item = removePhrases(
    item,
    FILLER_PHRASES
  );

  /*
   * Remove common conversational leftovers.
   */
  item = item
    .replace(/\bof\b/gi, " ")
    .replace(/\bfor\b/gi, " ")
    .replace(/\bto\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return item;
};

export const parseVoiceCommand = (
  inputText
) => {
  if (!inputText || !inputText.trim()) {
    return {
      intent: "UNKNOWN",
      item: null,
      quantity: null,
      unit: null,
      originalText: inputText || "",
    };
  }

  const originalText = inputText;

  const text = normalizeText(inputText);

  const intent = detectIntent(text);

  const quantityMatch =
    extractQuantity(text);

  const unitMatch =
    extractUnit(text);

  const item = cleanItemName(
    text,
    quantityMatch,
    unitMatch
  );

  return {
    intent,
    item: item || null,
    quantity:
      quantityMatch?.quantity ?? null,
    unit: unitMatch?.unit ?? null,
    originalText,
  };
};