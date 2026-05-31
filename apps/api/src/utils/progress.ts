import type { GoalProgress, WeeklyTracking } from '@mvgsm/shared';

// Calculate progress for a goal based on weekly tracking
export function calculateGoalProgress(
  startWeek: number,
  endWeek: number,
  trackingData: WeeklyTracking[],
  currentWeek: number,
  currentYear: number
): GoalProgress {
  const totalWeeks = endWeek - startWeek + 1;

  // Count done weeks within the goal's date range
  let doneWeeks = 0;
  for (const tracking of trackingData) {
    // Only count if tracking is for current year and within goal's week range
    if (
      tracking.year === currentYear &&
      tracking.week_number >= startWeek &&
      tracking.week_number <= endWeek &&
      tracking.status === 'done'
    ) {
      doneWeeks++;
    }
  }

  // Calculate elapsed weeks (weeks that have passed within the goal range)
  let elapsedWeeks = 0;
  if (currentWeek >= startWeek) {
    elapsedWeeks = Math.min(currentWeek - startWeek, totalWeeks);
  }

  // Calculate actual progress: DoneWeeks / TotalWeeks
  const actualProgress = totalWeeks > 0 ? doneWeeks / totalWeeks : 0;

  // Calculate expected progress: ElapsedWeeks / TotalWeeks
  const expectedProgress = totalWeeks > 0 ? elapsedWeeks / totalWeeks : 0;

  // Calculate health score: ActualProgress / ExpectedProgress
  let healthScore = 0;
  if (expectedProgress > 0) {
    healthScore = actualProgress / expectedProgress;
  } else if (actualProgress > 0) {
    healthScore = 1; // If no weeks have elapsed yet but some are done, consider it healthy
  }

  return {
    actualProgress,
    expectedProgress,
    healthScore,
    doneWeeks,
    totalWeeks,
    elapsedWeeks,
  };
}

// Get ISO week number for a date
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Get current ISO week number
export function getCurrentWeek(): number {
  return getISOWeek(new Date());
}

// Get current year
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

// Format currency in VND
export function formatCurrency(amount: number): string {
  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(1)}B`;
  }
  if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(1)}M`;
  }
  if (amount >= 1e3) {
    return `${(amount / 1e3).toFixed(0)}K`;
  }
  return amount.toFixed(0);
}

// Quarter helpers
export function getQuarterWeeks(quarter: 1 | 2 | 3 | 4): { startWeek: number; endWeek: number } {
  switch (quarter) {
    case 1: return { startWeek: 1, endWeek: 13 };
    case 2: return { startWeek: 14, endWeek: 26 };
    case 3: return { startWeek: 27, endWeek: 39 };
    case 4: return { startWeek: 40, endWeek: 52 };
  }
}

// Check if year has 53 weeks (ISO year)
export function has53Weeks(year: number): boolean {
  // A year has 53 weeks if January 1 is Thursday, or December 31 is Thursday
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  return jan1.getDay() === 4 || dec31.getDay() === 4;
}

// Validate week number (1-53)
export function isValidWeek(week: number): boolean {
  return week >= 1 && week <= 53;
}

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Parse mentions from comment content
export function parseMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}
