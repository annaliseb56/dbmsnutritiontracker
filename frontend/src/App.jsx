import NLogo from "./components/NLogo";

export default function App() {
  const colors = {
    cream: '#FAF7F0',
    mint: '#E8F5E9',
    lightGreen: '#C8E6C9',
    sage: '#8BA887',
    darkGreen: '#4A5E4A',
    textDark: '#2C3E2E',
    tan: '#e0dbcfff'
  }; //Colors from figma

  return (
    //Whole
    <div className="min-h-screen" style={{ backgroundColor: colors.cream }}>
      {/*Main Section*/}
      <section
        className="relative overflow-hidden"
        style={{
          background: `
            linear-gradient(
              to top left,
              ${colors.lightGreen} 0%,   /* bottom-right and bottom-left: noticeable green */
              ${colors.mint} 50%,        /* middle: softer green */
              ${colors.cream} 100%       /* top-left: cream for readability */
            )
          `,
        }}
      >
        <div className="relative max-w-7xl mx-auto px-8">
          <header className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              {/*Logo Top*/}
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.sage }}>
                <NLogo className="w-6 h-6" color={colors.cream} />
              </div>
              {/*Name Top*/}
              <span className="text-2xl font-bold" style={{ color: colors.darkGreen }}>NutritionTrax</span>
            </div>
            {/*Buttons*/}
            <div className="flex gap-4">
              <button
                className="px-6 py-2.5 rounded-full font-semibold transition-all duration-300"
                style={{
                  color: colors.darkGreen,
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.outline = `2px solid ${colors.sage}`)}
                onMouseLeave={(e) => (e.currentTarget.style.outline = 'none')}
              >
                Sign In
              </button>
              <button
                className="px-6 py-2.5 rounded-full font-semibold transition-all duration-300 hover:brightness-90"
                style={{ backgroundColor: colors.sage, color: colors.cream }}
              >
                Register
              </button>
            </div>
          </header>

          <div className="max-w-3xl mx-auto text-center py-32">
            <div className="space-y-8">

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight" style={{ color: colors.textDark }}>
                Track Your Nutrition,{" "}
                <span style={{ color: colors.sage }}>Transform Your Life</span>
              </h1>

              <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: colors.darkGreen }}>
                The best way to successfully track you diet, and workouts to ensure that you are on the right path for you.
              </p>

              <div>
                <button
                  className="px-10 py-5 text-xl rounded-full font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  style={{ backgroundColor: colors.sage, color: colors.cream }}
                >
                  Register Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12" style={{ backgroundColor: colors.tan }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.sage }}>
                <NLogo className="w-6 h-6" color={colors.cream} />
              </div>
              <span className="text-2xl font-bold" style={{ color: colors.textDark }}>NutritionTrax</span>
            </div>
            <p className="text-center" style={{ color: colors.darkGreen }}>
              © 2025 NutritionTrax. Track the calories and the rest will take
              care of itself.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}