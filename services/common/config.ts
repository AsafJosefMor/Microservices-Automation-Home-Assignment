// Shared service URLs and environment-wide config
export const serviceUrls = {
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
  gatewayServiceUrl: process.env.GATEWAY_SERVICE_URL || 'http://gateway-service:3003',
};

// One database configuration for all services (we can configure different DB for each service)
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres:5432/appdb'
export const configGateway = {
  port: Number(process.env.GATEWAY_PORT) || 3003,
};

export const configOrder = {
  port: Number(process.env.ORDER_SERVICE_PORT) || 3002,
  dbUrl: process.env.DATABASE_URL || dbUrl
};

export const configUser = {
  port: Number(process.env.USER_SERVICE_PORT) || 3001,
  dbUrl: process.env.DATABASE_URL || dbUrl
};

export const configAuth = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'secret',
  dbUrl: process.env.DATABASE_URL || dbUrl
};

// Shared Pub/Sub channels
export const REDIS_CHANNELS = {
  USER_CREATED: 'user:created',
  ORDER_CREATED: 'order:created',
};