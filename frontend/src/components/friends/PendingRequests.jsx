import { UserPlus, Check, X } from "lucide-react";
import colors from "../../theme/colors";

{/**
  Inspiration for this pendingRequest component, from figma make friends page. Edited to
  be a component, to clean friends code, changed to fit the style of the website.  
*/}

export default function PendingRequests({ pendingRequests }) {
  if (!pendingRequests.length) return null; //Only show this element if there is somthing in it.

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: colors.sage }}>
      <h2 className="flex items-center text-xl font-semibold mb-4" style={{ color: colors.darkGreen }}>
        <UserPlus className="w-5 h-5 mr-2" /> Pending Friend Requests ({pendingRequests.length})
      </h2>

      <div className="space-y-3">
        {/**We will loop through every request in pending requests and create an element for each one*/}
        {pendingRequests.map((req) => ( 
          <div key={req.id} className="p-3 rounded-xl flex justify-between items-center" style={{ backgroundColor: colors.mint }}>
            <div className="flex gap-3 items-center">
              {/**This will setup the use icon with their initials, might remove but don't know what to do with the space*/}
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg" style={{ backgroundColor: colors.sage, color: "white" }}>
                {req.user.username[1]?.toUpperCase() || "?"}
              </div>
              <p style={{ color: colors.textDark }}>{req.user.username}</p>
              <span className="text-sm" style={{ color: colors.sage }}>{req.date}</span>
            </div>
            {/**Buttons to accept or decline the request*/}
            <div className="flex gap-2">
              <button className="p-2 rounded" style={{ backgroundColor: colors.sage, color: "white" }}>
                <Check className="w-4 h-4" />
              </button>
              <button className="p-2 rounded border" style={{ borderColor: colors.sage, color: colors.darkGreen }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
