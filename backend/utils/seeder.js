const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

const User = require("../models/User");
const Record = require("../models/Record");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB Connected for seeding");
};

const users = [
  { name: "Super Admin",    email: "admin@finance.com",   password: "admin123",   role: "admin"   },
  { name: "Alice Analyst",  email: "analyst@finance.com", password: "analyst123", role: "analyst" },
  { name: "Victor Viewer",  email: "viewer@finance.com",  password: "viewer123",  role: "viewer"  },
];

const categories = {
  income:  ["salary", "freelance", "investment", "business"],
  expense: ["food", "transport", "utilities", "rent", "healthcare", "entertainment", "education", "shopping", "travel"],
};

const notes = {
  salary:        ["Monthly salary", "Annual bonus", "Salary credit"],
  freelance:     ["Client project payment", "Consulting fee", "Design work"],
  investment:    ["Stock dividends", "Mutual fund returns", "Interest earned"],
  business:      ["Product sales", "Service revenue", "Partnership income"],
  food:          ["Grocery shopping", "Restaurant dinner", "Office lunch"],
  transport:     ["Fuel refill", "Uber ride", "Train ticket"],
  utilities:     ["Electricity bill", "Internet bill", "Water bill"],
  rent:          ["Monthly rent", "Maintenance charges"],
  healthcare:    ["Doctor consultation", "Medicine purchase", "Lab tests"],
  entertainment: ["Movie tickets", "Netflix subscription", "Concert"],
  education:     ["Online course", "Books", "Workshop fee"],
  shopping:      ["Clothing", "Electronics", "Home decor"],
  travel:        ["Flight tickets", "Hotel stay", "Travel insurance"],
};

const randomBetween = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateRecords = (userId) => {
  const records = [];
  const today = new Date();

  // Generate records for last 12 months
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);

    // 2-4 income records per month
    const incomeCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < incomeCount; i++) {
      const category = randomItem(categories.income);
      const day = Math.floor(Math.random() * 28) + 1;
      records.push({
        amount: category === "salary" ? randomBetween(40000, 80000)
               : category === "investment" ? randomBetween(1000, 15000)
               : randomBetween(5000, 30000),
        type: "income",
        category,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
        note: randomItem(notes[category]),
        createdBy: userId,
      });
    }

    // 5-10 expense records per month
    const expenseCount = Math.floor(Math.random() * 6) + 5;
    for (let i = 0; i < expenseCount; i++) {
      const category = randomItem(categories.expense);
      const day = Math.floor(Math.random() * 28) + 1;
      records.push({
        amount: category === "rent" ? randomBetween(10000, 25000)
               : category === "healthcare" ? randomBetween(500, 8000)
               : randomBetween(200, 5000),
        type: "expense",
        category,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
        note: randomItem(notes[category]),
        createdBy: userId,
      });
    }
  }

  return records;
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Record.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Create users
    const createdUsers = await User.create(users);
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create records for admin user
    const adminUser = createdUsers.find((u) => u.role === "admin");
    const records = generateRecords(adminUser._id);
    await Record.insertMany(records);
    console.log(`📊 Created ${records.length} financial records`);

    console.log("\n✅ Seeding complete!\n");
    console.log("─────────────────────────────────");
    console.log("🔑 Test Credentials:");
    console.log("  Admin:   admin@finance.com   / admin123");
    console.log("  Analyst: analyst@finance.com / analyst123");
    console.log("  Viewer:  viewer@finance.com  / viewer123");
    console.log("─────────────────────────────────\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();
