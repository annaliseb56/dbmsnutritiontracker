//Imports
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import colors from "../theme/colors";
import LogoutButton from "../components/LogoutButton";
import ModalOverlay from "../components/ModalOverlay";

{/**Used CHATGPT to help with the design of the website and ensure that all of the cards on the website were properly aligned. 
    Additionally, used it to help ensure the modals are working as intended. */}
export default function Meals() {

    const formatDateDisplay = (dateString) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split("-");
        return `${month}-${day}-${year}`;
    };

    //Navbar
    const isLoggedIn = true;
    const isSticky = false;

    //Track which modal to open
    const [openCustomModal, setOpenCustomModal] = useState(false);
    const [openSearchModal, setOpenSearchModal] = useState(false);
    const [openSavedModal, setOpenSavedModal] = useState(false);

    //Store all fields for a custom meal
    const [customMeal, setCustomMeal] = useState({
        name: "",
        meal_type: "",
        meal_date: ""
    });

    //Store individual food being added to custom meal
    const [currentFood, setCurrentFood] = useState({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        total_fat: "",
        saturated_fat: "",
        cholesterol: "",
        sodium: "",
        sugar: "",
        food_amount: ""
    });

    //Store all foods that make up the custom meal
    const [customMealFoods, setCustomMealFoods] = useState([]);

    //Holds all of the users' previously added meals
    const [savedMeals, setSavedMeals] = useState([]);

    //Holds editable food amounts when logging a previous meal
    const [reuseMealAmounts, setReuseMealAmounts] = useState({});

    //Holds the date when reusing a meal
    const [reuseMealDate, setReuseMealDate] = useState("");

    //Search for saved meals
    const [savedMealSearchQuery, setSavedMealSearchQuery] = useState("");

    //View logged meals (all instances)
    const [loggedMeals, setLoggedMeals] = useState([]);
    const [loggedMealSearchName, setLoggedMealSearchName] = useState("");
    const [loggedMealSearchDate, setLoggedMealSearchDate] = useState("");
    const [loggedMealSearchType, setLoggedMealSearchType] = useState("");
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [editMealData, setEditMealData] = useState({
        name: "",
        meal_type: "",
        meal_date: "",
        foods: []
    });

    //Search Food state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [mealFoods, setMealFoods] = useState([]);
    const [searchMealName, setSearchMealName] = useState("");
    const [searchMealType, setSearchMealType] = useState("");
    const [searchMealDate, setSearchMealDate] = useState("");

    //Track food amounts for search results (fixes the blank page bug)
    const [searchFoodAmounts, setSearchFoodAmounts] = useState({});

    //Fetch all previously added meals
    useEffect(() => {
        fetch("http://localhost:5000/meals/history", { credentials: "include" })
            .then(res => res.json())
            .then(data => setSavedMeals(data))
            .catch(err => console.error("Failed to load meals:", err));
    }, []);

    //Fetch all logged meals (including reused instances)
    useEffect(() => {
        fetch("http://localhost:5000/meals/logged", { credentials: "include" })
            .then(res => res.json())
            .then(data => setLoggedMeals(data))
            .catch(err => console.error("Failed to load logged meals:", err));
    }, []);

    //Disable background scrolling when any modal is open
    useEffect(() => {
        const isModalOpen = openCustomModal || openSearchModal || openSavedModal || openEditModal;
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [openCustomModal, openSearchModal, openSavedModal, openEditModal]);

    //Handle custom meal input changes
    const handleCustomChange = (e) => {
        const { name, value } = e.target;
        setCustomMeal(prev => ({ ...prev, [name]: value }));
    };

    //Handle current food input changes
    const handleFoodChange = (e) => {
        const { name, value } = e.target;
        setCurrentFood(prev => ({ ...prev, [name]: value }));
    };

    //Add current food to custom meal foods list
    const addFoodToCustomMeal = () => {
        const required = ["name", "calories", "protein", "carbs", "total_fat", "saturated_fat", "food_amount"];
        for (let field of required) {
            if (!currentFood[field]) {
                alert(`Please fill in ${field}`);
                return;
            }
        }

        setCustomMealFoods(prev => [...prev, { ...currentFood }]);
        setCurrentFood({
            name: "",
            calories: "",
            protein: "",
            carbs: "",
            total_fat: "",
            saturated_fat: "",
            cholesterol: "",
            sodium: "",
            sugar: "",
            food_amount: ""
        });
    };

    //Remove food from custom meal foods list
    const removeFoodFromCustomMeal = (index) => {
        setCustomMealFoods(prev => prev.filter((_, i) => i !== index));
    };

    //Save custom meal
    const handleSaveCustomMeal = async () => {
        if (!customMeal.name || !customMeal.meal_type) {
            alert("Please fill in meal name and meal type");
            return;
        }

        if (customMealFoods.length === 0) {
            alert("Please add at least one food to the meal");
            return;
        }

        const mealDate = customMeal.meal_date ? customMeal.meal_date : new Date().toISOString().split("T")[0];

        const payload = {
            name: customMeal.name,
            meal_type: customMeal.meal_type,
            meal_date: mealDate,
            foods: customMealFoods
        };

        try {
            const res = await fetch("http://localhost:5000/meals/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Meal added!");
                setOpenCustomModal(false);
                setCustomMeal({
                    name: "",
                    meal_type: "",
                    meal_date: ""
                });
                setCustomMealFoods([]);
                const mealsRes = await fetch("http://localhost:5000/meals/history", { credentials: "include" });
                const mealsData = await mealsRes.json();
                setSavedMeals(mealsData);
                const loggedRes = await fetch("http://localhost:5000/meals/logged", { credentials: "include" });
                const loggedData = await loggedRes.json();
                setLoggedMeals(loggedData);
            } else {
                alert("Failed to save meal");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving meal");
        }
    };

    //Search Food
    const handleSearch = async () => {
        try {
            const res = await fetch(`http://localhost:5000/meals/food/search?query=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
            const data = await res.json();
            console.log("Search response:", data);
            if (res.ok) {
                setSearchResults(data);
                setSearchFoodAmounts({});
            } else {
                console.error("Search error:", data.error);
                alert("Search error: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Search failed:", err);
            alert("Search failed: " + err.message);
        }
    };

    //Add food from search to meal
    const addFoodToMeal = (food) => {
        const amount = searchFoodAmounts[food.food_id];
        if (!amount) {
            alert("Please enter amount in grams");
            return;
        }
        setMealFoods(prev => [...prev, { ...food, food_amount: amount }]);
        setSearchFoodAmounts(prev => {
            const updated = { ...prev };
            delete updated[food.food_id];
            return updated;
        });
    };

    //Save meal from search foods
    const handleSaveMealFromSearch = async () => {
        if (!searchMealName || !searchMealType) {
            alert("Please enter meal name and meal type");
            return;
        }
        if (mealFoods.length === 0) {
            alert("Add at least one food to the meal");
            return;
        }
        const mealDate = searchMealDate ? searchMealDate : new Date().toISOString().split("T")[0];
        const payload = {
            name: searchMealName,
            meal_type: searchMealType,
            meal_date: mealDate,
            foods: mealFoods
        };
        try {
            const res = await fetch("http://localhost:5000/meals/reuse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Meal logged!");
                setOpenSearchModal(false);
                setMealFoods([]);
                setSearchResults([]);
                setSearchQuery("");
                setSearchFoodAmounts({});
                setSearchMealName("");
                setSearchMealType("");
                setSearchMealDate("");
                const loggedRes = await fetch("http://localhost:5000/meals/logged", { credentials: "include" });
                const loggedData = await loggedRes.json();
                setLoggedMeals(loggedData);
            }
        } catch (err) {
            console.error(err);
            alert("Error saving meal");
        }
    };

    //User can log a previously saved meal
    const handleReuseMeal = async (meal) => {

        const mealDate = reuseMealDate ? reuseMealDate : new Date().toISOString().split("T")[0];

        const payload = {
            meal_id: meal.meal_id,
            name: meal.name,
            meal_date: mealDate,
            meal_type: meal.meal_type,
            foods: meal.foods.map(f => ({
                food_id: f.food_id,
                food_amount: reuseMealAmounts[f.food_id] || f.food_amount
            }))
        };

        try {
            const res = await fetch("http://localhost:5000/meals/reuse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Meal logged again!");
                setOpenSavedModal(false);
                setReuseMealAmounts({});
                setReuseMealDate("");
                const loggedRes = await fetch("http://localhost:5000/meals/logged", { credentials: "include" });
                const loggedData = await loggedRes.json();
                setLoggedMeals(loggedData);
            }
        } catch (err) {
            console.error(err);
            alert("Error logging meal");
        }
    };

    const filteredSavedMeals = savedMeals.filter(meal => {
        const mealName = (meal.name || "").toLowerCase();
        const mealType = (meal.meal_type || "").toLowerCase();
        const query = savedMealSearchQuery.toLowerCase();
        return mealName.includes(query) || mealType.includes(query);
    });

    const filteredLoggedMeals = loggedMeals.filter(meal => {
        const mealName = (meal.name || "").toLowerCase();
        const mealType = (meal.meal_type || "").toLowerCase();
        const mealDate = meal.meal_date;

        const matchName = mealName.includes(loggedMealSearchName.toLowerCase());
        const matchDate = loggedMealSearchDate === "" || mealDate === loggedMealSearchDate;
        const matchType = loggedMealSearchType === "" || mealType === loggedMealSearchType.toLowerCase();

        return matchName && matchDate && matchType;
    });

    //Open edit logging modal with meal data
    const openEditMealModal = (meal) => {
        setEditingMeal(meal);
        setEditMealData({
            name: meal.name || "",
            meal_type: meal.meal_type || "",
            meal_date: meal.meal_date || "",
            foods: meal.foods.map(f => ({ food_id: f.food_id, food_amount: f.food_amount }))
        });
        setOpenEditModal(true);
    };

    //Save edited logged meal
    const handleSaveEditMeal = async () => {
        try {
            const res = await fetch("http://localhost:5000/meals/edit", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    meal_id: editingMeal.meal_id,
                    name: editMealData.name,
                    meal_type: editMealData.meal_type,
                    meal_date: editMealData.meal_date,
                    foods: editMealData.foods
                })
            });
            if (res.ok) {
                alert("Meal updated!");
                setOpenEditModal(false);
                const mealsRes = await fetch("http://localhost:5000/meals/logged", { credentials: "include" });
                const mealsData = await mealsRes.json();
                setLoggedMeals(mealsData);
            } else {
                alert("Failed to update meal");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating meal");
        }
    };

    //Delete meal
    const handleDeleteMeal = async (mealId) => {
        if (!window.confirm("Are you sure you want to delete this meal?")) return;

        try {
            const res = await fetch(`http://localhost:5000/meals/delete?meal_id=${mealId}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                alert("Meal deleted!");
                const mealsRes = await fetch("http://localhost:5000/meals/logged", { credentials: "include" });
                const mealsData = await mealsRes.json();
                setLoggedMeals(mealsData);
            } else {
                alert("Failed to delete meal");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting meal");
        }
    };

    const isAnyModalOpen = openCustomModal || openSearchModal || openSavedModal || openEditModal;

    const buttonClass = `
        px-6 py-3 rounded-xl font-semibold transition-colors
        bg-sage text-cream hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sage
    `;

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
            {/**Add a navbar */}
            <Navbar isLoggedIn={isLoggedIn} isSticky={isSticky} />

            <main className="max-w-4xl mx-auto p-6 space-y-8">
                {/** Title */}
                <h1 className="text-3xl font-bold text-center" style={{ color: colors.textDark }}>
                    Meals
                </h1>

                {/** Add Meal Card */}
                <div className="p-6 rounded-xl border-2 bg-white" style={{ borderColor: colors.mint }}>
                    <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.sage }}>
                        Add a Meal
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => setOpenCustomModal(true)}
                            className={buttonClass + " w-full"}
                            disabled={isAnyModalOpen}
                        >
                            Create Custom Meal
                        </button>
                        <button
                            onClick={() => setOpenSearchModal(true)}
                            className={buttonClass + " w-full"}
                            disabled={isAnyModalOpen}
                        >
                            Search Foods
                        </button>
                        <button
                            onClick={() => setOpenSavedModal(true)}
                            className={buttonClass + " w-full"}
                            disabled={isAnyModalOpen}
                        >
                            Log Previous Meal
                        </button>
                    </div>
                </div>

                {/** Logged Meals Card */}
                <div className="p-4 rounded-xl border-2 bg-white" style={{ borderColor: colors.mint }}>
                    <h2 className="text-xl font-bold mb-4 text-center" style={{ color: colors.sage }}>
                        Logged Meals
                    </h2>

                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="block font-semibold text-sm mb-2">Search by Name</label>
                            <input
                                type="text"
                                placeholder="Search meals..."
                                value={loggedMealSearchName}
                                onChange={e => setLoggedMealSearchName(e.target.value)}
                                className="p-2 border rounded-lg w-full"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold text-sm mb-2">Filter by Date</label>
                                <input
                                    type="date"
                                    value={loggedMealSearchDate}
                                    onChange={e => setLoggedMealSearchDate(e.target.value)}
                                    className="p-2 border rounded-lg w-full"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-sm mb-2">Filter by Type</label>
                                <select
                                    value={loggedMealSearchType}
                                    onChange={e => setLoggedMealSearchType(e.target.value)}
                                    className="p-2 border rounded-lg w-full"
                                >
                                    <option value="">All Types</option>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto space-y-3">
                        {filteredLoggedMeals.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No logged meals</p>
                        ) : (
                            filteredLoggedMeals.map(meal => (
                                <div key={meal.meal_id} className="p-4 border rounded-lg space-y-2" style={{ borderColor: colors.mint }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg" style={{ color: colors.sage }}>
                                                {meal.name || "Unnamed Meal"}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {meal.meal_type} • {formatDateDisplay(meal.meal_date)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditMealModal(meal)}
                                                className="px-3 py-1 rounded text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMeal(meal.meal_id)}
                                                className="px-3 py-1 rounded text-sm font-semibold bg-red-500 text-white hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {meal.foods && meal.foods.length > 0 && (
                                        <div className="bg-gray-50 p-3 rounded space-y-1">
                                            {meal.foods.map((food, idx) => (
                                                <div key={idx} className="text-sm text-gray-700">
                                                    <span className="font-medium">{food.description}</span>
                                                    <span className="text-gray-600"> • {food.food_amount}g</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/** Custom Meal Modal */}
                <ModalOverlay isOpen={openCustomModal} onClose={() => setOpenCustomModal(false)}>
                    <h2 className="text-2xl font-bold text-center mb-6">Add Custom Meal</h2>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg border-b pb-1" style={{ color: colors.sage }}>Meal Information</h3>
                            <div>
                                <label className="font-semibold text-sm">Meal Name</label>
                                <input name="name" value={customMeal.name} onChange={handleCustomChange}
                                    className="p-2 border rounded-lg w-full mt-1" placeholder="e.g., Breakfast" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-sm">Meal Type</label>
                                    <select name="meal_type" value={customMeal.meal_type} onChange={handleCustomChange}
                                        className="p-2 border rounded-lg w-full mt-1">
                                        <option value="">Select...</option>
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                        <option value="Snack">Snack</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Date (optional)</label>
                                    <input name="meal_date" value={customMeal.meal_date} onChange={handleCustomChange}
                                        type="date" className="p-2 border rounded-lg w-full mt-1" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg border-b pb-1" style={{ color: colors.sage }}>Add Food to Meal</h3>
                            <p className="text-xs text-gray-500 italic">Note: Enter nutrition information per 100g</p>

                            <div>
                                <label className="font-semibold text-sm">Food Name</label>
                                <input name="name" value={currentFood.name} onChange={handleFoodChange}
                                    className="p-2 border rounded-lg w-full mt-1" placeholder="e.g., Chicken Breast" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-sm">Amount (grams)</label>
                                    <input name="food_amount" value={currentFood.food_amount} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" placeholder="e.g., 250" />
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Calories (per 100g)</label>
                                    <input name="calories" value={currentFood.calories} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" placeholder="kcal" />
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Protein (g per 100g)</label>
                                    <input name="protein" value={currentFood.protein} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" />
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Carbs (g per 100g)</label>
                                    <input name="carbs" value={currentFood.carbs} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" />
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Total Fat (g per 100g)</label>
                                    <input name="total_fat" value={currentFood.total_fat} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" />
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Saturated Fat (g per 100g)</label>
                                    <input name="saturated_fat" value={currentFood.saturated_fat} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-2 mt-2">
                                <label className="text-xs text-gray-500 font-medium">Optional Nutrients</label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-sm">Sugar (g per 100g)</label>
                                    <input name="sugar" value={currentFood.sugar} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" />
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Cholesterol (mg per 100g)</label>
                                    <input name="cholesterol" value={currentFood.cholesterol} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" />
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Sodium (mg per 100g)</label>
                                    <input name="sodium" value={currentFood.sodium} onChange={handleFoodChange}
                                        type="number" className="p-2 border rounded-lg w-full mt-1" />
                                </div>
                            </div>

                            <button
                                className="px-4 py-2 rounded-lg font-semibold text-sm bg-sage text-cream hover:bg-green-600 w-full"
                                onClick={addFoodToCustomMeal}>
                                Add Food to Meal
                            </button>
                        </div>

                        {customMealFoods.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-b pb-1" style={{ color: colors.sage }}>Foods in This Meal</h3>
                                <div className="space-y-2">
                                    {customMealFoods.map((food, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold">{food.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {food.food_amount}g • {food.calories} cal • P: {food.protein}g C: {food.carbs}g F: {food.total_fat}g
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFoodFromCustomMeal(idx)}
                                                className="text-red-500 hover:text-red-700 font-semibold">
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button className={buttonClass + " w-full"} onClick={handleSaveCustomMeal}>Save Meal</button>
                            </div>
                        )}
                    </div>
                </ModalOverlay>

                {/** Search Food Modal */}
                <ModalOverlay isOpen={openSearchModal} onClose={() => {
                    setOpenSearchModal(false);
                    setSearchMealName("");
                    setSearchMealType("");
                    setSearchMealDate("");
                    setMealFoods([]);
                    setSearchResults([]);
                    setSearchQuery("");
                    setSearchFoodAmounts({});
                }}>
                    <h2 className="text-2xl font-bold text-center mb-4">Search Food</h2>
                    <div className="space-y-4">
                        <div className="space-y-3 border-b pb-4">
                            <h3 className="font-semibold text-lg" style={{ color: colors.sage }}>Meal Information</h3>
                            <div>
                                <label className="font-semibold text-sm">Meal Name</label>
                                <input name="name" value={searchMealName} onChange={e => setSearchMealName(e.target.value)}
                                    className="p-2 border rounded-lg w-full mt-1" placeholder="e.g., Breakfast" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-sm">Meal Type</label>
                                    <select name="meal_type" value={searchMealType} onChange={e => setSearchMealType(e.target.value)}
                                        className="p-2 border rounded-lg w-full mt-1">
                                        <option value="">Select...</option>
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                        <option value="Snack">Snack</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-semibold text-sm">Date (optional)</label>
                                    <input name="meal_date" value={searchMealDate} onChange={e => setSearchMealDate(e.target.value)}
                                        type="date" className="p-2 border rounded-lg w-full mt-1" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg" style={{ color: colors.sage }}>Search Foods</h3>
                            <div className="flex gap-2">
                                <input className="p-2 border rounded-lg flex-1" value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search (e.g., chicken breast)"
                                    onKeyPress={e => e.key === 'Enter' && handleSearch()} />
                                <button className={buttonClass} onClick={handleSearch}>Search</button>
                            </div>
                        </div>

                        {searchResults && (
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50">
                                    <span className="flex-1 text-sm">{searchResults.description}</span>
                                    <input
                                        type="number"
                                        placeholder="grams"
                                        className="p-2 border rounded w-24 text-sm"
                                        value={searchFoodAmounts[searchResults.food_id] || ""}
                                        onChange={e => setSearchFoodAmounts(prev => ({
                                            ...prev,
                                            [searchResults.food_id]: e.target.value
                                        }))}
                                    />
                                    <button
                                        className="px-4 py-2 rounded-lg font-semibold text-sm bg-sage text-cream hover:bg-green-600"
                                        onClick={() => addFoodToMeal(searchResults)}>
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        {mealFoods.length > 0 && (
                            <div className="p-3 bg-gray-50 rounded-lg border-t pt-4">
                                <h3 className="font-semibold mb-3">Foods in Current Meal</h3>
                                <div className="space-y-2 mb-3">
                                    {mealFoods.map((f, idx) => (
                                        <div key={idx} className="flex justify-between p-2 bg-white border rounded text-sm">
                                            <span className="font-medium">{f.description}</span>
                                            <span className="text-gray-600">{f.food_amount}g</span>
                                        </div>
                                    ))}
                                </div>
                                <button className={buttonClass + " w-full"} onClick={handleSaveMealFromSearch}>Save Meal</button>
                            </div>
                        )}
                    </div>
                </ModalOverlay>

                {/** Saved Meals Modal */}
                <ModalOverlay isOpen={openSavedModal} onClose={() => {
                    setOpenSavedModal(false);
                    setSavedMealSearchQuery("");
                }}>
                    <h2 className="text-xl font-semibold text-center mb-4" style={{ color: colors.textDark }}>
                        Log a Previous Meal
                    </h2>
                    <input
                        type="text"
                        placeholder="Search meals by name..."
                        value={savedMealSearchQuery}
                        onChange={e => setSavedMealSearchQuery(e.target.value)}
                        className="p-2 border rounded-lg w-full mb-4"
                    />
                    <div className="space-y-4">
                        {filteredSavedMeals.length === 0 && (
                            <p className="text-center text-gray-500">No previous meals found</p>
                        )}
                        {filteredSavedMeals.map(meal => (
                            <div key={meal.meal_id} className="p-4 border-2 rounded-xl space-y-3" style={{ borderColor: colors.mint }}>
                                <div>
                                    <h3 className="font-bold text-lg" style={{ color: colors.sage }}>
                                        {meal.name || "Unnamed Meal"}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {meal.meal_type} • {meal.meal_date}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-semibold text-sm">New Date for This Meal</label>
                                    <input
                                        type="date"
                                        className="p-2 border rounded-lg w-full"
                                        value={reuseMealDate}
                                        onChange={e => setReuseMealDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-semibold text-sm">Adjust Food Amounts (optional)</label>
                                    {meal.foods && meal.foods.map(f => (
                                        <div key={f.food_id} className="flex items-center gap-2">
                                            <span className="flex-1 text-sm">{f.description}</span>
                                            <input
                                                type="number"
                                                className="p-2 border rounded-lg w-24 text-sm"
                                                placeholder={`${f.food_amount}g`}
                                                value={reuseMealAmounts[f.food_id] || f.food_amount}
                                                onChange={e => setReuseMealAmounts(prev => ({
                                                    ...prev,
                                                    [f.food_id]: e.target.value
                                                }))}
                                            />
                                            <span className="text-xs text-gray-500">g</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className={buttonClass + " w-full"}
                                    onClick={() => handleReuseMeal(meal)}>
                                    Log This Meal
                                </button>
                            </div>
                        ))}
                    </div>
                </ModalOverlay>

                {/** Edit Meal Modal */}
                <ModalOverlay isOpen={openEditModal} onClose={() => setOpenEditModal(false)}>
                    <h2 className="text-2xl font-bold text-center mb-6">Edit Meal</h2>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg border-b pb-1" style={{ color: colors.sage }}>Meal Information</h3>
                            <div>
                                <label className="font-semibold text-sm">Meal Name</label>
                                <input
                                    value={editMealData.name}
                                    onChange={e => setEditMealData(prev => ({ ...prev, name: e.target.value }))}
                                    className="p-2 border rounded-lg w-full mt-1"
                                    placeholder="e.g., Breakfast"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-sm">Meal Type</label>
                                    <select
                                        value={editMealData.meal_type}
                                        onChange={e => setEditMealData(prev => ({ ...prev, meal_type: e.target.value }))}
                                        className="p-2 border rounded-lg w-full mt-1">
                                        <option value="">Select...</option>
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                        <option value="Snack">Snack</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-sm">Date</label>
                                    <input
                                        value={editMealData.meal_date}
                                        onChange={e => setEditMealData(prev => ({ ...prev, meal_date: e.target.value }))}
                                        type="date"
                                        className="p-2 border rounded-lg w-full mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                        {editingMeal && editingMeal.foods && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-b pb-1" style={{ color: colors.sage }}>Adjust Food Amounts</h3>
                                <div className="space-y-3">
                                    {editingMeal.foods.map((food, idx) => (
                                        <div key={food.food_id} className="p-3 border rounded-lg">
                                            <p className="font-semibold text-sm mb-2">{food.description}</p>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm">Amount (g):</label>
                                                <input
                                                    type="number"
                                                    value={editMealData.foods[idx]?.food_amount || ""}
                                                    onChange={e => {
                                                        const newFoods = [...editMealData.foods];
                                                        newFoods[idx] = { ...newFoods[idx], food_amount: parseFloat(e.target.value) };
                                                        setEditMealData(prev => ({ ...prev, foods: newFoods }));
                                                    }}
                                                    className="p-2 border rounded w-24 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button
                            className={buttonClass + " w-full"}
                            onClick={handleSaveEditMeal}>
                            Save Changes
                        </button>
                    </div>
                </ModalOverlay>
            </main>

            <div className="flex justify-center pb-4">
                <LogoutButton />
            </div>
        </div>
    );
}

