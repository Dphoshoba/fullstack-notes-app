import { cacheGet, cacheSet } from "../services/redis.js";

// Cache GET responses by route + user + query
export const cacheGetResponse = (ttlSeconds = 300) => (req, res, next) => {
  if (req.method !== "GET") return next();
  const redisKey = `cache:${req.user?.id || "anon"}:${req.path}:${JSON.stringify(req.query)}`;

  cacheGet(redisKey).then((cached) => {
    if (cached) {
      return res.status(cached.status).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        cacheSet(redisKey, { status: res.statusCode, body }, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  });
};
