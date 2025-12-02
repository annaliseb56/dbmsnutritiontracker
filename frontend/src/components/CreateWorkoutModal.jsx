import React, { useState } from "react";
import ModalOverlay from "./ModalOverlay";

export default function CreateWorkoutModal({ isOpen, onClose, exercises }) {
  const [workoutName, setWorkoutName] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);

  if (!isOpen) return null;

  const filteredExercises = exercises.filter((ex) =>
    ex.exercise_type.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const addExercise = (exercise) => {
    if (!selectedExercises.some((e) => e.exercise_id === exercise.exercise_id)) {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const removeExercise = (exercise_id) => {
    setSelectedExercises(selectedExercises.filter((e) => e.exercise_id !== exercise_id));
  };

  const handleSave = async () => {
    if (!workoutName.trim()) {
      alert("Please enter a workout name.");
      return;
    }

    if (selectedExercises.length === 0) {
      alert("Please add at least one exercise.");
      return;
    }

    const payload = {
      name: workoutName,
      notes,
      exercises: selectedExercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        exercise_duration: 0,
      })),
    };

    try {
      const res = await fetch("http://localhost:5000/workouts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 201 && data.success) {
        alert(data.message);
        setWorkoutName("");
        setNotes("");
        setSearchQuery("");
        setSelectedExercises([]);
        onClose();
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create workout template");
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-semibold mb-4">Create New Workout</h2>

      <label className="block font-semibold mb-1">Workout Name</label>
      <input
        type="text"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        placeholder="Push Day, Cardio Burn, etc."
        className="w-full border p-2 rounded mb-4"
      />

      <label className="block font-semibold mb-1">Notes (optional)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Workout notes..."
        className="w-full border p-2 rounded mb-4"
      />

      <label className="block font-semibold mb-1">Search Exercises</label>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search for exercises..."
        className="w-full border p-2 rounded mb-3"
      />

      <div className="flex gap-4">
        <div className="w-1/2 border rounded p-2 h-64 overflow-y-auto">
          <h3 className="font-semibold mb-2">Available Exercises</h3>
          {filteredExercises.length === 0 ? (
            <p className="text-gray-500 text-sm">No exercises found.</p>
          ) : (
            filteredExercises.map((ex) => (
              <div key={ex.exercise_id} className="flex justify-between items-center py-1 border-b">
                <span>{ex.exercise_type}</span>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                  onClick={() => addExercise(ex)}
                >
                  Add
                </button>
              </div>
            ))
          )}
        </div>

        <div className="w-1/2 border rounded p-2 h-64 overflow-y-auto">
          <h3 className="font-semibold mb-2">Selected Exercises</h3>
          {selectedExercises.length === 0 ? (
            <p className="text-gray-500 text-sm">No exercises added yet.</p>
          ) : (
            selectedExercises.map((ex) => (
              <div key={ex.exercise_id} className="flex justify-between items-center py-1 border-b">
                <span>{ex.exercise_type}</span>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  onClick={() => removeExercise(ex.exercise_id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6 space-x-3">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
          Cancel
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSave}>
          Save Workout
        </button>
      </div>
    </ModalOverlay>
  );
}
