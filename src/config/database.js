const { Pool } = require("pg");
const fs = require("node:fs");
const path = require("node:path");
const { databaseUrl } = require("./env");

const pool = new Pool({ connectionString: databaseUrl });

module.exports = {
  query: (text, params) => pool.query(text, params),
  migrate: () => pool.query(fs.readFileSync(path.join(__dirname, "..", "..", "db", "init.sql"), "utf8")),
  close: () => pool.end(),
};
