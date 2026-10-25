import { describe, it, expect, beforeEach, vi } from "vitest";
import { computeStreak } from "./streakService.js";

// Set STREAK_TZ before tests so date keys use Asia/Kolkata
process.env.STREAK_TZ = "Asia/Kolkata";

function makeDate(d: number, month = 1, year = 2024): Date {
  return new Date(Date.UTC(year, month - 1, d));
}

describe("computeStreak with STREAK_TZ=Asia/Kolkata", () => {
  // same day - streak stays at current
  it("same day: last active and now are the same day in streak TZ, streak stays", () => {
    const now = makeDate(15, 1, 2024); // Jan 15
    const lastActive = makeDate(15, 1, 2024); // same day
    const { currentStreak } = computeStreak(5, 10, lastActive, now);
    expect(currentStreak).toBe(5);
  });

  // next day - streak increments by 1
  it("next day: last active was yesterday in streak TZ, streak increments", () => {
    // Jan 15 in Asia/Kolkata is UTC Jan 14 20:30
    // Jan 16 in Asia/Kolkata is UTC Jan 16 00:30+
    const now = makeDate(16, 1, 2024); // Jan 16 in Kolkata
    const lastActive = makeDate(15, 1, 2024); // Jan 15 in Kolkata
    const { currentStreak } = computeStreak(5, 10, lastActive, now);
    expect(currentStreak).toBe(6);
  });

  // gap of 2 days - streak resets to 1
  it("gap of 2 days: last active was 2+ days ago in streak TZ, streak resets to 1", () => {
    const now = makeDate(18, 1, 2024); // Jan 18 in Kolkata
    const lastActive = makeDate(15, 1, 2024); // Jan 15 in Kolkata
    const { currentStreak } = computeStreak(5, 10, lastActive, now);
    expect(currentStreak).toBe(1);
  });

  // crosses midnight in Kolkata but not in UTC
  it("crosses midnight in Kolkata but not UTC: last active before midnight Kolkata, now after, but same UTC day", () => {
    // Kolkata is UTC+5:30. So 23:00 Kolkata = 17:30 UTC same day
    // We need a case where lastActive is one day in Kolkata but same UTC day as now
    // Let's use: lastActive = Jan 15 23:00 Kolkata = Jan 15 17:30 UTC
    //           now = Jan 16 01:00 Kolkata = Jan 15 19:30 UTC (still same UTC day!)
    const lastActive = new Date(Date.UTC(2024, 0, 15, 17, 30)); // 17:30 UTC = 23:00 Kolkata
    const now = new Date(Date.UTC(2024, 0, 15, 19, 30)); // 19:30 UTC = 01:00 next day Kolkata
    // But wait, we need to check the date keys...
    // Actually let's just test the behavior directly
    const { currentStreak } = computeStreak(5, 10, lastActive, now);
    // Since the date keys in Kolkata timezone would be different (one is Jan 15, other is Jan 16),
    // and they are consecutive days, the streak should increment
    expect(currentStreak).toBe(6);
  });
});