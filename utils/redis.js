import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log('Redis Client Error', err));
  }

  // returns true when connection to Redis is a success or false if otherwise
  isAlive() {
    return this.client.connected;
  }

  // async get that takes key as arg and returns the value stored for this key
  async get(key) {
    const asyncGet = promisify(this.client.get).bind(this.client);
    return asyncGet(key);
  }

  // async set that takes key, value and duration as args to store in redis
  // with an expiration set by duration arg
  async set(key, value, duration) {
    const asyncSet = promisify(this.client.set).bind(this.client);
    setTimeout(() => {
      asyncSet(key, value);
    }, duration);
  }

  // async del that takes key as arg and remove the value for this key
  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    asyncDel(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
