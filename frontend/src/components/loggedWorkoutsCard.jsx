const API_URL = import.meta.env.VITE_API_URL || '/api';
import React, { useState, useEffect } from "react";
import colors from "../theme/colors";

export default function LoggedWorkoutsCard({ onRefresh }) {
    const [loggedWorkouts, setLoggedWorkouts] = useState([]);
    const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);
    const [workoutExercises, setWorkoutExercises] = useState({});
    const [searchName, setSearchName] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [filteredWorkouts, setFilteredWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load logged workouts on mount
    useEffect(() => {
        loadWorkouts();
    }, []);

    // Expose refresh function through parent callback
    useEffect(() => {
        if (onRefresh) {
            onRefresh(loadWorkouts);
        }
    }, [onRefresh]);

    // Filter workouts based on search
    useEffect(() => {
        let filtered = loggedWorkouts;

        if (searchName) {
            filtered = filtered.filter((w) =>
                w.name.toLowerCase().includes(searchName.toLowerCase())
            );
        }

        if (searchDate) {
            filtered = filtered.filter((w) => {
                return w.workout_date.includes(searchDate);
            });
        }

        setFilteredWorkouts(filtered);
    }, [loggedWorkouts, searchName, searchDate]);

    const loadWorkouts = async () => {
        setLoading(true);
        try {
            const res = await fetch("" + API_URL + "/logged-workouts", {
                credentials: "include",
            });
            const data = await res.json();

            if (data.workouts) {
                const sorted = data.workouts.sort(
                    (a, b) => new Date(b.workout_date) - new Date(a.workout_date)
                );
                setLoggedWorkouts(sorted);
            }
        } catch (err) {
            console.error("Failed to load workouts:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExpandExercises = async (workout) => {
        if (expandedWorkoutId === workout.workout_id) {
            setExpandedWorkoutId(null);
        } else {
            try {
                const res = await fetch(
                    `" + API_URL + "/logged-workouts/${workout.workout_id}/exercises`,
                    {
                        credentials: "include",
                    }
                );
                const data = await res.json();

                setWorkoutExercises({
                    ...workoutExercises,
                    [workout.workout_id]: data.exercises,
                });
                setExpandedWorkoutId(workout.workout_id);
            } catch (err) {
                console.error("Failed to load exercises:", err);
                alert("Failed to load exercises");
            }
        }
    };

    const handleDeleteWorkout = async (workoutId) => {
        if (!window.confirm("Are you sure you want to delete this workout?")) return;

        try {
            const res = await fetch(`" + API_URL + "/logged-workouts/${workoutId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setLoggedWorkouts(
                    loggedWorkouts.filter((workout) => workout.workout_id !== workoutId)
                );
                setExpandedWorkoutId(null);
            } else {
                alert("Error deleting workout: " + (data.error || "Unknown"));
            }
        } catch (err) {
            console.error("Failed to delete workout:", err);
            alert("Failed to delete workout");
        }
    };

    if (loading) {
        return (
            <div className="p-6 rounded-xl border-2 bg-white" style={{ borderColor: colors.mint }}>
                <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.sage }}>
                    Logged Workouts
                </h2>
                <p className="text-center text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-xl border-2 bg-white" style={{ borderColor: colors.mint }}>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.sage }}>
                Logged Workouts
            </h2>

            {/* Search Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: colors.sage }}>
                        Search by Name
                    </label>
                    <input
                        type="text"
                        placeholder="Workout name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full border p-2 rounded"
                        style={{ borderColor: colors.mint }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: colors.sage }}>
                        Search by Date
                    </label>
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full border p-2 rounded"
                        style={{ borderColor: colors.mint }}
                    />
                </div>
            </div>

            {/* Workouts List */}
            {filteredWorkouts.length === 0 ? (
                <p className="text-center text-gray-500">
                    {loggedWorkouts.length === 0 ? "No workouts logged yet" : "No workouts match your search"}
                </p>
            ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {filteredWorkouts.map((workout) => {
                        const formattedDate = workout.workout_date || "N/A";
                        const totalCals = workout.total_calories_burned
                            ? parseFloat(workout.total_calories_burned).toFixed(2)
                            : "0";

                        return (
                            <div
                                key={workout.workout_id}
                                className="border rounded-lg bg-gray-50 overflow-hidden"
                                style={{ borderColor: colors.mint }}
                            >
                                {/* Workout Header */}
                                <div className="p-4 space-y-2">
                                    <h3 className="font-semibold text-lg" style={{ color: colors.sage }}>
                                        {workout.name}
                                    </h3>
                                    <div className="text-sm text-gray-600">
                                        <span>{formattedDate}</span>
                                        <span className="mx-2">•</span>
                                        <span style={{ color: colors.sage }}>{workout.duration} min</span>
                                        <span className="mx-2">•</span>
                                        <span style={{ color: colors.sage }}>
                                            {totalCals} kcal
                                        </span>
                                    </div>
                                </div>

                                {/* Exercises Dropdown */}
                                <div className="border-t" style={{ borderColor: colors.mint }}>
                                    <button
                                        onClick={() => handleExpandExercises(workout)}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition"
                                        style={{ color: colors.sage }}
                                    >
                                        <span className="font-semibold">
                                            {expandedWorkoutId === workout.workout_id ? "▼" : "▶"} Exercises
                                        </span>
                                    </button>

                                    {expandedWorkoutId === workout.workout_id &&
                                        workoutExercises[workout.workout_id] && (
                                            <div className="bg-white p-4 space-y-3 border-t" style={{ borderColor: colors.mint }}>
                                                {workoutExercises[workout.workout_id].length === 0 ? (
                                                    <p className="text-gray-500 text-sm">No exercises in this workout</p>
                                                ) : (
                                                    workoutExercises[workout.workout_id].map((ex, idx) => {
                                                        const category = ex.category?.toUpperCase() || "";
                                                        const isCardio = category === "CARDIO";

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="p-3 border rounded bg-gray-50"
                                                                style={{ borderColor: colors.mint }}
                                                            >
                                                                <p className="font-semibold" style={{ color: colors.sage }}>
                                                                    {ex.exercise_type}
                                                                </p>
                                                                <div className="text-sm text-gray-700 mt-2 space-y-1">
                                                                    {isCardio ? (
                                                                        <>
                                                                            {ex.distance && (
                                                                                <p>
                                                                                    Distance:{" "}
                                                                                    <span style={{ color: colors.sage }}>{ex.distance} km</span>
                                                                                </p>
                                                                            )}
                                                                            {ex.exercise_duration && (
                                                                                <p>
                                                                                    Duration:{" "}
                                                                                    <span style={{ color: colors.sage }}>
                                                                                        {ex.exercise_duration} min
                                                                                    </span>
                                                                                </p>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {ex.sets && (
                                                                                <p>
                                                                                    Sets: <span style={{ color: colors.sage }}>{ex.sets}</span>
                                                                                </p>
                                                                            )}
                                                                            {ex.reps && (
                                                                                <p>
                                                                                    Reps: <span style={{ color: colors.sage }}>{ex.reps}</span>
                                                                                </p>
                                                                            )}
                                                                            {ex.weight && (
                                                                                <p>
                                                                                    Weight:{" "}
                                                                                    <span style={{ color: colors.sage }}>{ex.weight} lbs</span>
                                                                                </p>
                                                                            )}
                                                                            {ex.exercise_duration && (
                                                                                <p>
                                                                                    Duration:{" "}
                                                                                    <span style={{ color: colors.sage }}>
                                                                                        {ex.exercise_duration} min
                                                                                    </span>
                                                                                </p>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 border-t bg-gray-50" style={{ borderColor: colors.mint }}>
                                    <button
                                        onClick={() => handleDeleteWorkout(workout.workout_id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                                    >
                                        Delete Workout
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}