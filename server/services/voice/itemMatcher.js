import Inventory from "../../models/Inventory.js";

// ============================================================
// NORMALIZE ITEM NAME
// ============================================================

const normalizeItemName = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};


// ============================================================
// LEVENSHTEIN DISTANCE
// Measures how different two words are.
//
// rice / rise -> small distance
// rice / wheat -> larger distance
// ============================================================

const levenshteinDistance = (a, b) => {
  const matrix = Array.from(
    { length: b.length + 1 },
    () => Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] =
          matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
};


// ============================================================
// SIMILARITY SCORE
//
// 1   = exact match
// 0.8 = very similar
// 0   = completely different
// ============================================================

const similarityScore = (input, target) => {
  const distance = levenshteinDistance(
    input,
    target
  );

  const maxLength = Math.max(
    input.length,
    target.length
  );

  if (maxLength === 0) {
    return 1;
  }

  return 1 - distance / maxLength;
};


// ============================================================
// FIND BEST INVENTORY MATCH
// ============================================================

export const findBestInventoryMatch = async (
  itemName
) => {
  const normalizedInput =
    normalizeItemName(itemName);

  if (!normalizedInput) {
    return {
      status: "NOT_FOUND",
      item: null,
      score: 0,
    };
  }


  // Get current inventory
  const inventory = await Inventory.find();


  if (inventory.length === 0) {
    return {
      status: "NOT_FOUND",
      item: null,
      score: 0,
    };
  }


  // ==========================================================
  // EXACT MATCH
  // ==========================================================

  const exactMatch = inventory.find(
    (item) =>
      normalizeItemName(item.name) ===
      normalizedInput
  );

  if (exactMatch) {
    return {
      status: "EXACT",
      item: exactMatch,
      score: 1,
    };
  }


  // ==========================================================
  // CALCULATE SIMILARITY
  // ==========================================================

  const matches = inventory
    .map((item) => {
      const normalizedName =
        normalizeItemName(item.name);

      return {
        item,
        score: similarityScore(
          normalizedInput,
          normalizedName
        ),
      };
    })
    .sort(
      (a, b) => b.score - a.score
    );


  const bestMatch = matches[0];


  // ==========================================================
  // NO CONFIDENT MATCH
  // ==========================================================

  if (
    !bestMatch ||
    bestMatch.score < 0.65
  ) {
    return {
      status: "NOT_FOUND",
      item: null,
      score: bestMatch?.score ?? 0,
    };
  }


  // ==========================================================
  // CHECK FOR AMBIGUITY
  // ==========================================================

  const secondMatch = matches[1];

  if (
    secondMatch &&
    bestMatch.score - secondMatch.score <
      0.08
  ) {
    return {
      status: "AMBIGUOUS",
      item: null,
      score: bestMatch.score,
      candidates: matches
        .slice(0, 3)
        .map((match) => ({
          id: match.item._id,
          name: match.item.name,
          score: match.score,
        })),
    };
  }


  // ==========================================================
  // CONFIDENT FUZZY MATCH
  // ==========================================================

  return {
    status: "FUZZY",
    item: bestMatch.item,
    score: bestMatch.score,
  };
};