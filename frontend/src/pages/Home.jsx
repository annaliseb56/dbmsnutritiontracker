import NLogo from "../components/NLogo"
import colors from "../theme/colors"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar";

{/**
  Inspiration for this home page, from figma make. Edited to be simpler and focus more
  on getting the user to sign up or login.  
*/}

export default function App() {

    const isLoggedIn = false;
    const isSticky = false;

    return (
        //Whole
        <div className="min-h-screen" style={{ backgroundColor: colors.cream }}>

            <Navbar isLoggedIn={isLoggedIn} isSticky={isSticky}/>

            {/*Main Section*/}
            <section
                className="relative overflow-hidden"
                style={{
                    background: `
            linear-gradient(
              to top left,
              ${colors.lightGreen} 0%,   
              ${colors.mint} 50%,        
              ${colors.cream} 100%      
            )
          `,
                }}
            >
                <div className="relative max-w-7xl mx-auto px-8">
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
                                <Link to="/register">
                                    <button
                                    className="px-10 py-5 text-xl rounded-full font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                                    style={{ backgroundColor: colors.sage, color: colors.cream }}
                                    >
                                        Register Now
                                    </button>
                                </Link>
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