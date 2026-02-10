export const MAX_POST_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_BIO_LENGTH = 280;
export const MAX_USERNAME_LENGTH = 30;
export const MAX_DISPLAY_NAME_LENGTH = 50;

export const FEED_PAGE_SIZE = 20;
export const COMMENTS_PAGE_SIZE = 20;
export const NOTIFICATIONS_PAGE_SIZE = 30;
export const MESSAGES_PAGE_SIZE = 50;
export const SEARCH_PAGE_SIZE = 20;

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const STAKE_PERIODS = {
  30: { apy: 5 },
  60: { apy: 7.5 },
  90: { apy: 10 },
  180: { apy: 15 },
  365: { apy: 25 },
} as const;

export const REWARDS = {
  POST_CREATION: 1,
  DAILY_POST_CAP: 10,
  LIKE_RECEIVED: 0.01,
  COMMENT_RECEIVED: 0.05,
  REPOST_RECEIVED: 0.03,
} as const;
