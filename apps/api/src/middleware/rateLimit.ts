import { RateLimiterRedis } from 'rate-limiter-flexible';
import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';

const defaultLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:default',
  points: 300,
  duration: 60,
});

const authLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: 5,
  duration: 60,
});

const postCreationLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:post',
  points: 30,
  duration: 3600,
});

const searchLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:search',
  points: 30,
  duration: 60,
});

function createRateLimitMiddleware(limiter: RateLimiterRedis, keyFn?: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn ? keyFn(req) : req.ip || 'unknown';
    try {
      await limiter.consume(key);
      next();
    } catch {
      res.status(429).json({
        error: 'TooManyRequests',
        message: 'Rate limit exceeded. Please try again later.',
        statusCode: 429,
      });
    }
  };
}

export const rateLimitDefault = createRateLimitMiddleware(defaultLimiter, (req) => req.user?.sub || req.ip || 'unknown');
export const rateLimitAuth = createRateLimitMiddleware(authLimiter);
export const rateLimitPostCreation = createRateLimitMiddleware(postCreationLimiter, (req) => req.user?.sub || 'unknown');
export const rateLimitSearch = createRateLimitMiddleware(searchLimiter, (req) => req.user?.sub || req.ip || 'unknown');
