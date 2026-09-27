export const PAST_STATUSES = ['sold', 'traded', 'lost', 'stolen', 'gave_away'] as const;

export type PastStatus = typeof PAST_STATUSES[number];

export const PAST_STATUS_LABELS: Record<PastStatus, string> = {
  sold: 'Sold',
  traded: 'Traded',
  lost: 'Lost',
  stolen: 'Stolen',
  gave_away: 'Gave away',
};

export const PAST_STATUS_REASONS: Record<PastStatus, string[]> = {
  sold: ['Funding a new purchase', 'No longer wearing it', "Didn't like it anymore", 'Needed the cash', 'Upgrading', "Doesn't fit my style", 'Other'],
  traded: ['Upgrading', 'Wanted a different style', "Doesn't fit collection", 'Better value in trade', 'Other'],
  lost: ['Misplaced', 'Lost while traveling', 'Other'],
  stolen: ['Theft', 'Burglary', 'Other'],
  gave_away: ['Gift', 'Donation', 'Passed down', 'Other'],
};

export const isPastStatus = (status: string): status is PastStatus =>
  PAST_STATUSES.some((pastStatus) => pastStatus === status);