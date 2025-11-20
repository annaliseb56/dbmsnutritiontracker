import { Send, User, UserMinus } from "lucide-react";
import colors from "../../theme/colors";

export default function FriendsList({ friends }) {
  if (!friends.length) return null; //If there are no friends don't rub it in their face get rid of the component

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: colors.sage }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: colors.darkGreen }}>
        Current Friends ({friends.length}) {/**Show the number of friends the person has*/}
      </h2>

      <div className="space-y-4">
        {/**Create a friend element for every friend in the friends list*/}
        {friends.map((f) => (
          <div key={f.id} className="p-4 rounded-xl flex gap-4 items-start" style={{ backgroundColor: colors.mint }}>
            {/**This will setup the use icon with their initials, might remove but don't know what to do with the space*/}
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-lg" style={{ backgroundColor: colors.sage, color: "white" }}>
              {f.username[1]?.toUpperCase() || "?"}
            </div>

            {/**Setup buttons for every friend */}
            <div className="flex-1">
              <p style={{ color: colors.textDark }}>{f.username}</p>
              <div className="flex gap-2 flex-wrap mt-3">
                {/* <button className="px-3 py-1 rounded flex items-center gap-1" style={{ backgroundColor: colors.sage, color: "white" }}>
                  <Send className="w-4 h-4" /> Send Challenge
                </button> */}
                <button className="px-3 py-1 rounded flex items-center gap-1 border" style={{ borderColor: colors.sage, color: colors.darkGreen }}>
                  <User className="w-4 h-4" /> View Profile
                </button>
                <button className="px-3 py-1 rounded flex items-center gap-1 border" style={{ borderColor: "#fca5a5", color: "#dc2626" }}>
                  <UserMinus className="w-4 h-4" /> Remove Friend
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
