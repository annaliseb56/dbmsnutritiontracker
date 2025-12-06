import { Search, UserPlus } from "lucide-react";
import colors from "../../theme/colors";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || '" + API_URL + "';

export default function SearchBar({ onRequestSent }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a username to search");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/friends/search?query=${encodeURIComponent(query)}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.users || []);

      if (data.users.length === 0) {
        setError("No users found");
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError("Failed to search. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ friend_id: userId })
      });

      if (response.ok) {
        setResults(results.map(user =>
          user.user_id === userId
            ? { ...user, friendshipStatus: 'pending' }
            : user
        ));

        if (onRequestSent) {
          onRequestSent();
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send friend request');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Failed to send friend request');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusButton = (user) => {
    if (user.friendshipStatus === 'accepted') {
      return (
        <span className="px-3 py-1 rounded text-sm" style={{ backgroundColor: colors.lightGreen, color: colors.darkGreen }}>
          Friends
        </span>
      );
    } else if (user.friendshipStatus === 'pending') {
      return (
        <span className="px-3 py-1 rounded text-sm" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
          Request Sent
        </span>
      );
    } else {
      return (
        <button
          onClick={() => handleSendRequest(user.user_id)}
          className="px-3 py-1 rounded flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ backgroundColor: colors.sage, color: "white" }}
        >
          <UserPlus className="w-4 h-4" /> Add Friend
        </button>
      );
    }
  };

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: colors.sage }}>
      <h2 className="flex items-center text-xl font-semibold mb-4" style={{ color: colors.darkGreen }}>
        <Search className="w-5 h-5 mr-2" /> Search & Add Friends
      </h2>

      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 px-3 py-2 rounded-lg border outline-none focus:ring-2"
          style={{ borderColor: colors.sage }}
          placeholder="Enter username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2 rounded flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: colors.sage, color: "white" }}
        >
          <Search className="w-4 h-4" /> {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold" style={{ color: colors.darkGreen }}>Search Results:</h3>
          {results.map((user) => (
            <div
              key={user.user_id}
              className="p-3 rounded-xl flex justify-between items-center"
              style={{ backgroundColor: colors.mint }}
            >
              <div className="flex gap-3 items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg"
                  style={{ backgroundColor: colors.sage, color: "white" }}
                >
                  {user.username[1]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p style={{ color: colors.textDark }}>{user.username}</p>
                  {user.nickname && (
                    <p className="text-sm" style={{ color: colors.sage }}>{user.nickname}</p>
                  )}
                </div>
              </div>
              {getStatusButton(user)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
