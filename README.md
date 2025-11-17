# DBMS Nutrition Tracker

Full-stack web app for our DBMS project.

- **Backend:** Python + Flask (simple API with in-memory data for now)
- **Frontend:** React (Vite) calling the Flask API
- **Goal:** Track exercises and meals, then later plug into a real relational database and analytics layer.

---

## Tech Stack

- **Backend**
  - Python 3
  - Flask
  - Flask-CORS
- **Frontend**
  - React
  - Vite
  - npm / Node.js

---

## Project Structure

```text
dbmsnutritiontracker/  (or fitness-app/)
  backend/             # Flask API (Python)
    app.py
    requirements.txt   # generated with pip freeze (optional)
    .venv/             # local virtualenv (not committed)
  frontend/            # React SPA (Vite)
    package.json
    vite.config.js
    src/
      App.jsx
      main.jsx
