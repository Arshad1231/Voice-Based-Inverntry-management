import { parseVoiceCommand } from "./services/voice/commandParser.js";

const tests = [
  "Add 15 bags of rice",
  "Can you add 15 bags of rice?",
  "Please add fifteen bags of rice",
  "I want to add 25 bags of rice",
  "Increase rice by 10 bags",
  "Put 5 boxes of biscuits",
  "Rice 20 bags add",

  "Remove 5 bags of rice",
  "I sold five bags of rice",
  "Take 10 bags of rice",
  "Decrease rice by 15 bags",

  "How much rice do we have?",
  "How many bags of rice are there?",
  "What's the stock of rice?",
  "Check rice",
  "Show me rice stock",
];

for (const test of tests) {
  console.log("\nINPUT:", test);
  console.log(
    "OUTPUT:",
    parseVoiceCommand(test)
  );
}