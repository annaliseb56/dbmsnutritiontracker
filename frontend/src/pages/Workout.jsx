const API_URL = import.meta.env.VITE_API_URL || '/api';
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LogoutButton from "../components/LogoutButton";
import AddExerciseModal from "../components/AddExerciseModal";
import ManageExerciseModal from "../components/ManageExercisesModal";
import CreateWorkoutModal from "../components/CreateWorkoutModal";
import LogWorkoutModal from "../components/LogWorkoutModal";
import ManageWorkoutModal from "../components/ManageWorkoutModal";
import LoggedWorkoutsCard from "../components/loggedWorkoutsCard";
import colors from "../theme/colors";

{/**Used CHATGPT to help with the design of the website and ensure that all of the cards on the website were properly aligned. 
    Additionally, used it to help ensure the modals are working as intended. */}
export default function Workout() {
  const isLoggedIn = true;
  const isSticky = false;

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openManageModal, setOpenManageModal] = useState(false);
  const [openLogWorkout, setOpenLogWorkout] = useState(false);
  const [openManageWorkout, setOpenManageWorkout] = useState(false);
  const [openCreateWorkout, setOpenCreateWorkout] = useState(false);
  const [refreshLoggedWorkouts, setRefreshLoggedWorkouts] = useState(0);

  const isAnyModalOpen =
    openAddModal ||
    openManageModal ||
    openLogWorkout ||
    openManageWorkout ||
    openCreateWorkout;

  const buttonClass = `
    px-6 py-3 rounded-xl font-semibold transition-colors
    bg-sage text-cream hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sage
  `;

  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({});
  const [allExercises, setAllExercises] = useState([]);

  // Load exercise subcategories
  useEffect(() => {
    async function loadSubcats() {
      try {
        const res = await fetch("" + API_URL + "/exercises/subcategories", {
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

  // Load exercises when the Create Workout modal opens
  useEffect(() => {
    if (!openCreateWorkout) return;

    async function loadExercises() {
      try {
        const res = await fetch("" + API_URL + "/exercises/search", {
          credentials: "include",
        });
        const data = await res.json();
        setAllExercises(data.exercises || []);
      } catch (err) {
        console.error("Failed to load exercises:", err);
      }
    }

    loadExercises();
  }, [openCreateWorkout]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
      <Navbar isLoggedIn={isLoggedIn} isSticky={isSticky} />

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-center" style={{ color: colors.textDark }}>
          Workouts
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

        {/* Workouts Card */}
        <div className="p-6 rounded-xl border-2 bg-white" style={{ borderColor: colors.mint }}>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.sage }}>
            Workouts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              className={buttonClass + " w-full"}
              disabled={isAnyModalOpen}
              onClick={() => setOpenLogWorkout(true)}
            >
              Log Workout
            </button>

            <button
              className={buttonClass + " w-full"}
              disabled={isAnyModalOpen}
              onClick={() => setOpenManageWorkout(true)}
            >
              Manage Workouts
            </button>

            <button
              className={buttonClass + " w-full"}
              disabled={isAnyModalOpen}
              onClick={() => setOpenCreateWorkout(true)}
            >
              Create New Workout
            </button>
          </div>
        </div>

        {/* Logged Workouts Card */}
        <LoggedWorkoutsCard key={refreshLoggedWorkouts} />
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
      <LogWorkoutModal
        isOpen={openLogWorkout}
        onClose={() => setOpenLogWorkout(false)}
        onWorkoutLogged={() => setRefreshLoggedWorkouts((prev) => prev + 1)}
      />
      <ManageWorkoutModal
        isOpen={openManageWorkout}
        onClose={() => setOpenManageWorkout(false)}
      />
      <CreateWorkoutModal
        isOpen={openCreateWorkout}
        onClose={() => setOpenCreateWorkout(false)}
        exercises={allExercises}
      />
    </div>
  );
}