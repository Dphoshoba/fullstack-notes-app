// Example migration: ensure a composite index for workspace notes
import { Note } from "../models/Note.js";

export async function up() {
  await Note.collection.createIndexes([
    { key: { organizationId: 1, updatedAt: -1 }, name: "idx_org_updated" }
  ]);
  console.log("Created org updatedAt index");
}

export async function down() {
  await Note.collection.dropIndex("idx_org_updated").catch(() => {});
  console.log("Dropped org updatedAt index");
}
