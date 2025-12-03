# React + Vite
# Frontend – DBMS Nutrition Tracker

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
This is the React frontend for our DBMS Nutrition Tracker project.

Currently, two official plugins are available:
- Built with **React + Vite**
- Talks to the **Flask backend** running on `http://127.0.0.1:5000`
- Currently shows:
  - API health info
  - A list of exercises
  - A list of meals

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
---

## React Compiler
## Prerequisites

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
- **Node.js** (v18+ recommended)
- **npm**

## Expanding the ESLint configuration
Check with:

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
```bash
node -v
npm -v
```

---

## Set Up

From the project root:

```bash
cd frontend
npm install
```

This installs all frontend dependencies.


---

## Running the Frontend


Make sure the Flask backend is already running on http://127.0.0.1:5000 (from backend/ with python app.py).


Then, in a new terminal:

```bash
cd frontend
npm run dev
```


Vite will print a URL like:

  - Local:   http://localhost:5173/


Open that URL in your browser.

---

## What the App Does Right Now

On page load, the app calls:

- GET http://127.0.0.1:5000/api/health
- GET http://127.0.0.1:5000/api/exercises
- GET http://127.0.0.1:5000/api/meals


and displays:
- Health status JSON
- A list of exercises (name, category, muscle groups)
- A list of meals (name, calories, protein)

  
If the backend isn’t running or the URL/port is wrong, the app shows an error message.

---

## Helpful Notes

Frontend code lives in src/ (main entry is src/App.jsx).

If you change the backend port or URL, update API_BASE in App.jsx.

Do not commit node_modules/ — it’s ignored via .gitignore.
