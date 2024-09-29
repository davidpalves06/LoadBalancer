import { createClient } from "redis";
const redisURL = process.env.REDIS || 'redis://localhost:6379';
const redisClient = createClient({
    url:redisURL
});

redisClient.connect();

// Handle connection errors
redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
});

export default redisClient;