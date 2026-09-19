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

const UNIT_WORDS = [
  "kg",
  "kgs",
  "kilogram",
  "kilograms",
  "g",
  "gram",
  "grams",
  "bag",
  "bags",
  "box",
  "boxes",
  "carton",
  "cartons",
  "piece",
  "pieces",
  "packet",
  "packets",
  "bottle",
  "bottles",
];

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim();
};

const detectIntent = (text) => {
  if (ADD_WORDS.some((word) => text.includes(word))) {
    return "ADD_STOCK";
  }

  if (REMOVE_WORDS.some((word) => text.includes(word))) {
    return "REMOVE_STOCK";
  }

  if (CHECK_WORDS.some((word) => text.includes(word))) {
    return "CHECK_STOCK";
  }

  return "UNKNOWN";
};

const extractQuantity = (text) => {
  const match = text.match(/\b\d+(?:\.\d+)?\b/);

  if (!match) {
    return null;
  }

  return Number(match[0]);
};

const extractUnit = (text) => {
  for (const unit of UNIT_WORDS) {
    if (text.includes(unit)) {
      return unit;
    }
  }

  return null;
};

const extractItem = (text, quantity, unit) => {
  let item = text;

  if (quantity !== null) {
    item = item.replace(
      new RegExp(`\\b${quantity}\\b`),
      ""
    );
  }

  if (unit) {
    item = item.replace(
      new RegExp(`\\b${unit}\\b`, "g"),
      ""
    );
  }

  ADD_WORDS.forEach((word) => {
    item = item.replace(
      new RegExp(`\\b${word}\\b`, "g"),
      ""
    );
  });

  REMOVE_WORDS.forEach((word) => {
    item = item.replace(
      new RegExp(`\\b${word}\\b`, "g"),
      ""
    );
  });

  CHECK_WORDS.forEach((word) => {
    item = item.replace(
      new RegExp(`\\b${word}\\b`, "g"),
      ""
    );
  });

  return item
    .replace(/\s+/g, " ")
    .trim();
};

export const parseVoiceCommand = (transcript) => {
  const text = normalizeText(transcript);

  const intent = detectIntent(text);

  const quantity = extractQuantity(text);

  const unit = extractUnit(text);

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