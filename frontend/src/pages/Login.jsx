import { useState } from "react";
import colors from "../theme/colors";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLoginAttempt(e) {
    e.preventDefault();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username, password})
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      window.location.href = "/account";
    } catch (err) {
      setError("Likely could not connect with backend, check backend running and .env");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ backgroundColor: colors.sage }}>

      <div className="p-10 rounded-2xl shadow-xl w-full max-w-md"
           style={{ backgroundColor: colors.lightGreen }}>
        
        <h1 className="text-3xl font-bold mb-6 text-center"
            style={{ color: colors.textDark }}>
          Login
        </h1>

        <form className="space-y-5" onSubmit={handleLoginAttempt}>
          
          {error && (<p className="text-red-600 text-center">{error}</p>)}          

          <input
            type="username"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-lg outline-none"
            style={{backgroundColor: colors.cream}}/>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg outline-none"
            style={{ backgroundColor: colors.cream }}
          />

          <button
            type="submit"
            className="w-full py-3 rounded-full font-semibold transition-all duration-300 hover:brightness-90"
            style={{ backgroundColor: colors.sage, color: colors.cream }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}