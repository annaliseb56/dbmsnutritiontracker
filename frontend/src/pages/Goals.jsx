const API_URL = import.meta.env.VITE_API_URL || '/api';
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LogoutButton from "../components/LogoutButton";
import colors from "../theme/colors";
import GoalCard from "../components/goals/GoalCard";
import AddGoalModal from "../components/goals/AddGoalModal";

{/**Used CHATGPT to help with the design of the website and ensure that all of the cards on the website were properly aligned. 
    Additionally, used it to help ensure the modals are working as intended. */}

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        fetch("" + API_URL + "/goals", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => setGoals(data.goals || []))
            .catch((err) => console.error(err));
    }, []);

    const handleAddGoal = async (newGoal) => {
        try {
            const res = await fetch("" + API_URL + "/goals", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newGoal),
            });
            const data = await res.json();
            if (res.ok) setGoals([...goals, data.goal]);
            else alert(data.error || "Failed to add goal");
        } catch (err) {
            console.error(err);
            alert("Could not connect to backend");
        }
    };

    const logProgress = async (goalId, currentValue, metricUnit) => {
        try {
            const res = await fetch(`" + API_URL + "/goals/${goalId}/progress`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ current_value: currentValue, metric_unit: metricUnit }),
            });
            const data = await res.json();
            if (res.ok) {
                setGoals((prev) =>
                    prev.map((g) =>
                        g.goal_id === goalId
                            ? { ...g, current_value: currentValue, goal_complete: data.goal_complete }
                            : g
                    )
                );
            } else {
                alert(data.error || "Failed to log progress");
            }
        } catch (err) {
            console.error(err);
            alert("Could not connect to backend");
        }
    };

    const completeGoal = async (goalId) => {
        try {
            const res = await fetch(`" + API_URL + "/goals/${goalId}/complete`, {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
                setGoals((prev) =>
                    prev.map((g) => (g.goal_id === goalId ? { ...g, goal_complete: true } : g))
                );
            } else {
                alert(data.error || "Failed to complete goal");
            }
        } catch (err) {
            console.error(err);
            alert("Could not connect to backend");
        }
    };

    const cancelGoal = async (goalId) => {
        try {
            const res = await fetch(`" + API_URL + "/goals/${goalId}/cancel`, {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) setGoals((prev) => prev.filter((g) => g.goal_id !== goalId));
            else alert(data.error || "Failed to cancel goal");
        } catch (err) {
            console.error(err);
            alert("Could not connect to backend");
        }
    };

    const filteredGoals = goals
        .filter((goal) => {
            const now = new Date();
            const endDate = goal.goal_end_date ? new Date(goal.goal_end_date) : null;
            if (goal.goal_complete) return false;
            if (endDate && endDate < now && !goal.goal_complete) return true;
            return !endDate || endDate >= now;
        })
        .filter((goal) => goal.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const buttonClass = `
        px-6 py-3 rounded-xl font-semibold transition-colors
        bg-sage text-cream hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sage
    `;

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
            <Navbar isLoggedIn={true} isSticky={true} />

            <main className="max-w-4xl mx-auto p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold" style={{ color: colors.textDark }}>
                        Your Goals
                    </h1>
                    <button className={buttonClass} onClick={() => setIsAddModalOpen(true)}>
                        + Add Goal
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border p-2 rounded w-full mb-4"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGoals.length === 0 ? (
                        <p style={{ color: colors.textDark }}>No goals found.</p>
                    ) : (
                        filteredGoals.map((goal) => (
                            <GoalCard
                                key={goal.goal_id}
                                goal={goal}
                                logProgress={logProgress}
                                cancelGoal={cancelGoal}
                                completeGoal={completeGoal}
                            />
                        ))
                    )}
                </div>
            </main>

            <AddGoalModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddGoal}
            />

            <div className="flex justify-center pb-4">
                <LogoutButton />
            </div>
        </div>
    );
}
