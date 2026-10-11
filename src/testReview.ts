import "dotenv/config";
import { generateReview } from "./services/reviewService.js";

const breakdown = {
  variables: { correct: 3, total: 3 },
  loops: { correct: 2, total: 3 },
  functions: { correct: 1, total: 3 },
};

const review = await generateReview(
  8,
  breakdown,
  "ELEMENTARY"
);

console.log("\n===== AI REVIEW =====");
console.log(review);