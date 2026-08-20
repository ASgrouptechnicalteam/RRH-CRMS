/// <reference path="../../../../tsconfig.json" />
import {
  calculatePerformanceScore,
  calculateLeaderboardScore,
  roundPerformanceScore,
  PERFORMANCE_BASE_SCORE,
  PerformanceScoreInputs,
} from '@/services/performance-metric';

describe('performance-metric', () => {
  describe('roundPerformanceScore', () => {
    it('rounds a raw score to one decimal place', () => {
      expect(roundPerformanceScore(54.04)).toBe(54.0);
      expect(roundPerformanceScore(54.05)).toBe(54.1);
      expect(roundPerformanceScore(54.15)).toBe(54.2); // .15*10=1.5 -> 2 (rounds half up)
    });

    it('clamps negative raw scores to 0', () => {
      expect(roundPerformanceScore(-5)).toBe(0);
      expect(roundPerformanceScore(-0.1)).toBe(0);
    });

    it('clamps exactly-zero raw scores to 0', () => {
      expect(roundPerformanceScore(0)).toBe(0);
    });
  });

  describe('calculatePerformanceScore (full formula — shared by my-score & team)', () => {
    const baseInputs: PerformanceScoreInputs = {
      completedTasks: 0,
      overdueTasks: 0,
      dailyReports: 0,
      belowTargetEvents: 0,
      uninformedAbsentEvents: 0,
      presentCount: 0,
      lateCount: 0,
      halfDayCount: 0,
    };

    it('1. Base score is 50.0 when there are no events', () => {
      const result = calculatePerformanceScore(baseInputs);
      expect(result.score).toBe(50.0);
      expect(result.breakdown.baseScore).toBe(PERFORMANCE_BASE_SCORE);
    });

    it('2. Breakdown exposes all canonical components', () => {
      const result = calculatePerformanceScore({ ...baseInputs, completedTasks: 2, dailyReports: 1, presentCount: 1 });
      expect(result.breakdown).toEqual({
        baseScore: 50.0,
        completedTasks: 2,
        taskBoost: 2,
        dailyReports: 1,
        reportBoost: 0.5,
        presentCount: 1,
        presentBoost: 0.5,
        lateCount: 0,
        latePenalty: 0,
        halfDayCount: 0,
        halfDayPenalty: 0,
        belowTargetEvents: 0,
        belowTargetPenalty: 0,
        overdueTasks: 0,
        overduePenalty: 0,
        uninformedAbsentEvents: 0,
        uninformedAbsentPenalty: 0,
      });
      // 50 + 2 + 0.5 + 0.5 = 53
      expect(result.score).toBe(53.0);
    });

    it('3. Mixed components produce the expected raw total', () => {
      // tasks=3 (+3), reports=2 (+1), present=4 (+2), late=1 (-1),
      // halfDay=1 (-2), belowTarget=1 (-2), overdue=1 (-2), uninformed=1 (-5)
      // raw = 50 + 6 - 12 = 44
      const result = calculatePerformanceScore({
        completedTasks: 3,
        overdueTasks: 1,
        dailyReports: 2,
        belowTargetEvents: 1,
        uninformedAbsentEvents: 1,
        presentCount: 4,
        lateCount: 1,
        halfDayCount: 1,
      });
      expect(result.score).toBe(44.0);
    });

    it('4. Penalties reduce the score without going below 0', () => {
      const result = calculatePerformanceScore({
        completedTasks: 0,
        overdueTasks: 10,
        dailyReports: 0,
        belowTargetEvents: 10,
        uninformedAbsentEvents: 10,
        presentCount: 0,
        lateCount: 10,
        halfDayCount: 10,
      });
      // raw = 50 - 10 - 20 - 50 - 10 - 20 - 20 = 50 - 130 = -80 -> clamped to 0
      expect(result.score).toBe(0);
    });

    it('5. Does not mutate the input object', () => {
      const inputs = { ...baseInputs, completedTasks: 5, lateCount: 2 };
      const snapshot = { ...inputs };
      calculatePerformanceScore(inputs);
      expect(inputs).toEqual(snapshot);
    });

    it('6. Weights match the documented business rule', () => {
      // Each completed task is worth +1.0; removing it must drop the score by 1.0.
      const withOne = calculatePerformanceScore({ ...baseInputs, completedTasks: 1 }).score;
      const withZero = calculatePerformanceScore({ ...baseInputs, completedTasks: 0 }).score;
      expect(withOne - withZero).toBe(1.0);
      // Each uninformed absence is worth -5.0.
      const noAbsence = calculatePerformanceScore({ ...baseInputs }).score;
      const oneAbsence = calculatePerformanceScore({ ...baseInputs, uninformedAbsentEvents: 1 }).score;
      expect(noAbsence - oneAbsence).toBe(5.0);
    });
  });

  describe('calculateLeaderboardScore (reduced formula — leaderboard only)', () => {
    it('1. Base score is 50.0 with no tasks or reports', () => {
      expect(calculateLeaderboardScore(0, 0)).toBe(50.0);
    });

    it('2. Adds 1.0 per completed task and 0.5 per daily report', () => {
      // 50 + 3*1.0 + 2*0.5 = 54
      expect(calculateLeaderboardScore(3, 2)).toBe(54.0);
    });

    it('3. Ignores attendance and penalties (reduced formula)', () => {
      // The leaderboard score is the same whether or not there are attendance events
      // — it only depends on tasks and reports.
      expect(calculateLeaderboardScore(1, 1)).toBe(50 + 1 + 0.5);
      // 50 + 1 + 0.5 = 51.5, rounded to 1 decimal -> 51.5
      expect(calculateLeaderboardScore(1, 1)).toBe(51.5);
    });

    it('4. Clamps to 0 cannot happen here (reduced formula is always positive)', () => {
      // With zero inputs the floor is the base score of 50.
      expect(calculateLeaderboardScore(0, 0)).toBeGreaterThanOrEqual(0);
    });
  });
});
