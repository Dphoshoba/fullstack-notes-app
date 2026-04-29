export const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const route = req.originalUrl || req.url;
    console.info(`${req.method} ${route} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
  });

  return next();
};
