import NLogo from "./NLogo";
import colors from "../theme/colors";
import { Utensils, Dumbbell, Trophy, Users, User, House, LineChart } from "lucide-react";
import { Link } from "react-router-dom";

const loggedInItems = [
  { icon: Utensils, label: "Meals", to: "/meals" },
  { icon: Dumbbell, label: "Workout", to: "/workout" },
  { icon: Trophy, label: "Goals", to: "/goals" },
  { icon: Users, label: "Friends", to: "/friends" },
  { icon: LineChart, label: "Track", to: "/track" },
];

const LoggedInLinks = () => (
  <div className="hidden md:flex items-center">
    <div className="flex items-center gap-2 mr-10">
      {loggedInItems.map((item) => (
        <Link to={item.to} key={item.label}>
          <button
            key={item.label}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition hover:shadow-sm"
            style={{
              backgroundColor: colors.cream,
              border: `1px solid ${colors.lightGreen}`,
              color: colors.textDark,
            }}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        </Link>
      ))}
    </div>
    <Link to="/account">
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-sm"
        style={{ backgroundColor: colors.sage, color: colors.cream }}>
        <House className="w-5 h-5" />
      </button>
    </Link>
  </div>
);

const LoggedOutLinks = ({ colors }) => (
  <div className="flex gap-4">
    <Link to="/login">
      <button
        className="px-6 py-2.5 rounded-full font-semibold transition-all duration-300"
        style={{ color: colors.darkGreen }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.outline = `2px solid ${colors.sage}`)
        }
        onMouseLeave={(e) => (e.currentTarget.style.outline = `none`)}
      >
        Sign In
      </button>
    </Link>
    <Link to="/register">
      <button
        className="px-6 py-2.5 rounded-full font-semibold transition-all duration-300 hover:brightness-90"
        style={{ backgroundColor: colors.sage, color: colors.cream }}
      >
        Register
      </button>
    </Link>
  </div>
);

export default function Navbar({ isLoggedIn, isSticky }) {
  return (
    <nav
      className={`z-50 shadow-sm w-full ${isSticky ? "sticky top-0" : ""}`}
      style={{
        backgroundColor: colors.cream,
        borderBottom: `2px solid ${colors.lightGreen}`,
      }}
    >
      {/* This is the main container that applies max-width and horizontal padding */}
      <div className="relative max-w-7xl mx-auto px-8">
        {/* This header applies flexbox (flex) and justification (justify-between) to align items */}
        <header className="flex justify-between items-center py-4">
          {/* Logo and Name Group (Left Side) */}
          <div className="flex items-center gap-2">
            {/* Logo Top */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.sage }}
            >
              <NLogo className="w-5 h-5" color={colors.cream} />
            </div>
            {/* Name Top */}
            <span
              className="text-md font-semibold tracking-wide"
              style={{ color: colors.darkGreen }}
            >
              NutritionTrax
            </span>
          </div>

          {/* Buttons/Links Group (Right Side) */}
          {isLoggedIn ? (
            <LoggedInLinks colors={colors} />
          ) : (
            <LoggedOutLinks colors={colors} />
          )}
        </header>
      </div>
    </nav>
  );
}