import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { Tour } from "../models/tourModel.js";

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

async function readTours(): Promise<Record<string, unknown>[]> {
  const file = path.join(import.meta.dirname, "../dev-data/tours-data.json");
  return JSON.parse(await fs.readFile(file, "utf-8"));
}

async function importData() {
  const tours = await readTours();
  await Tour.create(tours);
  console.log("Data successfully loaded!");
}

async function deleteData() {
  await Tour.deleteMany();
  console.log("Data successfully deleted!");
}

async function main() {
  const flag = process.argv[2];
  if (flag !== "--import" && flag !== "--delete") {
    console.error("Usage: import-dev-data.ts --import | --delete");
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(getDatabaseUri());
  console.log(`DB connection successful (${isProd ? "cloud" : "local"}) ✅`);

  try {
    if (flag === "--import") await importData();
    else await deleteData();
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
