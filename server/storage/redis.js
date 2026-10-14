const promisify = require('util').promisify;

module.exports = function(config) {
  const redis_lib =
    config.env === 'development' && config.redis_host === 'localhost'
      ? 'redis-mock'
      : 'redis';

  //eslint-disable-next-line security/detect-non-literal-require
  const redis = require(redis_lib);

  var client_config = {
    host: config.redis_host,
    port: config.redis_port,
    retry_strategy: options => {
      if (options.total_retry_time > config.redis_retry_time) {
        client.emit('error', 'Retry time exhausted');
        return new Error('Retry time exhausted');
      }

      return config.redis_retry_delay;
    }
  };
  if (config.redis_user != null && config.redis_user.length > 0)
    client_config.user = config.redis_user;
  if (config.redis_password != null && config.redis_password.length > 0)
    client_config.password = config.redis_password;
  if (config.redis_db != null && config.redis_db.length > 0)
    client_config.db = config.redis_db;
  const client = redis.createClient(client_config);

  client.ttlAsync = promisify(client.ttl);
  client.getAsync = promisify(client.get);
  client.hgetallAsync = promisify(client.hgetall);
  client.hgetAsync = promisify(client.hget);
  client.hsetAsync = promisify(client.hset);
  client.hmsetAsync = promisify(client.hmset);
  client.hdelAsync = promisify(client.hdel);
  client.hincrbyAsync = promisify(client.hincrby);
  client.incrAsync = promisify(client.incr);
  client.incrbyAsync = promisify(client.incrby);
  client.decrbyAsync = promisify(client.decrby);
  client.expireAsync = promisify(client.expire);
  client.delAsync = promisify(client.del);
  client.zaddAsync = promisify(client.zadd);
  client.zremAsync = promisify(client.zrem);
  client.zrangebyscoreAsync = promisify(client.zrangebyscore);
  client.zscoreAsync = promisify(client.zscore);
  client.evalAsync =
    typeof client.eval === 'function' ? promisify(client.eval) : null;
  client.isMock = redis_lib === 'redis-mock';
  client.execMultiAsync = commands =>
    new Promise((resolve, reject) => {
      client.multi(commands).exec((err, replies) => {
        if (err) {
          reject(err);
        } else {
          resolve(replies);
        }
      });
    });
  client.pingAsync = promisify(client.ping);
  return client;
};
