import "dotenv/config";
import mongoose from "mongoose";
import type { Server } from "node:http";
import app from "./app.js";

const isProd = process.env.NODE_ENV === "production";

function getDatabaseUri(): string {
  if (isProd) {
    const { MONGO_URI, MONGO_PASSWORD } = process.env;
    if (!MONGO_URI || !MONGO_PASSWORD) {
      throw new Error("MONGO_URI and MONGO_PASSWORD must be set in .env");
    }

    return MONGO_URI.replace("<PASSWORD>", encodeURIComponent(MONGO_PASSWORD));
  }

  const { DATABASE_LOCAL } = process.env;
  if (!DATABASE_LOCAL) {
    throw new Error("DATABASE_LOCAL must be set in .env");
  }
  return DATABASE_LOCAL;
}

const PORT = Number(process.env.PORT) || 3000;

let server: Server | undefined;

const shutdown = (exitCode = 0) => {
  if (!server) {
    process.exit(exitCode);
  }
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(exitCode);
  });
};

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

process.on("unhandledRejection", (reason: unknown) => {
  console.log('UNHANDLED REJECTION! 🧨 Shutting down...');
  if (reason instanceof Error) {
    console.error(reason.name, reason.message);
  } else {
    console.error("Unhandled rejection:", reason);
  }
  shutdown(1);
});

process.on('uncaughtException', (error: unknown) => {
  console.log('UNCAUGHT EXCEPTION! 🧨 Shutting down...');

  if(error instanceof Error) {
    console.error(error.name, error.message);
  } else {
    console.error("Uncaught exception: ", error);
  }

  shutdown(1);
})

async function main() {
  await mongoose.connect(getDatabaseUri());
  console.log(`DB connection successful (${isProd ? "cloud" : "local"}) ✅`);

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
  });
}

void main();
