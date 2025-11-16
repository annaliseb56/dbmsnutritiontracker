# Frontend Setup (React + Vite)

This is the frontend for the DBMS Nutrition Tracker project.

It’s a small React app that calls the backend API running at:

- `http://localhost:4000`

---

## Setup & Run

In a **new terminal** (keep the backend running), from the repo root:

```bash
cd frontend
npm install        # install frontend dependencies
npm run dev        # start Vite dev server
```

Vite will print a URL like:

Local:   http://localhost:5173/

Open that URL in your browser.

---
## What You Should See
The frontend should display a simple page that:

- Shows the API health info (from /api/health)
- Lists exercises (from /api/exercises)
- Lists meals (from /api/meals)

If those sections load without errors, the frontend is correctly talking to the backend.
