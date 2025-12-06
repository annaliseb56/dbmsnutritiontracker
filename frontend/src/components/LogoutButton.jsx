const API_URL = import.meta.env.VITE_API_URL || '/api';
import { LogOut } from "lucide-react";


export default function LogoutButton({ redirectUrl = "/" }) {
    //Handle the logout with the backend
    const handleLogout = async () => {
    try {
        //Send a request to the logout backend
        const res = await fetch("" + API_URL + "/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },     
            credentials: "include",  
        });
        //If successful redirect to the given redirect URL
        if (res.ok) {
            window.location.href = redirectUrl; 
        } else {
            console.error("Failed to log out");
        }
        } catch (err) {
        console.error("Error logging out:", err);
        }
    };

    //The html element (button shown)
    return (
        <button
        className="flex items-center gap-2 px-6 py-3 text-red-600"
        style={{
            borderColor: "#ffcaca",
            backgroundColor: "white",
            borderWidth: "2px",
            borderStyle: "solid",
            borderRadius: "0.75rem",
        }}
        onClick={handleLogout}
        >
        <LogOut />
        Sign Out
        </button>
    );
}
