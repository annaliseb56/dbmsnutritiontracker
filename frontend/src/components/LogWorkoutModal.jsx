import React, { useState, useEffect } from "react";
import ModalOverlay from "./ModalOverlay";

export default function LogWorkoutModal({ isOpen, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [totalCalories, setTotalCalories] = useState(0);
  const [userWeight, setUserWeight] = useState(150); // default 150 lbs

  // Fetch user's most recent weight
  const fetchUserWeight = async () => {
    try {
      const res = await fetch("http://localhost:5000/progress", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.progress && data.progress.length > 0) {
        setUserWeight(data.progress[0].weight);
      }
    } catch (err) {
      console.error("Could not fetch user weight:", err);
    }
  };

  // Load templates and user weight when modal opens
  useEffect(() => {
    if (!isOpen) return;

    fetchUserWeight();

    async function loadTemplates() {
      try {
        const res = await fetch("http://localhost:5000/workouts?is_template=true", {
          credentials: "include",
        });
        const data = await res.json();
        setTemplates(data.workouts || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadTemplates();
  }, [isOpen]);

  // Load exercises for selected template
  const loadTemplateExercises = async (template) => {
    try {
      const res = await fetch(`http://localhost:5000/workouts/${template.workout_id}/exercises`, {
        credentials: "include",
      });
      const data = await res.json();
      setExercises(
        data.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets || "",
          reps: ex.reps || "",
          weight: ex.weight || "",
          max_weight: ex.max_weight || "",
          distance: ex.distance || "",
          duration: ex.exercise_duration || 0,
          intensity: 1,
        }))
      );
      setNotes(template.notes || "");
      setSelectedTemplate(template);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle changes in exercises
  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  // Validate exercises
  const validateExercises = () => {
    for (let ex of exercises) {
      const category = ex.category?.toUpperCase() || "";
      const isCardio = category === "CARDIO";

      if (isCardio && (!ex.distance || !ex.duration)) {
        return `Cardio exercise "${ex.exercise_type}" requires distance and duration`;
      }
      if (!isCardio && (!ex.sets || !ex.reps || !ex.weight)) {
        return `Strength exercise "${ex.exercise_type}" requires sets, reps, and weight`;
      }
    }
    return null;
  };

  // Calculate total calories dynamically
  useEffect(() => {
    let total = 0;
    exercises.forEach((ex) => {
      const category = ex.category?.toUpperCase() || "";
      const isCardio = category === "CARDIO";
      const intensity = parseFloat(ex.intensity || 1);

      if (isCardio && ex.distance && ex.duration) {
        // Cardio: duration_hours * (calories_per_kg * intensity) * (user_weight / 0.453592) / 200
        const durationHours = parseFloat(ex.duration) / 60;
        total += (durationHours * (parseFloat(ex.calories_per_kg) * intensity) * (userWeight / 0.453592)) / 200;
      } else if (ex.sets && ex.reps && ex.weight) {
        // Strength: ((calories_per_kg * intensity) * user_weight * (sets * reps / 18)) / 60
        total += ((parseFloat(ex.calories_per_kg) * intensity) * userWeight * (parseFloat(ex.sets) * parseFloat(ex.reps) / 18)) / 60;
      }
    });
    setTotalCalories(total);
  }, [exercises, userWeight]);

  // Submit logged workout
  const handleSubmit = async () => {
    if (!selectedTemplate) {
      alert("Please select a workout template");
      return;
    }

    const validationError = validateExercises();
    if (validationError) {
      alert(validationError);
      return;
    }

    const payload = {
      template_id: selectedTemplate.workout_id,
      name: selectedTemplate.name,
      notes,
      workout_date: workoutDate,
      exercises: exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        sets: ex.sets ? Number(ex.sets) : null,
        reps: ex.reps ? Number(ex.reps) : null,
        weight: ex.weight ? Number(ex.weight) : null,
        max_weight: ex.max_weight ? Number(ex.max_weight) : null,
        distance: ex.distance ? Number(ex.distance) : null,
        duration: ex.duration ? Number(ex.duration) : 0,
        intensity: ex.intensity ? Number(ex.intensity) : 1,
      })),
    };

    try {
      const res = await fetch("http://localhost:5000/workouts/log", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Workout logged! Estimated calories burned: ${data.total_calories.toFixed(2)}`);
        onClose();
      } else {
        alert("Error logging workout: " + (data.error || "Unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to log workout");
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4 text-center">Log Workout</h2>

      {/* Template Selector */}
      <div className="mb-4 max-h-40 overflow-y-auto border rounded p-2">
        {templates.map((t) => (
          <div
            key={t.workout_id}
            className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${
              selectedTemplate?.workout_id === t.workout_id ? "bg-gray-200" : ""
            }`}
            onClick={() => loadTemplateExercises(t)}
          >
            {t.name}
          </div>
        ))}
      </div>

      {/* Date & Notes */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Date</label>
        <input
          type="date"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Exercises */}
      {selectedTemplate && (
        <>
          <h3 className="text-lg font-semibold mb-2">Exercises</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {exercises.map((ex, idx) => {
              const category = ex.category?.toUpperCase() || "";
              const isCardio = category === "CARDIO";

              return (
                <div key={idx} className="p-2 border rounded bg-gray-50 space-y-2">
                  <div className="font-semibold">{ex.exercise_type}</div>

                  {isCardio ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Distance (km)</label>
                          <input
                            type="number"
                            placeholder="Distance"
                            value={ex.distance || ""}
                            onChange={(e) => handleExerciseChange(idx, "distance", e.target.value)}
                            className="w-full border p-1 rounded"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Duration (min)</label>
                          <input
                            type="number"
                            placeholder="Duration"
                            value={ex.duration || ""}
                            onChange={(e) => handleExerciseChange(idx, "duration", e.target.value)}
                            className="w-full border p-1 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Intensity</label>
                        <select
                          value={ex.intensity || 1}
                          onChange={(e) => handleExerciseChange(idx, "intensity", e.target.value)}
                          className="w-full border p-1 rounded"
                        >
                          <option value={0.8}>Low</option>
                          <option value={1}>Moderate</option>
                          <option value={1.2}>High</option>
                          <option value={1.5}>Very High</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Sets</label>
                          <input
                            type="number"
                            placeholder="Sets"
                            value={ex.sets || ""}
                            onChange={(e) => handleExerciseChange(idx, "sets", e.target.value)}
                            className="w-full border p-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Reps</label>
                          <input
                            type="number"
                            placeholder="Reps"
                            value={ex.reps || ""}
                            onChange={(e) => handleExerciseChange(idx, "reps", e.target.value)}
                            className="w-full border p-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Weight</label>
                          <input
                            type="number"
                            placeholder="Weight"
                            value={ex.weight || ""}
                            onChange={(e) => handleExerciseChange(idx, "weight", e.target.value)}
                            className="w-full border p-1 rounded"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Max Weight</label>
                          <input
                            type="number"
                            placeholder="Max Weight"
                            value={ex.max_weight || ""}
                            onChange={(e) => handleExerciseChange(idx, "max_weight", e.target.value)}
                            className="w-full border p-1 rounded"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Duration (min)</label>
                          <input
                            type="number"
                            placeholder="Duration"
                            value={ex.duration || ""}
                            onChange={(e) => handleExerciseChange(idx, "duration", e.target.value)}
                            className="w-full border p-1 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Intensity</label>
                        <select
                          value={ex.intensity || 1}
                          onChange={(e) => handleExerciseChange(idx, "intensity", e.target.value)}
                          className="w-full border p-1 rounded"
                        >
                          <option value={0.8}>Low</option>
                          <option value={1}>Moderate</option>
                          <option value={1.2}>High</option>
                          <option value={1.5}>Very High</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-right font-semibold mt-2">
            Estimated Calories: {totalCalories.toFixed(2)}
          </div>
        </>
      )}

      <div className="flex justify-end space-x-3 mt-4">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
          Cancel
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit}>
          Log Workout
        </button>
      </div>
    </ModalOverlay>
  );
}