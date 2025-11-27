import { useEffect, useState } from "react";
import NLogo from "../components/NLogo";
import colors from "../theme/colors";
import StatCard from "../components/StatCard";
import InputGroup from "../components/InputGroup";
import Navbar from "../components/Navbar";
import {
  Award,
  CheckCircle2,
  XCircle,
  Scale,
  Ruler,
  MessageSquare,
  Calendar,
  LogOut
} from "lucide-react";

export default function Account() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/account", { credentials: "include" })
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await fetch("http://localhost:5000/account/update", {
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
    }
  };

  const handleLogout = () => {
    fetch("http://localhost:5000/auth/logout", { credentials: "include" })
      .then(() => window.location.href = "/login");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
      <Navbar isLoggedIn={true} isSticky={true} />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-12">
        {/* HERO SECTION */}
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
          <StatCard icon={Award} iconBg="red" value="0 days" label="Current Streak" iconColor="white" />
          <StatCard icon={CheckCircle2} iconBg={colors.mint} value="Logged" label="Meals Today" iconColor={colors.sage} />
          <StatCard icon={XCircle} iconBg="#fee2e2" value="Not Logged" label="Workout Today" iconColor="#dc2626" />
          <StatCard icon={Scale} iconBg="#3b82f6" value={weight || "No Weigh In Yet"} label="Last Weight Update" iconColor="white" />
        </div>

        {/* PROFILE FORM */}
        <form className="bg-white p-8 rounded-2xl shadow-sm border flex flex-col gap-6" onSubmit={handleSubmit} style={{ borderColor: colors.lightGreen }}>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: colors.textDark }}>
            Profile Information
          </h2>

          {message && <p className="text-green-600">{message}</p>}
          {error && <p className="text-red-600">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Nickname" Icon={MessageSquare} value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <InputGroup label="Birthdate" Icon={Calendar} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            <InputGroup label="Height" Icon={Ruler} type="number" value={height} onChange={(e) => setHeight(e.target.value)} unit="cm" />
            <InputGroup label="Weight" Icon={Scale} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} unit="lbs" />
          </div>

          <button type="submit" className="mt-2 py-3 rounded-xl font-semibold transition hover:brightness-95" style={{ backgroundColor: colors.sage, color: colors.cream }}>
            Save Changes
          </button>
        </form>

        {/* SIGN OUT */}
        <div className="flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl border text-red-600" style={{ borderColor: "#ffcaca", backgroundColor: "white" }} onClick={handleLogout}>
            <LogOut />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}