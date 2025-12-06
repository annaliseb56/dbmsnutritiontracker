//App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register"
import Account from "./pages/Account.jsx"
import Meals from "./pages/Meals.jsx";
import Goals from "./pages/Goals.jsx";
import Workout from "./pages/Workout.jsx";
import Friends from "./pages/Friends.jsx";
import Track from "./pages/Track.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/account" element={<Account />} />
      <Route path="/meals" element={<Meals />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/workout" element={<Workout />} />
      <Route path="/friends" element={<Friends />} />
      <Route path="/track" element={<Track />} />
    </Routes>
  );
}