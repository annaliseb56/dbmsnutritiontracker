const API_URL = import.meta.env.VITE_API_URL || '/api';
import React, { useState, useEffect } from "react";
import ModalOverlay from "./ModalOverlay";

{/**
  CHATGPT to was used to style the this modal. Additionally, it was used to setup routes
  to the backend. Additionally was used to fix routes again when deploying. 
  */}

export default function ManageExerciseModal({ isOpen, onClose, subcategoriesByCategory }) {
  const [searchName, setSearchName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  // For editing
  const [editingExercise, setEditingExercise] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editSubcategoryIds, setEditSubcategoryIds] = useState([]);
  const [editKcal, setEditKcal] = useState("");

  // Fetch exercises
  const fetchExercises = async () => {
    setLoading(true);
    try {
      //Create a query based on what inputs the user gave
      let query = "?";
      if (searchName) query += `name=${encodeURIComponent(searchName)}&`;
      if (categoryId) query += `category_id=${categoryId}&`;
      if (subcategoryId) query += `subcategory_id=${subcategoryId}&`;

      //send query to backend with credentials (for user verifcation)
      const res = await fetch(`" + API_URL + "/exercises/search${query}`, {
        credentials: "include",
      });

      //Wait for and process response accordingly
      const data = await res.json();
      if (res.ok) {
        setExercises(data.exercises || []);
      } else {
        alert("Error fetching exercises: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Network error while fetching exercises");
    }
    setLoading(false);
  };

  //Call fetch exercises as soon as the modal is open
  useEffect(() => {
    if (isOpen) fetchExercises();
  }, [searchName, categoryId, subcategoryId, isOpen]);

  //Constant for each category option this is alos stored in the database but since it 
  //is kept constant we can store it here easily
  const categoryOptions = [
    { id: 1, label: "BACK" },
    { id: 2, label: "CHEST" },
    { id: 3, label: "ARMS" },
    { id: 4, label: "LEGS" },
    { id: 5, label: "CORE" },
    { id: 6, label: "CARDIO" },
  ];

  //Used to control editing an exercise
  const startEdit = (exercise) => {
    setEditingExercise(exercise);
    setEditName(exercise.exercise_type);
    setEditCategoryId(categoryOptions.find(cat => cat.label === exercise.category)?.id || "");
    setEditSubcategoryIds(exercise.subcategories.map(s => s.subcategory_id));
    setEditKcal(exercise.calories_per_kg);
  };

  //Used to cancel editing an exercise
  const cancelEdit = () => {
    setEditingExercise(null);
    setEditName("");
    setEditCategoryId("");
    setEditSubcategoryIds([]);
    setEditKcal("");
  };

  //For selecting the subcategory
  const handleSubcategoryToggle = (subId) => {
    setEditSubcategoryIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  //Saving the edit for the backend
  const saveEdit = async () => {
    try {
      const payload = {
        name: editName,
        category_id: editCategoryId,
        subcategory_ids: editSubcategoryIds,
        kcal_per_kg: parseFloat(editKcal),
      };

      const res = await fetch(`" + API_URL + "/exercises/edit/${editingExercise.exercise_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Failed to update exercise: " + data.error);
        return;
      }

      cancelEdit();
      fetchExercises();
    } catch (err) {
      console.error(err);
      alert("Network error while updating exercise");
    }
  };

  //Deleting the ecercise from the backend
  const deleteExercise = async (exercise_id) => {
    if (!window.confirm("Are you sure you want to delete this exercise?")) return;
    try {
      const res = await fetch(`" + API_URL + "/exercises/delete/${exercise_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Failed to delete exercise: " + data.error);
        return;
      }
      fetchExercises();
    } catch (err) {
      console.error(err);
      alert("Network error while deleting exercise");
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">Manage Exercises</h2>

      {/* Search Filters */}
      <div className="space-y-4 mb-6">
        <input
          type="text"
          className="w-full p-2 border rounded-lg"
          placeholder="Search by exercise name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        <select
          className="w-full p-2 border rounded-lg"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setSubcategoryId("");
          }}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>

        {categoryId && (
          <select
            className="w-full p-2 border rounded-lg"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
          >
            <option value="">All Subcategories</option>
            {subcategoriesByCategory?.[categoryId]?.map(sub => (
              <option key={sub.subcategory_id} value={sub.subcategory_id}>{sub.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Exercises Table */}
      <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
        {loading ? (
          <p className="p-2">Loading exercises...</p>
        ) : exercises.length === 0 ? (
          <p className="p-2">No exercises found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Category</th>
                <th className="border p-2 text-left">Kcal per kg</th>
                <th className="border p-2 text-left">Subcategories</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr key={ex.exercise_id} className="hover:bg-gray-50">
                  <td className="border p-2">{ex.exercise_type}</td>
                  <td className="border p-2">{ex.category}</td>
                  <td className="border p-2">{ex.calories_per_kg}</td>
                  <td className="border p-2">
                    {ex.subcategories.map((s) => s.name).join(", ")}
                  </td>
                  <td className="border p-2 space-x-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() => startEdit(ex)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => deleteExercise(ex.exercise_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {/* Edit Form */}
      {editingExercise && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-bold mb-2">Edit Exercise</h3>

          <div className="space-y-4">
            <input
              type="text"
              className="w-full p-2 border rounded-lg"
              placeholder="Exercise Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <select
              className="w-full p-2 border rounded-lg"
              value={editCategoryId}
              onChange={(e) => {
                setEditCategoryId(e.target.value);
                setEditSubcategoryIds([]); // Reset subcategories when category changes
              }}
            >
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            {/* Subcategories checkboxes */}
            {editCategoryId && (
              <div className="space-y-2">
                {subcategoriesByCategory?.[editCategoryId]?.map((sub) => (
                  <label key={sub.subcategory_id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editSubcategoryIds.includes(sub.subcategory_id)}
                      onChange={() => handleSubcategoryToggle(sub.subcategory_id)}
                    />
                    {sub.name}
                  </label>
                ))}
              </div>
            )}

            <input
              type="number"
              step="0.1"
              className="w-full p-2 border rounded-lg"
              placeholder="Calories per kg"
              value={editKcal}
              onChange={(e) => setEditKcal(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={saveEdit}
              >
                Save
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}
