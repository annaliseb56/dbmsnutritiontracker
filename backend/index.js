const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// --- temporary fake data (replace with real DB later) ---
const exercises = [
  { id: 1, name: "Bench Press", category: "strength", muscle_groups: ["chest", "triceps"] },
  { id: 2, name: "Squat",       category: "strength", muscle_groups: ["legs", "glutes"] }
];

const meals = [
  { id: 1, name: "Grilled Chicken", calories: 350, protein_g: 30 },
  { id: 2, name: "Oatmeal",         calories: 250, protein_g: 10 }
];

// health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// list exercises
app.get("/api/exercises", (req, res) => {
  res.json(exercises);
});

// list meals
app.get("/api/meals", (req, res) => {
  res.json(meals);
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});
