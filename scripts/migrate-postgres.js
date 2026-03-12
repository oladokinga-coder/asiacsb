/**
 * One-time migration: copy data from OLD Postgres to NEW Postgres.
 * Run: OLD_PRISMA_DATABASE_URL=... NEW_PRISMA_DATABASE_URL=... node scripts/migrate-postgres.js
 * Prisma table names are quoted in DB: "User", "Session", "PasswordResetToken", "ProcessedTransactionNotification"
 */

const { Client } = require("pg");

const OLD_URL = process.env.OLD_PRISMA_DATABASE_URL || process.env.PRISMA_DATABASE_URL;
const NEW_URL = process.env.NEW_PRISMA_DATABASE_URL;

if (!OLD_URL) {
  console.error("Set OLD_PRISMA_DATABASE_URL (or PRISMA_DATABASE_URL)");
  process.exit(1);
}
if (!NEW_URL) {
  console.error("Set NEW_PRISMA_DATABASE_URL");
  process.exit(1);
}

async function run() {
  const oldClient = new Client({ connectionString: OLD_URL });
  const newClient = new Client({ connectionString: NEW_URL });

  try {
    await oldClient.connect();
    await newClient.connect();

    // 1. User
    const users = (await oldClient.query('SELECT * FROM "User"')).rows;
    console.log("Users:", users.length);
    for (const r of users) {
      await newClient.query(
        `INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", "dateOfBirth", "passportSeries", "passportNumber", country, "passportPhotoPath", "videoSelfiePath", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.email, r.passwordHash, r.firstName, r.lastName, r.dateOfBirth, r.passportSeries, r.passportNumber, r.country, r.passportPhotoPath, r.videoSelfiePath, r.createdAt, r.updatedAt]
      );
    }

    // 2. Session
    const sessions = (await oldClient.query('SELECT * FROM "Session"')).rows;
    console.log("Sessions:", sessions.length);
    for (const r of sessions) {
      await newClient.query(
        `INSERT INTO "Session" (id, "userId", token, "expiresAt") VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.userId, r.token, r.expiresAt]
      );
    }

    // 3. PasswordResetToken
    const tokens = (await oldClient.query('SELECT * FROM "PasswordResetToken"')).rows;
    console.log("PasswordResetTokens:", tokens.length);
    for (const r of tokens) {
      await newClient.query(
        `INSERT INTO "PasswordResetToken" (id, "userId", token, "expiresAt") VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.userId, r.token, r.expiresAt]
      );
    }

    // 4. ProcessedTransactionNotification
    const processed = (await oldClient.query('SELECT * FROM "ProcessedTransactionNotification"')).rows;
    console.log("ProcessedTransactionNotifications:", processed.length);
    for (const r of processed) {
      await newClient.query(
        `INSERT INTO "ProcessedTransactionNotification" (id, "sheetRowKey", "createdAt") VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.sheetRowKey, r.createdAt]
      );
    }

    console.log("Migration done.");
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
