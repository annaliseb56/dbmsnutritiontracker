const API_URL = import.meta.env.VITE_API_URL || '/api';
import React, { useState } from "react";
import ModalOverlay from "./ModalOverlay";

export default function AddExerciseModal({ isOpen, onClose, subcategoriesByCategory }) {
  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [kcalMode, setKcalMode] = useState("auto"); // "auto" | "manual"
  const [kcalValue, setKcalValue] = useState("");

  // Handle subcategory selection
  const handleSubcategoryToggle = (subId) => {
    setSubcategoryIds((prev) =>
      prev.includes(subId)
        ? prev.filter((id) => id !== subId)
        : [...prev, subId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      category_id: parseInt(categoryId),
      subcategory_ids: subcategoryIds,
      kcal_per_kg: kcalMode === "manual" ? parseFloat(kcalValue) : null,
      auto_kcal: kcalMode === "auto",
    };

    try {
      const res = await fetch("" + API_URL + "/exercises/add", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Failed to add exercise: " + data.error);
        return;
      }

      // Success feedback
      alert(`Exercise "${name}" added successfully! (ID: ${data.exercise_id})`);

      // Reset form fields
      setName("");
      setCategoryId("");
      setSubcategoryIds([]);
      setKcalMode("auto");
      setKcalValue("");

      onClose(); // close modal

    } catch (err) {
      console.error(err);
      alert("Network error, please try again");
    }
  };

  const categoryOptions = [
    { id: 1, label: "BACK" },
    { id: 2, label: "CHEST" },
    { id: 3, label: "ARMS" },
    { id: 4, label: "LEGS" },
    { id: 5, label: "CORE" },
    { id: 6, label: "CARDIO" },
  ];

  const availableSubcats = subcategoriesByCategory?.[categoryId] || [];

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">Add New Exercise</h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Exercise Name */}
        <div>
          <label className="block font-semibold mb-1">Exercise Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded-lg"
            placeholder="Lat Pulldown"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-semibold mb-1">Main Muscle Group</label>
          <select
            className="w-full p-2 border rounded-lg"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryIds([]);
            }}
            required
          >
            <option value="">Select Category</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategories (dynamic) */}
        {categoryId && (
          <div>
            <label className="block font-semibold mb-1">
              Subcategories Worked
            </label>
            <div className="space-y-2">
              {availableSubcats.map((sub) => (
                <label key={sub.subcategory_id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={subcategoryIds.includes(sub.subcategory_id)}
                    onChange={() => handleSubcategoryToggle(sub.subcategory_id)}
                  />
                  {sub.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* KCAL Mode Selector */}
        <div>
          <label className="block font-semibold mb-1">Calories Setting</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="kcal_mode"
                value="auto"
                checked={kcalMode === "auto"}
                onChange={() => setKcalMode("auto")}
              />
              Estimate for me
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="kcal_mode"
                value="manual"
                checked={kcalMode === "manual"}
                onChange={() => setKcalMode("manual")}
              />
              I will enter calories manually
            </label>
          </div>
        </div>

        {/* Manual KCAL input */}
        {kcalMode === "manual" && (
          <div>
            <label className="block font-semibold mb-1">kcal_per_kg per hour</label>
            <input
              type="number"
              step="0.1"
              className="w-full p-2 border rounded-lg"
              placeholder="e.g. 6.2"
              value={kcalValue}
              onChange={(e) => setKcalValue(e.target.value)}
              required
            />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full mt-4 bg-sage text-white p-3 rounded-xl font-semibold"
        >
          Add Exercise
        </button>
      </form>
    </ModalOverlay>
  );
}
