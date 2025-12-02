import Navbar from "../components/Navbar";
import colors from "../theme/colors";
import { useEffect, useState } from "react";
import ChallengesList from "../components/friends/ChallengesList";
import PendingRequests from "../components/friends/PendingRequests";
import FriendsList from "../components/friends/FriendsList";
import SearchBar from "../components/friends/SearchBar";
import LogoutButton from "../components/LogoutButton";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Friends() {
    const isLoggedIn = true;
    const isSticky = false;

    const [challenges, setChallenges] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all friends data from backend
    const fetchFriendsData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/friends/all`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch friends data');
            }

            const data = await response.json();
            setChallenges(data.challenges || []);
            setPendingRequests(data.pendingRequests || []);
            setFriends(data.friends || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching friends data:', err);
            setError('Failed to load friends data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriendsData();
    }, []);

    // Handle accepting friend request
    const handleAcceptRequest = async (friendshipId) => {
        try {
            const response = await fetch(`${API_URL}/api/friends/accept/${friendshipId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                fetchFriendsData();
            }
        } catch (err) {
            console.error('Error accepting friend request:', err);
        }
    };

    // Handle declining friend request
    const handleDeclineRequest = async (friendshipId) => {
        try {
            const response = await fetch(`${API_URL}/api/friends/decline/${friendshipId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                fetchFriendsData();
            }
        } catch (err) {
            console.error('Error declining friend request:', err);
        }
    };

    // Handle accepting challenge
    const handleAcceptChallenge = async (challengeId) => {
        try {
            const response = await fetch(`${API_URL}/api/challenges/accept/${challengeId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                fetchFriendsData();
            }
        } catch (err) {
            console.error('Error accepting challenge:', err);
        }
    };

    // Handle declining challenge
    const handleDeclineChallenge = async (challengeId) => {
        try {
            const response = await fetch(`${API_URL}/api/challenges/decline/${challengeId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                fetchFriendsData();
            }
        } catch (err) {
            console.error('Error declining challenge:', err);
        }
    };

    // Handle removing friend
    const handleRemoveFriend = async (friendUserId) => {
        if (!window.confirm('Are you sure you want to remove this friend?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/friends/remove/${friendUserId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                fetchFriendsData();
            }
        } catch (err) {
            console.error('Error removing friend:', err);
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
            <Navbar isLoggedIn={isLoggedIn} isSticky={isSticky} />

            <div className="max-w-5xl mx-auto p-6 space-y-8">
                {loading && (
                    <div className="text-center p-8">
                        <p style={{ color: colors.darkGreen }}>Loading friends data...</p>
                    </div>
                )}

                {error && (
                    <div className="rounded-xl p-5 border" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
                        <p style={{ color: '#dc2626' }}>{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <ChallengesList
                            challenges={challenges}
                            onAccept={handleAcceptChallenge}
                            onDecline={handleDeclineChallenge}
                        />
                        <PendingRequests
                            pendingRequests={pendingRequests}
                            onAccept={handleAcceptRequest}
                            onDecline={handleDeclineRequest}
                        />
                        <SearchBar onRequestSent={fetchFriendsData} />
                        <FriendsList
                            friends={friends}
                            onRemove={handleRemoveFriend}
                            onChallengeSent={fetchFriendsData}
                        />
                    </>
                )}
            </div>

            <div className="flex justify-center pb-4">
                <LogoutButton />
            </div>
        </div>
    );
}