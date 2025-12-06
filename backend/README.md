# Backend – DBMS Nutrition Tracker

This is the **Flask backend** for our DBMS Nutrition Tracker project.

- Built with **Python + Flask**
- Exposes a small JSON API
- Currently uses **in-memory fake data** for exercises and meals  
  (will be replaced with a real database later)

---

## Prerequisites

- **Python 3** (3.9+ recommended)
- Optionally: `pip` and `venv` (usually come with Python)

Check:

```bash
python3 --version
```

---

## Setup
From the project root:

```bash
cd backend
python3 -m venv .venv           # create virtual environment (first time only)
source .venv/bin/activate       # activate venv (Mac/Linux)
```

Install dependencies:

```bash
pip install -r requirements.txt
If requirements.txt is missing or outdated:
pip install flask flask-cors
pip freeze > requirements.txt
```


---

## Running the Backend
With the virtual environment activated:

```bash
cd backend
source .venv/bin/activate       # if not already active
python app.py
```
You should see something like:

 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000


The backend will now be available at:
http://127.0.0.1:5000

---

## API Endpoints
Current endpoints (using in-memory sample data):

```bash
GET /
```
Simple text message to confirm the backend is running.

```bash
GET /api/health
```
Returns a JSON health check, e.g.:
```bash
{
  "status": "ok",
  "message": "Flask backend is running"
}
```
```bash
GET /api/exercises
```
Returns a list of fake exercises:
```bash
[
  {
    "id": 1,
    "name": "Bench Press",
    "category": "strength",
    "muscle_groups": ["chest", "triceps"]
  },
  ...
]
```
```bash
GET /api/meals
```
Returns a list of fake meals:
```bash
[
  {
    "id": 1,
    "name": "Grilled Chicken",
    "calories": 350,
    "protein_g": 30
  },
  ...
]
```
---

## Quick Test
With the server running, open any browser and visit:

- http://127.0.0.1:5000/
- http://127.0.0.1:5000/api/health
- http://127.0.0.1:5000/api/exercises
- http://127.0.0.1:5000/api/meals

If those return text/JSON, the backend is working.


---

## Notes for Development

Don’t commit the virtual environment: .venv/ is ignored via .gitignore.

When we add a real database, we’ll:

- Replace the in-memory exercises and meals lists in app.py
- Add POST/PUT/DELETE endpoints for logging workouts and meals
- Make sure the backend is running before starting the React frontend, so the frontend can call these endpoints.
