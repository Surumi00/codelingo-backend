const DEFAULT_STREAK_TIME_ZONE = "Asia/Kolkata";

// Resolved per call so tests (and deployments) can set STREAK_TZ before use.
function streakTimeZone(): string {
  return process.env.STREAK_TZ || DEFAULT_STREAK_TIME_ZONE;
}

// Calendar date (YYYY-MM-DD) in the configured streak timezone.
export function dateKeyInStreakZone(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: streakTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function previousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

// Same day keeps the streak, the next day adds one, a longer gap resets to one.
export function computeStreak(
  currentStreak: number,
  longestStreak: number,
  lastActiveDate: Date | null,
  now: Date = new Date(),
): { currentStreak: number; longestStreak: number } {
  const today = dateKeyInStreakZone(now);

  let streak = 1;

  if (lastActiveDate) {
    const lastDay = dateKeyInStreakZone(lastActiveDate);

    if (lastDay === today) {
      streak = Math.max(currentStreak, 1);
    } else if (lastDay === previousDateKey(today)) {
      streak = currentStreak + 1;
    }
  }

  return {
    currentStreak: streak,
    longestStreak: Math.max(longestStreak, streak),
  };
}
