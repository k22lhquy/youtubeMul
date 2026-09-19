const port = Number(process.env.PORT) || 3000;
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production.");
}

const jwtSecret = process.env.JWT_SECRET || "local-development-secret-change-before-production";

module.exports = { port, jwtSecret };
