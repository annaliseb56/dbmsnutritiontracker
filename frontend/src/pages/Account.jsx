import NLogo from "../components/NLogo";
import colors from "../theme/colors";
import StatCard from "../components/StatCard";
import InputGroup from "../components/InputGroup";
import Navbar from "../components/Navbar";
import {
  Award,
  CheckCircle2,
  XCircle,
  User,
  Scale,
  Ruler,
  MessageSquare,
  Calendar,
  LogOut,
  Utensils,
  Dumbbell,
  Trophy,
  Users
} from "lucide-react";


export default function Account() {
  const isLoggedIn = true;
  const isSticky = true;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
      {/*Top Navigation Menu*/}
      <Navbar isLoggedIn={isLoggedIn} isSticky={isSticky}/>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-12">
        {/* HERO SECTION */}
        <div
          className="bg-white p-8 rounded-2xl shadow-sm border"
          style={{ borderColor: colors.lightGreen }}
        >
          <h1
            className="text-4xl font-bold mb-3 tracking-tight"
            style={{ color: colors.textDark }}
          >
            Welcome back!
          </h1>
          <p className="text-md opacity-70" style={{ color: colors.darkGreen }}>
            Manage your profile and track your progress.
          </p>
        </div>

        {/* STAT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={Award}
            iconBg="red"
            value="0 days"
            label="Current Streak"
            iconColor="white"
          />
          <StatCard
            icon={CheckCircle2}
            iconBg={colors.mint}
            value="Logged"
            label="Meals Today"
            iconColor={colors.sage}
          />
          <StatCard
            icon={XCircle}
            iconBg="#fee2e2"
            value="Not Logged"
            label="Workout Today"
            iconColor="#dc2626"
          />
          <StatCard
            icon={Scale}
            iconBg="#3b82f6"
            value="No Weigh In Yet"
            label="Last Weight Update"
            iconColor="white"
          />
        </div>

        {/* PROFILE FORM */}
        <div
          className="bg-white p-8 rounded-2xl shadow-sm border flex flex-col gap-6"
          style={{ borderColor: colors.lightGreen }}
        >
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: colors.textDark }}
          >
            Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup
              label="Nickname"
              Icon={MessageSquare}
              defaultValue="Sarah"
            />
            <InputGroup
              label="Birthdate"
              Icon={Calendar}
              type="date"
              defaultValue="1995-06-15"
            />
            <InputGroup
              label="Height"
              Icon={Ruler}
              type="number"
              defaultValue="165"
              unit="cm"
            />
            <InputGroup
              label="Weight"
              Icon={Scale}
              type="number"
              defaultValue="157.5"
              unit="lbs"
            />
          </div>

          <button
            className="mt-2 py-3 rounded-xl font-semibold transition hover:brightness-95"
            style={{ backgroundColor: colors.sage, color: colors.cream }}
          >
            Save Changes
          </button>
        </div>

        {/* SIGN OUT */}
        <div className="flex justify-center">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-xl border text-red-600"
            style={{ borderColor: "#ffcaca", backgroundColor: "white" }}
          >
            <LogOut />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}