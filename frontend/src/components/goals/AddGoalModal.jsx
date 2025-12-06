import React, { useState } from "react";
import ModalOverlay from "../ModalOverlay";

export default function AddGoalModal({ isOpen, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [goalType, setGoalType] = useState("gte");
    const [targetValue, setTargetValue] = useState("");
    const [currentValue, setCurrentValue] = useState("");
    const [metricUnit, setMetricUnit] = useState("None");
    const [goalEndDate, setGoalEndDate] = useState("");

    const handleSubmit = () => {
        if (!name || !targetValue || currentValue === "") {
            alert("Please fill out all required fields.");
            return;
        }

        onSubmit({
            name,
            goal_type: goalType,
            target_value: targetValue,
            current_value: currentValue,
            metric_unit: metricUnit,
            goal_end_date: goalEndDate || null,
        });

        setName("");
        setGoalType("gte");
        setTargetValue("");
        setCurrentValue("");
        setMetricUnit("None");
        setGoalEndDate("");
        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <h2 className="text-2xl font-bold mb-4">Create New Goal</h2>

            {/* Goal Name */}
            <label className="block mb-1 font-medium">Goal Name</label>
            <input
                type="text"
                placeholder="Enter goal name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border p-3 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            {/* Goal Type */}
            <label className="block mb-1 font-medium">Goal Type</label>
            <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full border p-3 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
                <option value="gte">Greater Than or Equal</option>
                <option value="lte">Less Than or Equal</option>
            </select>

            {/* Target Value */}
            <label className="block mb-1 font-medium">Target Value</label>
            <input
                type="number"
                placeholder="Enter target value"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full border p-3 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            {/* Current Value */}
            <label className="block mb-1 font-medium">Current Value</label>
            <input
                type="number"
                placeholder="Enter current value"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full border p-3 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            {/* Metric Unit */}
            <label className="block mb-1 font-medium">Metric Unit</label>
            <select
                value={metricUnit}
                onChange={(e) => setMetricUnit(e.target.value)}
                className="w-full border p-3 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
                <option value="None">None</option>
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
                <option value="km">km</option>
                <option value="mi">mi</option>
                <option value="min">min</option>
                <option value="hr">hr</option>
                <option value="cal">cal</option>
            </select>

            {/* Goal End Date */}
            <label className="block mb-1 font-medium">End Date (optional)</label>
            <input
                type="date"
                value={goalEndDate}
                onChange={(e) => setGoalEndDate(e.target.value)}
                className="w-full border p-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <button
                    className="px-4 py-2 bg-gray-300 rounded hover:brightness-95"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:brightness-95"
                    onClick={handleSubmit}
                >
                    Save Goal
                </button>
            </div>
        </ModalOverlay>
    );
}
