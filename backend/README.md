# Backend Setup (API)

This is the backend API for the DBMS Nutrition Tracker project.

It currently exposes:

- `GET /api/health` – health check
- `GET /api/exercises` – returns fake exercise data
- `GET /api/meals` – returns fake meal data

---

## Setup & Run

From the **repo root**:

```bash
cd backend
npm install        # install dependencies (Express, CORS, nodemon, etc.)
npm run dev        # start backend in dev mode

You should see something like:
Backend API listening on http://localhost:4000


Quick Tests
Use a browser, curl, or a tool like Postman to hit:
http://localhost:4000/api/health
http://localhost:4000/api/exercises
http://localhost:4000/api/meals
If those endpoints return JSON, the backend is working correctly.

You can save that as `backend/README.md` so your teammates know exactly how to get just the API running.
