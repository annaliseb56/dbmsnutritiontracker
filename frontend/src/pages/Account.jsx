const API_URL = import.meta.env.VITE_API_URL || '/api';
import { useEffect, useState } from "react";
import NLogo from "../components/NLogo";
import colors from "../theme/colors";
import StatCard from "../components/StatCard";
import InputGroup from "../components/InputGroup";
import Navbar from "../components/Navbar";
import LogoutButton from "../components/LogoutButton";
import {
  Award,
  CheckCircle2,
  XCircle,
  Scale,
  Ruler,
  MessageSquare,
  Calendar,
  Trophy
} from "lucide-react";

{/**
  Used claude to help debug when deploying to production was having trouble with sessions and it would 
  continually redirect me to login page even though I had a valid session token in my cookies. To fix the issue I had
  to change nginx config file. 
  */}


export default function Account() {
  // Setup state variables
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submiting, setSubmiting] = useState(false);

  // Stats state
  const [streak, setStreak] = useState(0);
  const [mealLoggedToday, setMealLoggedToday] = useState(false);
  const [workoutLoggedToday, setWorkoutLoggedToday] = useState(false);
  const [completedGoals, setCompletedGoals] = useState(0);

  useEffect(() => {
    // Fetch account data
    fetch(`${API_URL}/account`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          window.location.href = "/login";
        } else {
          setUser(data);
          setNickname(data.nickname || "");
          setDob(data.date_of_birth || "");
          setHeight(data.height || "");
          setWeight(data.weight || "");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load account data");
        setLoading(false);
      });

    // Fetch stats data
    fetch("" + API_URL + "/account/stats", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        console.log("Stats response:", data);
        if (!data.error) {
          setStreak(data.streak || 0);
          setMealLoggedToday(data.mealLoggedToday || false);
          setWorkoutLoggedToday(data.workoutLoggedToday || false);
          setCompletedGoals(data.completedGoals || 0);
        } else {
          console.error("Stats error:", data.error);
        }
      })
      .catch(err => {
        console.error("Failed to load stats:", err);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submiting) return;

    setMessage("");
    setError("");
    setSubmiting(true);

    try {
      const res = await fetch("" + API_URL + "/account/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname || null,
          date_of_birth: dob || null,
          height: height || null,
          weight: weight || null,
        }),
      });

      const data = await res.json();
      if (res.ok) setMessage("Account updated successfully!");
      else setError(data.error || "Update failed");
    } catch {
      setError("Could not connect to backend");
    } finally {
      setSubmiting(false);
    }
  };

  const handleLogout = () => {
    fetch("" + API_URL + "/auth/logout", { credentials: "include" })
      .then(() => window.location.href = "/login");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
      <Navbar isLoggedIn={true} isSticky={true} />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-12">
        {/* General Announcements */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-solid" style={{ borderColor: colors.lightGreen }}>
          <h1 className="text-4xl font-bold mb-3 tracking-tight" style={{ color: colors.textDark }}>
            Welcome back, {nickname || user.username}!
          </h1>
          <p className="text-md opacity-70" style={{ color: colors.darkGreen }}>
            Manage your profile and track your progress.
          </p>
        </div>

        {/* STAT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={Award}
            iconBg="#fbbf24"
            value={`${streak} days`}
            label="Current Streak"
            iconColor="white"
          />
          <StatCard
            icon={CheckCircle2}
            iconBg={mealLoggedToday ? colors.mint : "#fee2e2"}
            value={mealLoggedToday ? "Logged" : "Not Logged"}
            label="Meals Today"
            iconColor={mealLoggedToday ? colors.sage : "#dc2626"}
          />
          <StatCard
            icon={XCircle}
            iconBg={workoutLoggedToday ? colors.mint : "#fee2e2"}
            value={workoutLoggedToday ? "Logged" : "Not Logged"}
            label="Workout Today"
            iconColor={workoutLoggedToday ? colors.sage : "#dc2626"}
          />
          <StatCard
            icon={Trophy}
            iconBg="#c7d2fe"
            value={`${completedGoals}`}
            label="Goals Completed"
            iconColor="#4f46e5"
          />
        </div>

        {/* PROFILE FORM */}
        <form className="bg-white p-8 rounded-2xl shadow-sm border flex flex-col gap-6" onSubmit={handleSubmit} style={{ borderColor: colors.lightGreen }}>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: colors.textDark }}>
            Profile Information
          </h2>

          {message && <p className="text-green-600 font-semibold">{message}</p>}
          {error && <p className="text-red-600 font-semibold">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup
              label="Nickname"
              Icon={MessageSquare}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter Nickname"
            />
            <InputGroup
              label="Birthdate"
              Icon={Calendar}
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <InputGroup
              label="Height"
              Icon={Ruler}
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              unit="inches"
              placeholder="Enter Height"
            />
            <InputGroup
              label="Weight"
              Icon={Scale}
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              unit="lbs"
              placeholder="Enter Weight"
            />
          </div>

          <button
            type="submit"
            className="mt-2 py-3 rounded-xl font-semibold transition hover:brightness-95"
            style={{
              backgroundColor: colors.sage,
              color: colors.cream,
              opacity: submiting ? 0.6 : 1,
              cursor: submiting ? "not-allowed" : "pointer"
            }}
            disabled={submiting}
            aria-busy={submiting}
            aria-disabled={submiting}
          >
            {submiting ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* SIGN OUT */}
        <div className="flex justify-center">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}