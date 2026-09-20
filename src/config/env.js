const port = Number(process.env.PORT) || 3000;
const databaseUrl = process.env.DATABASE_URL || "postgresql://syncscreen:syncscreen-local@127.0.0.1:5432/syncscreen";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production.");
}

const jwtSecret = process.env.JWT_SECRET || "local-development-secret-change-before-production";
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";

module.exports = { port, jwtSecret, databaseUrl, googleClientId };
