const API_URL = import.meta.env.VITE_API_URL || '/api';
import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import Navbar from '../components/Navbar';
import colors from '../theme/colors';   

{/**Used CHATGPT to help with the design of the website and ensure that all of the cards on the website were properly aligned. 
    Additionally,used it to fix errors with design and charts.*/}
export default function TrackPage() {
    const [selectedGraphs, setSelectedGraphs] = useState(['weight', 'calories', 'macros']);
    const [weightData, setWeightData] = useState([]);
    const [caloriesData, setCaloriesData] = useState([]);
    const [macrosData, setMacrosData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const availableGraphs = [
        { id: 'weight', label: 'Weight Over Time', icon: TrendingUp },
        { id: 'calories', label: 'Calories Intake vs Burned', icon: Flame },
        { id: 'macros', label: 'Macronutrient Breakdown', icon: CheckCircle2 }
    ];

    useEffect(() => {
        fetchTrackingData();
    }, []);

    const fetchTrackingData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('" + API_URL + "/track/data', {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch tracking data');

            const data = await response.json();

            if (data.weightData) {
                setWeightData(data.weightData.map(d => ({
                    date: new Date(d.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    weight: parseFloat(d.weight)
                })));
            }

            if (data.caloriesData) {
                setCaloriesData(data.caloriesData.map(d => ({
                    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    caloriesEaten: parseFloat(d.calories_eaten) || 0,
                    caloriesBurned: parseFloat(d.calories_burned) || 0
                })));
            }

            if (data.macrosData) {
                setMacrosData(data.macrosData.map(d => ({
                    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    protein: parseFloat(d.protein) || 0,
                    carbs: parseFloat(d.carbs) || 0,
                    totalFat: parseFloat(d.total_fat) || 0,
                    saturatedFat: parseFloat(d.saturated_fat) || 0
                })));
            }

        } catch (err) {
            setError(err.message);
        }

        setLoading(false);
    };

    const toggleGraph = (graphId) => {
        setSelectedGraphs(prev =>
            prev.includes(graphId)
                ? prev.filter(id => id !== graphId)
                : [...prev, graphId]
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen p-8" style={{ backgroundColor: colors.lightGreen }}>
                <Navbar isLoggedIn={true} isSticky={true} />
                <p className="text-center text-lg mt-10">Loading your tracking data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
            <Navbar isLoggedIn={true} isSticky={true} />

            <main className="max-w-5xl mx-auto p-6 space-y-10">
                <div>
                    <h1 className="text-4xl font-bold mb-2" style={{ color: colors.textDark }}>
                        Track Your Progress
                    </h1>
                    <p className="text-lg opacity-70" style={{ color: colors.darkGreen }}>
                        Select the graphs you want to view
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Graph Selection */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-2" style={{ borderColor: colors.lightGreen }}>
                    <h2 className="text-xl font-semibold mb-4" style={{ color: colors.textDark }}>
                        Available Graphs
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {availableGraphs.map(graph => {
                            const Icon = graph.icon;
                            const isSelected = selectedGraphs.includes(graph.id);

                            return (
                                <button
                                    key={graph.id}
                                    onClick={() => toggleGraph(graph.id)}
                                    className={`p-4 rounded-xl border-2 transition flex items-center gap-3 
                                        ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                >
                                    <Icon className="w-6 h-6" style={{ color: isSelected ? colors.sage : colors.darkGreen }} />
                                    <span style={{ color: colors.textDark }}>{graph.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* GRAPHS */}
                <div className="space-y-10">

                    {/* Weight Graph */}
                    {selectedGraphs.includes('weight') && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border-2" style={{ borderColor: colors.lightGreen }}>
                            <h3 className="text-2xl font-semibold mb-6" style={{ color: colors.textDark }}>
                                Weight Over Time
                            </h3>

                            {weightData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={weightData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke={colors.sage}
                                            strokeWidth={2}
                                            dot={{ fill: colors.sage, r: 5 }}
                                            activeDot={{ r: 7 }}
                                            name="Weight (lbs)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center opacity-70">No weight data available</p>
                            )}
                        </div>
                    )}

                    {/* Calories Graph */}
                    {selectedGraphs.includes('calories') && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border-2" style={{ borderColor: colors.lightGreen }}>
                            <h3 className="text-2xl font-semibold mb-6" style={{ color: colors.textDark }}>
                                Calories: Intake vs Burned
                            </h3>

                            {caloriesData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={caloriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="caloriesEaten" stroke="#ff9800" strokeWidth={2} dot={{ r: 5 }} />
                                        <Line type="monotone" dataKey="caloriesBurned" stroke="#e91e63" strokeWidth={2} dot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center opacity-70">No calories data available</p>
                            )}
                        </div>
                    )}

                    {/* Macros Graph */}
                    {selectedGraphs.includes('macros') && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border-2" style={{ borderColor: colors.lightGreen }}>
                            <h3 className="text-2xl font-semibold mb-6" style={{ color: colors.textDark }}>
                                Macronutrient Breakdown
                            </h3>

                            {macrosData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={macrosData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="protein" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="carbs" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="totalFat" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="saturatedFat" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center opacity-70">No macronutrient data available</p>
                            )}
                        </div>
                    )}
                </div>

                {selectedGraphs.length === 0 && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center border-2" style={{ borderColor: colors.lightGreen }}>
                        <p className="text-lg opacity-70" style={{ color: colors.darkGreen }}>
                            Select a graph above to view your tracking data
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
