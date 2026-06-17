import {Redis} from 'ioredis';
import { env } from '../config/index.js';

const redis = new Redis({
  host: env.nodeEnv === "dev" ? "127.0.0.1" : env.redisHost,
  port: env.redisPort,
  password: env.redisPassword,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

export default redis;