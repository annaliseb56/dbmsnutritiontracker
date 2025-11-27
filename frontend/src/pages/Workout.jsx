import React, { useState } from "react";
import Navbar from "../components/Navbar";
import colors from "../theme/colors";

/**
 * WorkoutSelector.jsx
 *
 * Usage: <WorkoutSelector isLoggedIn={true} />
 *
 * The SVG groups have ids matching the `muscleId` values below.
 * When a muscle is selected we add the 'active' class to that <g>.
 */

const MUSCLES = [
  { id: "chest", label: "Chest" },
  { id: "upper-back", label: "Upper Back / Lats" },
  { id: "lower-back", label: "Lower Back" },
  { id: "traps", label: "Traps" },
  { id: "shoulders", label: "Shoulders (Delts)" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "forearms", label: "Forearms" },
  { id: "abs", label: "Abs" },
  { id: "obliques", label: "Obliques" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "calves", label: "Calves" },
  { id: "glutes", label: "Glutes" }
];

export default function WorkoutSelector({ isLoggedIn = true }) {
  const [selected, setSelected] = useState(null);

  function toggle(id) {
    setSelected((s) => (s === id ? null : id));
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)]" style={{ "--bg": colors.cream }}>
      <Navbar isLoggedIn={isLoggedIn} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Center area: svg */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md md:max-w-lg">
              {/* Inline SVG so we can access group ids */}
              <svg
                viewBox="0 0 300 900"
                className="w-full h-auto"
                xmlns="http://www.w3.org/2000/svg"
                aria-labelledby="muscleTitle"
                role="img"
              >
                <title id="muscleTitle">Muscle diagram, selectable regions</title>

                <style>{`
                  .muscle { fill: none; stroke: #222; stroke-width: 2; stroke-linejoin: round; }
                  .muscle-shape { fill: #fff; stroke: #5a5a5a; stroke-width: 1.5; transition: fill 200ms, stroke 200ms, opacity 200ms; }
                  .active .muscle-shape { fill: #e32; stroke: #b10; opacity: 0.95; }
                  /* Add subtle shadow for selected */
                  .active { filter: drop-shadow(0 4px 8px rgba(0,0,0,0.12)); }
                `}</style>

                {/* torso: chest */}
                <g id="chest" className={selected === "chest" ? "active" : ""} onClick={() => toggle("chest")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M85 200 C78 170, 110 140, 150 140 C190 140, 222 170, 215 200 C210 220, 190 240, 150 240 C110 240, 90 220, 85 200 Z" />
                </g>

                {/* shoulders */}
                <g id="shoulders" className={selected === "shoulders" ? "active" : ""} onClick={() => toggle("shoulders")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M60 170 C46 160, 42 150, 60 140 C78 130, 96 130, 110 140 L110 160 C95 165, 78 170, 60 170 Z" />
                  <path className="muscle-shape" d="M240 170 C254 160, 258 150, 240 140 C222 130, 204 130, 190 140 L190 160 C205 165, 222 170, 240 170 Z" />
                </g>

                {/* upper back / lats */}
                <g id="upper-back" className={selected === "upper-back" ? "active" : ""} onClick={() => toggle("upper-back")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M65 240 C55 280, 70 320, 90 360 C120 400, 180 400, 210 360 C230 320, 245 280, 235 240 C200 270, 100 270, 65 240 Z" />
                </g>

                {/* lower back */}
                <g id="lower-back" className={selected === "lower-back" ? "active" : ""} onClick={() => toggle("lower-back")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M95 360 C100 410, 120 460, 150 480 C180 460, 200 410, 205 360 C175 380, 125 380, 95 360 Z" />
                </g>

                {/* traps (upper center) */}
                <g id="traps" className={selected === "traps" ? "active" : ""} onClick={() => toggle("traps")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M130 120 C140 110, 160 110, 170 120 C180 130, 160 150, 150 150 C140 150, 120 130, 130 120 Z" />
                </g>

                {/* arms - biceps/triceps/forearms (left) */}
                <g id="biceps" className={selected === "biceps" ? "active" : ""} onClick={() => toggle("biceps")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M45 250 C30 260, 28 295, 40 330 C60 360, 70 340, 70 320 C66 300, 60 280, 45 250 Z" />
                </g>

                <g id="triceps" className={selected === "triceps" ? "active" : ""} onClick={() => toggle("triceps")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M255 250 C270 260, 272 295, 260 330 C240 360, 230 340, 230 320 C234 300, 240 280, 255 250 Z" />
                </g>

                <g id="forearms" className={selected === "forearms" ? "active" : ""} onClick={() => toggle("forearms")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M60 330 C55 360, 65 390, 85 410 C92 405, 85 380, 80 360 C70 345, 65 335, 60 330 Z" />
                  <path className="muscle-shape" d="M240 330 C245 360, 235 390, 215 410 C208 405, 215 380, 220 360 C230 345, 235 335, 240 330 Z" />
                </g>

                {/* abs */}
                <g id="abs" className={selected === "abs" ? "active" : ""} onClick={() => toggle("abs")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M130 250 C135 290, 140 320, 150 340 C160 320, 165 290, 170 250 C150 260, 150 260, 130 250 Z" />
                </g>

                {/* obliques */}
                <g id="obliques" className={selected === "obliques" ? "active" : ""} onClick={() => toggle("obliques")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M90 280 C70 300, 70 340, 100 360 C110 340, 110 310, 90 280 Z" />
                  <path className="muscle-shape" d="M210 280 C230 300, 230 340, 200 360 C190 340, 190 310, 210 280 Z" />
                </g>

                {/* glutes */}
                <g id="glutes" className={selected === "glutes" ? "active" : ""} onClick={() => toggle("glutes")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M120 480 C100 500, 100 540, 130 560 C150 545, 180 545, 200 560 C230 540, 230 500, 210 480 C170 490, 140 490, 120 480 Z" />
                </g>

                {/* quads */}
                <g id="quads" className={selected === "quads" ? "active" : ""} onClick={() => toggle("quads")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M120 560 C110 610, 115 680, 130 720 C150 700, 155 640, 150 600 C140 580, 130 570, 120 560 Z" />
                  <path className="muscle-shape" d="M180 560 C190 610, 185 680, 170 720 C150 700, 145 640, 150 600 C160 580, 170 570, 180 560 Z" />
                </g>

                {/* hamstrings */}
                <g id="hamstrings" className={selected === "hamstrings" ? "active" : ""} onClick={() => toggle("hamstrings")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M110 720 C100 760, 100 790, 120 810 C135 800, 130 760, 125 740 C120 730, 115 725, 110 720 Z" />
                  <path className="muscle-shape" d="M190 720 C200 760, 200 790, 180 810 C165 800, 170 760, 175 740 C180 730, 185 725, 190 720 Z" />
                </g>

                {/* calves */}
                <g id="calves" className={selected === "calves" ? "active" : ""} onClick={() => toggle("calves")} style={{ cursor: "pointer" }}>
                  <path className="muscle-shape" d="M125 800 C120 820, 125 840, 140 850 C150 840, 145 820, 140 800 C132 800, 128 800, 125 800 Z" />
                  <path className="muscle-shape" d="M175 800 C180 820, 175 840, 160 850 C150 840, 155 820, 160 800 C168 800, 172 800, 175 800 Z" />
                </g>

                {/* small head */}
                <g id="head">
                  <circle cx="150" cy="90" r="28" className="muscle-shape" />
                </g>
              </svg>
            </div>
          </div>

          {/* Right side: list */}
          <aside className="w-full md:w-80">
            <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: `1px solid ${colors.lightGreen}` }}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: colors.darkGreen }}>Select muscle group</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {MUSCLES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    className={`text-sm px-3 py-2 rounded-xl text-left transition-shadow w-full ${selected === m.id ? "ring-2 ring-offset-2" : ""}`}
                    style={{
                      backgroundColor: selected === m.id ? colors.sage : colors.cream,
                      color: selected === m.id ? colors.cream : colors.darkGreen,
                      border: `1px solid ${colors.lightGreen}`
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">Tip: tap a muscle to highlight it on the diagram.</p>
                <p className="text-xs">You can hook selection to workouts, meal suggestions, or logsets in your app.</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2 rounded-full font-medium"
                  style={{ backgroundColor: colors.cream, color: colors.darkGreen, border: `1px solid ${colors.lightGreen}` }}
                >
                  Clear
                </button>
                <button
                  onClick={() => { if (selected) window.alert(`Selected: ${selected}`); else window.alert("No muscle selected"); }}
                  className="flex-1 py-2 rounded-full font-medium"
                  style={{ backgroundColor: colors.sage, color: colors.cream }}
                >
                  Use selection
                </button>
              </div>
            </div>

            {/* small reference / legend */}
            <div className="mt-4 text-xs text-gray-600">
              <p>Reference image used for art at:</p>
              <code className="block break-all mt-1 text-xs bg-[color:var(--bg2)] p-2 rounded" style={{ backgroundColor: colors.tan }}>
                /mnt/data/a8e3a585-f668-47f9-94fb-4ba1c785cd6c.png
              </code>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
