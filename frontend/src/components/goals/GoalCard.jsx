import React, { useState } from "react";

export default function GoalCard({ goal, logProgress, cancelGoal }) {
    const [progressValue, setProgressValue] = useState("");
    const [isLogging, setIsLogging] = useState(false);

    const handleSubmit = () => {
        if (!progressValue) return;
        logProgress(goal.goal_id, progressValue, goal.metric_unit || "None");
        setProgressValue("");
        setIsLogging(false);
    };

    const handleComplete = () => {
        logProgress(goal.goal_id, 1, "None");
    };

    return (
        <div
            className="p-4 border rounded-xl shadow flex flex-col gap-2"
            style={{ backgroundColor: goal.goal_complete ? "#d4edda" : "white" }}
        >
            <h3 className="font-bold">{goal.name}</h3>
            <p>Target: {goal.target_value}</p>
            <p>Current: {goal.current_value ?? "Not logged"} {goal.metric_unit}</p>
            <p>End Date: {goal.goal_end_date ?? "N/A"}</p>
            <p>Status: {goal.goal_complete ? "✅ Completed" : "⏳ In Progress"}</p>

            {!goal.goal_complete && (
                <>
                    {goal.metric_type === "numeric" ? (
                        isLogging ? (
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="number"
                                    placeholder="Enter Current Value"
                                    value={progressValue}
                                    onChange={(e) => setProgressValue(e.target.value)}
                                    className="border p-2 rounded w-1/2"
                                />
                                <span className="self-center">{goal.metric_unit || ""}</span>
                                <button
                                    className="px-3 py-1 bg-green-600 text-white rounded"
                                    onClick={handleSubmit}
                                >
                                    Submit
                                </button>
                            </div>
                        ) : (
                            <button
                                className="px-3 py-1 bg-sage text-cream rounded hover:bg-green-600 mt-2"
                                onClick={() => setIsLogging(true)}
                            >
                                Log Progress
                            </button>
                        )
                    ) : (
                        <button
                            className="px-3 py-1 bg-sage text-cream rounded hover:bg-green-600 mt-2"
                            onClick={handleComplete}
                        >
                            Complete Goal
                        </button>
                    )}
                    <button
                        className="px-3 py-1 bg-red-500 text-white rounded mt-2"
                        onClick={() => cancelGoal(goal.goal_id)}
                    >
                        Cancel Goal
                    </button>
                </>
            )}
        </div>
    );
}
