import { useState } from "react";
import colors from "../theme/colors";

export default function Register() {
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordIssues, setPasswordIssues] = useState([]);

  function validatePassword(pw) {
    const issues = [];
    if (pw.length < 8) issues.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) issues.push("At least one uppercase letter");
    if (!/[a-z]/.test(pw)) issues.push("At least one lowercase letter");
    if (!/[0-9]/.test(pw)) issues.push("At least one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw))
      issues.push("A special character → !@#$%^&*(),.?\":{}|<>");
    return issues;
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setPasswordIssues([]);

    const issues = validatePassword(password);
    if (issues.length > 0) {
      setPasswordIssues(issues);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setError("Invalid date format (must be YYYY-MM-DD)");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, dob, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      window.location.href = "/account";
    } catch {
      setError(
        "Could not connect to backend. Check if backend is running and .env is configured."
      );
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: colors.sage }}
    >
      <div
        className="p-10 rounded-2xl shadow-xl w-full max-w-md"
        style={{ backgroundColor: colors.lightGreen }}
      >
        <h1
          className="text-3xl font-bold mb-6 text-center"
          style={{ color: colors.textDark }}
        >
          Register
        </h1>

        <form className="space-y-5" onSubmit={handleRegister}>
          {error && <p className="text-red-600 text-center">{error}</p>}

          {passwordIssues.length > 0 && (
            <ul className="text-red-600 text-sm">
              {passwordIssues.map((issue, i) => (
                <li key={i}>• {issue}</li>
              ))}
            </ul>
          )}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-lg outline-none"
            style={{ backgroundColor: colors.cream }}
          />

          <input
            type="date"
            placeholder="Date of Birth"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full p-3 rounded-lg outline-none"
            style={{ backgroundColor: colors.cream }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordIssues(validatePassword(e.target.value));
            }}
            className="w-full p-3 rounded-lg outline-none"
            style={{ backgroundColor: colors.cream }}
          />

          <input
            type="password"
            placeholder="Re-enter Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 rounded-lg outline-none"
            style={{ backgroundColor: colors.cream }}
          />

          <button
            type="submit"
            className="w-full py-3 rounded-full font-semibold transition-all duration-300 hover:brightness-90"
            style={{ backgroundColor: colors.sage, color: colors.cream }}
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
