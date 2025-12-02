import { UserPlus, Check, X } from "lucide-react";
import colors from "../../theme/colors";

export default function PendingRequests({ pendingRequests, onAccept, onDecline }) {
  if (!pendingRequests.length) return null;

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: colors.sage }}>
      <h2 className="flex items-center text-xl font-semibold mb-4" style={{ color: colors.darkGreen }}>
        <UserPlus className="w-5 h-5 mr-2" /> Pending Friend Requests ({pendingRequests.length})
      </h2>
      <div className="space-y-3">
        {pendingRequests.map((req) => (
          <div key={req.id} className="p-3 rounded-xl flex justify-between items-center" style={{ backgroundColor: colors.mint }}>
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg" style={{ backgroundColor: colors.sage, color: "white" }}>
                {req.user.username[1]?.toUpperCase() || "?"}
              </div>
              <p style={{ color: colors.textDark }}>{req.user.username}</p>
              <span className="text-sm" style={{ color: colors.sage }}>{req.date}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAccept(req.id)}
                className="p-2 rounded hover:opacity-80 transition-opacity"
                style={{ backgroundColor: colors.sage, color: "white" }}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDecline(req.id)}
                className="p-2 rounded border hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.sage, color: colors.darkGreen }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}