const health = '/health';
const login = '/login';
const users = '/users';
const orders = '/orders';

export const AuthEndpoints = {
  HEALTH: health,
  VALIDATE: '/validate',
  LOGIN: login };

export const UserEndpoints = {
  HEALTH: health,
  CREATE: users,
  GET_BY_ID: `${users}/:userId`
};

export const OrderEndpoints = {
  HEALTH: health, CREATE: orders,
  GET_BY_USER: `${orders}/user/:userId` };

export const GatewayEndpoints = {
  HEALTH: health,
  LOGIN: login,
  USERS: users,
  USER_BY_ID: `${users}/:userId`,
  ORDERS: orders,
  USER_ORDERS: `${orders}/user`
};