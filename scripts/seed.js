const { writeFileSync, mkdirSync, existsSync } = require("fs");
const { join } = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const password = "lab123456";
const hash = bcrypt.hashSync(password, 10);
const now = new Date().toISOString();

const users = [
  {
    id: uuid(),
    email: "admin@kansaialtan.com",
    passwordHash: hash,
    name: "Admin Kullanici",
    lab: "admin",
    role: "admin",
    department: "Yonetim",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuid(),
    email: "analiz@kansaialtan.com",
    passwordHash: hash,
    name: "Analiz Uzmani",
    lab: "analiz",
    role: "analiz_member",
    department: "Analiz Laboratuvari",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuid(),
    email: "proses@kansaialtan.com",
    passwordHash: hash,
    name: "Proses Muhendisi",
    lab: "proses",
    role: "lab_member",
    department: "Proses Laboratuvari",
    createdAt: now,
    updatedAt: now,
  },
];

writeFileSync(join(dataDir, "users.json"), JSON.stringify(users, null, 2));
writeFileSync(join(dataDir, "documents.json"), "[]");
writeFileSync(join(dataDir, "samples.json"), "[]");
writeFileSync(join(dataDir, "requests.json"), "[]");
writeFileSync(join(dataDir, "footnotes.json"), "[]");

console.log("Seed data created successfully!");
console.log("Users:");
users.forEach((u) => {
  console.log("  " + u.email + " (" + u.role + ") - password: " + password);
});
