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
  - tailwindcss
- **Dashboard**
  - Python 3
  - Streamlit

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
    

Running the Project:

-Go to psql and do source schema.sql
-Make .env file and copy .env.example and fill in the information
-Create a venv and do pip install -r requirements.txt
-do flask run
-cd frontend, npm run dev

Running the Dashboard:

-in the terminal, navigate to the dashboard directory
-then use "streamlit run trainer_dashboard.py"

