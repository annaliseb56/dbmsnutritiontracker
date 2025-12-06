const API_URL = import.meta.env.VITE_API_URL || '/api';
import React, { useState, useEffect } from "react";
import ModalOverlay from "./ModalOverlay";

export default function ManageWorkoutModal({ isOpen, onClose }) {
  const [workouts, setWorkouts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [removedExercises, setRemovedExercises] = useState([]);
  const [workoutName, setWorkoutName] = useState("");
  const [notes, setNotes] = useState("");
  const [allExercises, setAllExercises] = useState([]);

  // Load workouts when modal opens or search changes
  useEffect(() => {
    if (!isOpen) return;
    fetch(`" + API_URL + "/workouts?search=${encodeURIComponent(searchQuery)}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setWorkouts(data.workouts || []))
      .catch(err => console.error(err));
  }, [isOpen, searchQuery]);

  // Load all exercises when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch("" + API_URL + "/exercises/search", { credentials: "include" })
      .then(res => res.json())
      .then(data => setAllExercises(data.exercises || []))
      .catch(err => console.error(err));
  }, [isOpen]);

  // Load exercises for selected workout
  const loadWorkoutExercises = (workout) => {
    fetch(`" + API_URL + "/workouts/${workout.workout_id}/exercises`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setSelectedExercises(data.exercises || []);
        setRemovedExercises([]);
        setWorkoutName(workout.name);
        setNotes(workout.notes || "");
        setSelectedWorkout(workout);
      })
      .catch(err => console.error(err));
  };

  const addExercise = (exercise) => {
    if (!selectedExercises.some(e => e.exercise_id === exercise.exercise_id)) {
      setSelectedExercises([...selectedExercises, { ...exercise, exercise_duration: 0 }]);
    }
  };

  const removeExercise = (exerciseId) => {
    setRemovedExercises([...removedExercises, exerciseId]);
    setSelectedExercises(selectedExercises.filter(e => e.exercise_id !== exerciseId));
  };

  const handleSave = async () => {
    if (!selectedWorkout) return;
    const payload = {
      name: workoutName,
      notes,
      add_exercises: selectedExercises.map(e => ({ exercise_id: e.exercise_id, exercise_duration: e.exercise_duration || 0 })),
      remove_exercises: removedExercises,
    };
    try {
      const res = await fetch(`" + API_URL + "/workouts/${selectedWorkout.workout_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert("Workout updated!");
        onClose();
      } else {
        alert("Error: " + (data.error || "Unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update workout");
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkout || !window.confirm("Delete this workout?")) return;
    try {
      const res = await fetch(`" + API_URL + "/workouts/${selectedWorkout.workout_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        alert("Workout deleted!");
        setSelectedWorkout(null);
        setSelectedExercises([]);
        setRemovedExercises([]);
        setWorkoutName("");
        setNotes("");
        setWorkouts(workouts.filter(w => w.workout_id !== selectedWorkout.workout_id));
      } else {
        alert("Error: " + (data.error || "Unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete workout");
    }
  };

  const availableExercises = allExercises.filter(ex => !selectedExercises.some(e => e.exercise_id === ex.exercise_id));

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">Manage Workouts</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search workouts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      {/* Workout list */}
      <div className="max-h-48 overflow-y-auto border rounded mb-4">
        {workouts.map(w => (
          <div
            key={w.workout_id}
            className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedWorkout?.workout_id === w.workout_id ? "bg-gray-200" : ""}`}
            onClick={() => loadWorkoutExercises(w)}
          >
            {w.name}
          </div>
        ))}
      </div>

      {/* Selected Workout */}
      {selectedWorkout && (
        <>
          <label className="block font-semibold mb-1">Name</label>
          <input className="w-full border p-2 rounded mb-2" value={workoutName} onChange={e => setWorkoutName(e.target.value)} />
          <label className="block font-semibold mb-1">Notes</label>
          <textarea className="w-full border p-2 rounded mb-3" value={notes} onChange={e => setNotes(e.target.value)} />

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Add */}
            <div className="border rounded p-2 max-h-48 overflow-y-auto">
              <h3 className="font-semibold mb-2">Available Exercises</h3>
              {availableExercises.length === 0 ? <p className="text-gray-500 text-sm">No exercises</p> :
                availableExercises.map(ex => (
                  <div key={ex.exercise_id} className="flex justify-between items-center py-1 border-b">
                    <span>{ex.exercise_type}</span>
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-sm" onClick={() => addExercise(ex)}>Add</button>
                  </div>
                ))
              }
            </div>

            {/* Selected */}
            <div className="border rounded p-2 max-h-48 overflow-y-auto">
              <h3 className="font-semibold mb-2">Selected Exercises</h3>
              {selectedExercises.length === 0 ? <p className="text-gray-500 text-sm">No exercises</p> :
                selectedExercises.map(ex => (
                  <div key={ex.exercise_id} className="flex justify-between items-center py-1 border-b">
                    <span>{ex.exercise_type}</span>
                    <button className="bg-red-500 text-white px-2 py-1 rounded text-sm" onClick={() => removeExercise(ex.exercise_id)}>Remove</button>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancel</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSave}>Save</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>Delete</button>
          </div>
        </>
      )}
    </ModalOverlay>
  );
}
