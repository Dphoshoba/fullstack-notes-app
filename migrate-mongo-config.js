// migrate-mongo configuration
module.exports = {
  mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/express_auth_api",
  migrationFilesRegex: ".+.m.js$",
  migrationsDir: "src/migrations",
  migrationFormat: "es",
  chokidar: true
};
