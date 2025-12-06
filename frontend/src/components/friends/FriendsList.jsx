import { User, UserMinus, Send } from "lucide-react";
import colors from "../../theme/colors";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || '" + API_URL + "';

export default function FriendsList({ friends, onRemove, onChallengeSent }) {
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [challengeForm, setChallengeForm] = useState({
    goal_type: 'Workout',
    name: '',
    target_value: '',
    goal_end_date: '',
    metric_type: 'numeric'
  });
  const [submitting, setSubmitting] = useState(false);

  if (!friends.length) return null;

  const handleSendChallenge = (friend) => {
    setSelectedFriend(friend);
    setShowChallengeModal(true);
  };

  const handleSubmitChallenge = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/challenges/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          friend_id: selectedFriend.id,
          ...challengeForm
        })
      });

      if (response.ok) {
        alert('Challenge sent successfully!');
        setShowChallengeModal(false);
        setChallengeForm({
          goal_type: 'Workout',
          name: '',
          target_value: '',
          goal_end_date: '',
          metric_type: 'numeric'
        });
        if (onChallengeSent) {
          onChallengeSent();
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send challenge');
      }
    } catch (err) {
      console.error('Error sending challenge:', err);
      alert('Failed to send challenge');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: colors.sage }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: colors.darkGreen }}>
          Current Friends ({friends.length})
        </h2>

        <div className="space-y-4">
          {friends.map((f) => (
            <div key={f.id} className="p-4 rounded-xl flex gap-4 items-start" style={{ backgroundColor: colors.mint }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-lg" style={{ backgroundColor: colors.sage, color: "white" }}>
                {f.username[1]?.toUpperCase() || "?"}
              </div>

              <div className="flex-1">
                <p style={{ color: colors.textDark }}>{f.username}</p>
                <div className="flex gap-2 flex-wrap mt-3">
                  <button
                    onClick={() => handleSendChallenge(f)}
                    className="px-3 py-1 rounded flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: colors.sage, color: "white" }}
                  >
                    <Send className="w-4 h-4" /> Send Challenge
                  </button>

                  <button
                    onClick={() => onRemove(f.id)}
                    className="px-3 py-1 rounded flex items-center gap-1 border hover:bg-red-50 transition-colors"
                    style={{ borderColor: "#fca5a5", color: "#dc2626" }}
                  >
                    <UserMinus className="w-4 h-4" /> Remove Friend
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl p-6 max-w-md w-full" style={{ backgroundColor: "white" }}>
            <h3 className="text-xl font-semibold mb-4" style={{ color: colors.darkGreen }}>
              Send Challenge to {selectedFriend?.username}
            </h3>

            <form onSubmit={handleSubmitChallenge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                  Challenge Type
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: colors.sage }}
                  value={challengeForm.goal_type}
                  onChange={(e) => setChallengeForm({ ...challengeForm, goal_type: e.target.value })}
                  required
                >
                  <option value="Workout">Workout</option>
                  <option value="Steps">Steps</option>
                  <option value="Calories">Calories</option>
                  <option value="Water">Water Intake</option>
                  <option value="Weight">Weight Loss</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                  Challenge Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: colors.sage }}
                  placeholder="e.g., 30-Day Workout Streak"
                  value={challengeForm.name}
                  onChange={(e) => setChallengeForm({ ...challengeForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                  Target Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: colors.sage }}
                  placeholder="e.g., 10000 steps"
                  value={challengeForm.target_value}
                  onChange={(e) => setChallengeForm({ ...challengeForm, target_value: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: colors.sage }}
                  value={challengeForm.goal_end_date}
                  onChange={(e) => setChallengeForm({ ...challengeForm, goal_end_date: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded hover:opacity-80 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: colors.sage, color: "white" }}
                >
                  {submitting ? 'Sending...' : 'Send Challenge'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChallengeModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded border hover:bg-gray-50 transition-colors disabled:opacity-50"
                  style={{ borderColor: colors.sage, color: colors.darkGreen }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}