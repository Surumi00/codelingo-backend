import { skillLevelEnum } from "../db/schema.js";

export type PlacementLevel = (typeof skillLevelEnum.enumValues)[number];

// Thresholds:
//   under 40%  -> BEGINNER
//   under 60%  -> ELEMENTARY
//   under 80%  -> INTERMEDIATE
//   80% or more -> ADVANCED
const THRESHOLD_ELEMENTARY = 40;
const THRESHOLD_INTERMEDIATE = 60;
const THRESHOLD_ADVANCED = 80;

export function placementLevelFromPercentage(
  percentage: number,
): PlacementLevel {
  if (percentage >= THRESHOLD_ADVANCED) return "ADVANCED";
  if (percentage >= THRESHOLD_INTERMEDIATE) return "INTERMEDIATE";
  if (percentage >= THRESHOLD_ELEMENTARY) return "ELEMENTARY";
  return "BEGINNER";
}