// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  rabbit: {
    url: process.env.CLOUDAMQP_URL || process.env.RABBIT_URL || 'amqps://bfvrgswc:X1PaMHdb5txqad3uxJ_2LIirjK1WiTgG@hawk.rmq.cloudamqp.com/bfvrgswc',
    exchange: process.env.RABBIT_EXCHANGE || 'notifications.direct',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://redis:6379',
  },
  userService: {
    url: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  },
  idempotencyTTL: parseInt(process.env.IDEMPOTENCY_TTL || String(60 * 60), 10), // seconds
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '30', 10),
  },
});
