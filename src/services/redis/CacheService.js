const redis = require('redis');
const NotFoundError = require('../../exceptions/NotFoundError');

class CacheService {
  constructor() {
    this._cache = redis.createClient({
      host: process.env.REDIS_SERVER,
    });

    this._cache.on('error', (error) => {
      console.error(error);
    });
  }

  set(key, val, expInSec = 1800) {
    return new Promise((resolve, reject) => {
      this._cache.set(key, val, 'EX', expInSec, (error, ok) => {
        if (error) {
          return reject(error);
        }

        return resolve(ok);
      });
    });
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this._cache.get(key, (error, reply) => {
        if (error) {
          return reject(error);
        }

        if (reply === null) {
          return reject(new NotFoundError('Cache tidak ditemukan'));
        }

        return resolve(reply.toString());
      });
    });
  }

  expire(key, expInSec = 1800) {
    return new Promise((resolve, reject) => {
      this._cache.sendCommand('EXPIRE', [key, `${expInSec}`], (error, count) => {
        if (error) {
          return reject(error);
        }

        if (count === 0) {
          return reject(new NotFoundError('Cache tidak ditemukan'));
        }

        return resolve(count);
      });
    });
  }

  del(key) {
    return new Promise((resolve, reject) => {
      this._cache.del(key, (error, count) => {
        if (error) {
          return reject(error);
        }

        return resolve(count);
      });
    });
  }
}

module.exports = CacheService;
