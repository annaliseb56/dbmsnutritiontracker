function Navbar() {
  return (
    <nav className="bg-cream border-b-2 border-light-green sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
        {/* Left side - Logo/Brand */}
        <div>
          <h1 className="text-text-dark text-3xl font-bold tracking-tight">
            NutritionTrax
          </h1>
        </div>
        
        {/* Right side - Buttons */}
        <div className="flex gap-4">
          <button className="px-6 py-2.5 rounded-full font-semibold text-dark-green border-2 border-sage bg-transparent hover:bg-mint hover:border-dark-green hover:text-text-dark transition-all duration-300">
            Log In
          </button>
          <button className="px-6 py-2.5 rounded-full font-semibold text-cream bg-sage hover:bg-dark-green hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;