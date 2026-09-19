// ============================================================
// INTENT WORDS
// ============================================================

const ADD_WORDS = [
  "add",
  "increase",
  "stock",
  "put",
];

const REMOVE_WORDS = [
  "remove",
  "sell",
  "sold",
  "decrease",
  "take",
];

const CHECK_WORDS = [
  "check",
  "show",
  "how much",
  "how many",
  "stock of",
];


// ============================================================
// FILLER WORDS
// ============================================================

const FILLER_WORDS = [
  "of",
  "the",
  "some",
];


// ============================================================
// UNIT WORDS
// ============================================================

const UNIT_WORDS = [
  "kilograms",
  "kilogram",
  "kgs",
  "kg",

  "grams",
  "gram",
  "g",

  "bags",
  "bag",

  "boxes",
  "box",

  "cartons",
  "carton",

  "pieces",
  "piece",

  "packets",
  "packet",

  "bottles",
  "bottle",
];


// ============================================================
// SPOKEN NUMBER WORDS
// ============================================================

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
};


// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};


// ============================================================
// DETECT INTENT
// ============================================================

const detectIntent = (text) => {

  // ADD STOCK
  if (
    ADD_WORDS.some((word) =>
      new RegExp(`\\b${word}\\b`).test(text)
    )
  ) {
    return "ADD_STOCK";
  }


  // REMOVE STOCK
  if (
    REMOVE_WORDS.some((word) =>
      new RegExp(`\\b${word}\\b`).test(text)
    )
  ) {
    return "REMOVE_STOCK";
  }


  // CHECK STOCK
  if (
    CHECK_WORDS.some((word) =>
      text.includes(word)
    )
  ) {
    return "CHECK_STOCK";
  }


  return "UNKNOWN";
};


// ============================================================
// EXTRACT QUANTITY
// ============================================================

const extractQuantity = (text) => {

  // ----------------------------------------------------------
  // 1. Numeric quantity
  //
  // Examples:
  // 5
  // 10
  // 2.5
  // ----------------------------------------------------------

  const numberMatch = text.match(
    /\b\d+(?:\.\d+)?\b/
  );

  if (numberMatch) {
    return Number(numberMatch[0]);
  }


  // ----------------------------------------------------------
  // 2. Spoken quantity
  //
  // Examples:
  // five
  // ten
  // twenty
  // ----------------------------------------------------------

  const words = text.split(" ");

  for (const word of words) {

    if (
      NUMBER_WORDS[word] !== undefined
    ) {
      return NUMBER_WORDS[word];
    }

  }


  return null;
};


// ============================================================
// EXTRACT UNIT
// ============================================================

const extractUnit = (text) => {

  // ----------------------------------------------------------
  // Longest units first.
  //
  // Prevents:
  //
  // kilograms → kg
  // grams     → g
  // bags      → g
  //
  // ----------------------------------------------------------

  const sortedUnits = [
    ...UNIT_WORDS,
  ].sort(
    (a, b) => b.length - a.length
  );


  for (const unit of sortedUnits) {

    const regex = new RegExp(
      `\\b${unit}\\b`
    );

    if (regex.test(text)) {
      return unit;
    }

  }


  return null;
};


// ============================================================
// REMOVE WORD
// ============================================================

const removeWord = (
  text,
  word
) => {

  return text.replace(
    new RegExp(
      `\\b${word}\\b`,
      "g"
    ),
    " "
  );
};


// ============================================================
// EXTRACT ITEM
// ============================================================

const extractItem = (
  text,
  quantity,
  unit
) => {

  let item = text;


  // ----------------------------------------------------------
  // Remove numeric quantity
  //
  // Example:
  // "add 5 bags rice"
  //
  // becomes:
  // "add bags rice"
  // ----------------------------------------------------------

  if (quantity !== null) {

    const numberMatch = item.match(
      /\b\d+(?:\.\d+)?\b/
    );

    if (numberMatch) {

      item = removeWord(
        item,
        numberMatch[0]
      );

    }

  }


  // ----------------------------------------------------------
  // Remove spoken number words
  //
  // Example:
  // "add five bags rice"
  //
  // becomes:
  // "add bags rice"
  // ----------------------------------------------------------

  Object.keys(NUMBER_WORDS).forEach(
    (word) => {

      item = removeWord(
        item,
        word
      );

    }
  );


  // ----------------------------------------------------------
  // Remove unit
  // ----------------------------------------------------------

  if (unit) {

    item = removeWord(
      item,
      unit
    );

  }


  // ----------------------------------------------------------
  // Remove ADD words
  // ----------------------------------------------------------

  ADD_WORDS.forEach(
    (word) => {

      item = removeWord(
        item,
        word
      );

    }
  );


  // ----------------------------------------------------------
  // Remove REMOVE words
  // ----------------------------------------------------------

  REMOVE_WORDS.forEach(
    (word) => {

      item = removeWord(
        item,
        word
      );

    }
  );


  // ----------------------------------------------------------
  // Remove CHECK phrases
  // ----------------------------------------------------------

  CHECK_WORDS.forEach(
    (word) => {

      item = item.replace(
        new RegExp(
          `\\b${word}\\b`,
          "g"
        ),
        " "
      );

    }
  );


  // ----------------------------------------------------------
  // Remove filler words
  // ----------------------------------------------------------

  FILLER_WORDS.forEach(
    (word) => {

      item = removeWord(
        item,
        word
      );

    }
  );


  // ----------------------------------------------------------
  // Clean spaces
  // ----------------------------------------------------------

  return item
    .replace(/\s+/g, " ")
    .trim();
};


// ============================================================
// MAIN PARSER
// ============================================================

export const parseVoiceCommand = (
  transcript
) => {

  const text = normalizeText(
    transcript
  );

  const intent = detectIntent(
    text
  );

  const quantity = extractQuantity(
    text
  );

  const unit = extractUnit(
    text
  );

  const item = extractItem(
    text,
    quantity,
    unit
  );


  return {
    intent,
    item,
    quantity,
    unit,
    originalText: transcript,
  };
};