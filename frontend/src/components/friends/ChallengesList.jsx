import { Send, Check, X } from "lucide-react";
import colors from "../../theme/colors";

export default function ChallengesList({ challenges, onAccept, onDecline }) {
  if (!challenges.length) return null;

  return (
    <div
      className="rounded-xl p-5 border"
      style={{ backgroundColor: "white", borderColor: colors.sage }}
    >
      <h2 className="flex items-center text-xl font-semibold mb-4" style={{ color: colors.darkGreen }}>
        <Send className="w-5 h-5 mr-2" /> Challenges From Friends
      </h2>
      <div className="space-y-4">
        {challenges.map((c) => (
          <div
            key={c.id}
            className="p-4 rounded-lg flex gap-4 items-start"
            style={{ backgroundColor: colors.cream }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg"
              style={{ backgroundColor: colors.sage, color: "white" }}
            >
              {c.from.username[1]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p style={{ color: colors.textDark }}>{c.from.username}</p>
                <span
                  className="px-3 py-1 rounded text-sm"
                  style={{ backgroundColor: colors.lightGreen, color: colors.darkGreen }}
                >
                  {c.type}
                </span>
              </div>
              <p className="mt-2" style={{ color: colors.textDark }}>{c.description}</p>
              <p className="text-sm mt-1" style={{ color: colors.sage }}>{c.date}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onAccept(c.id)}
                  className="px-3 py-1 rounded flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: colors.sage, color: "white" }}
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => onDecline(c.id)}
                  className="px-3 py-1 rounded flex items-center gap-1 border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: colors.sage, color: colors.darkGreen }}
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}