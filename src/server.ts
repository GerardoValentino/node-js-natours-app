import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const isProd = process.env.NODE_ENV === "production";

function getDatabaseUri(): string {
  if (isProd) {
    const { MONGO_URI, MONGO_PASSWORD } = process.env;
    if (!MONGO_URI || !MONGO_PASSWORD) {
      throw new Error("MONGO_URI and MONGO_PASSWORD must be set in .env");
    }

    console.log(MONGO_URI.replace("<PASSWORD>", encodeURIComponent(MONGO_PASSWORD)))
    return MONGO_URI.replace("<PASSWORD>", encodeURIComponent(MONGO_PASSWORD));
  }

  const { DATABASE_LOCAL } = process.env;
  if (!DATABASE_LOCAL) {
    throw new Error("DATABASE_LOCAL must be set in .env");
  }
  return DATABASE_LOCAL;
}

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  await mongoose.connect(getDatabaseUri());
  console.log(`DB connection successful (${isProd ? "cloud" : "local"}) ✅`);

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
