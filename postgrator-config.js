require('dotenv');


module.exports = {
  "migrationsDirectory": "migrations",
  "driver": "pg",
  "database": "raffle",
  "connectionString": process.env.DATABASE_URL,
};