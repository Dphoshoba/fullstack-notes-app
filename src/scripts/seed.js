import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import { Note } from "../models/Note.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";

const seed = async () => {
  await connectDatabase();

  await Promise.all([User.deleteMany({}), Note.deleteMany({}), RefreshToken.deleteMany({})]);

  const [user] = await User.create([
    {
      name: "Demo User",
      email: "demo@example.com",
      password: "Password123!"
    },
    {
      name: "Admin User",
      email: "admin@example.com",
      password: "Password123!",
      role: "admin"
    },
    {
      name: "Super Admin",
      email: "superadmin@example.com",
      password: "Password123!",
      role: "superadmin"
    }
  ]);

  await Note.create([
    {
      owner: user.id,
      title: "Welcome",
      body: "This protected note belongs to the demo user.",
      tags: ["demo"],
      pinned: true
    },
    {
      owner: user.id,
      title: "Next steps",
      body: "Register, log in, then create your own notes.",
      tags: ["api", "auth"]
    }
  ]);

  console.log("Seed complete");
  console.log("Demo user: demo@example.com / Password123!");
  console.log("Admin user: admin@example.com / Password123!");
  console.log("Super admin: superadmin@example.com / Password123!");

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
