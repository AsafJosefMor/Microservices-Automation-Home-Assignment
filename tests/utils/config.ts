import dotenv from 'dotenv';
dotenv.config();
export const testConfig = {
  gatewayUrl: process.env.GATEWAY_URL || 'http://gateway-service:3003',
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379'
};