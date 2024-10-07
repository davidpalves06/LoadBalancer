import { createClient } from "redis";
const redisURL = process.env.REDIS || 'redis://localhost:6379';
const redisClient = createClient({
    url:redisURL
});

redisClient.connect();

redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
});

export async function acquireLock(key) {
    const setLock = await redisClient.setNX(key, 'locked');
    if (setLock) {
        await redisClient.expire(key, 5);
        return true;
    }
    return false;
}

export async function releaseLock(key) { 
    await redisClient.del(key); 
}

export default redisClient;