export const POINTS = {
  CONTRIBUTION_SUBMITTED: 2,
  CONTRIBUTION_VERIFIED: 15,
  ALERT_RESOLVED_AUTHOR: 25,
  ALERT_RESOLVED_HELPER: 50,
} as const;

export function contributionTrustScore(input: {
  accountAgeHours: number;
  priorContributionsOnAlert: number;
  messageLength: number;
}): number {
  let score = 1;
  if (input.accountAgeHours < 24) score -= 0.4;
  else if (input.accountAgeHours < 24 * 7) score -= 0.15;

  if (input.priorContributionsOnAlert >= 3) score -= 0.3;

  if (input.messageLength < 20) score -= 0.2;

  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

export function pointsForEvent(
  event: keyof typeof POINTS
): number {
  return POINTS[event];
}
