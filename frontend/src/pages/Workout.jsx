import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LogoutButton from "../components/LogoutButton";
import AddExerciseModal from "../components/AddExerciseModal";
import ManageExerciseModal from "../components/ManageExercisesModal";
import colors from "../theme/colors";

export default function Exercises() {
  const isLoggedIn = true;
  const isSticky = false;

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openManageModal, setOpenManageModal] = useState(false);

  const isAnyModalOpen = openAddModal || openManageModal;

  const buttonClass = `
    px-6 py-3 rounded-xl font-semibold transition-colors
    bg-sage text-cream hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sage
  `;

  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({});

  useEffect(() => {
    async function loadSubcats() {
      try {
        const res = await fetch("http://localhost:5000/exercises/subcategories", {
          credentials: "include",
        });
        const data = await res.json();
        setSubcategoriesByCategory(data);
      } catch (err) {
        console.error("Failed to load subcategories:", err);
      }
    }

    loadSubcats();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
      {/* Navbar */}
      <Navbar isLoggedIn={isLoggedIn} isSticky={isSticky} />

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center" style={{ color: colors.textDark }}>
          Exercises
        </h1>

        {/* Exercises Card */}
        <div className="p-6 rounded-xl border-2 bg-white" style={{ borderColor: colors.mint }}>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.sage }}>
            Manage Your Exercises
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              className={buttonClass + " w-full"}
              disabled={isAnyModalOpen}
              onClick={() => setOpenManageModal(true)}
            >
              Manage Exercises
            </button>

            <button
              className={buttonClass + " w-full"}
              disabled={isAnyModalOpen}
              onClick={() => setOpenAddModal(true)}
            >
              Add Exercise
            </button>
          </div>
        </div>
      </main>

      <div className="flex justify-center pb-4">
        <LogoutButton />
      </div>

      {/* Modals */}
      <AddExerciseModal
        isOpen={openAddModal}
        onClose={() => setOpenAddModal(false)}
        subcategoriesByCategory={subcategoriesByCategory}
      />

      <ManageExerciseModal
        isOpen={openManageModal}
        onClose={() => setOpenManageModal(false)}
        subcategoriesByCategory={subcategoriesByCategory}
      />
    </div>
  );
}