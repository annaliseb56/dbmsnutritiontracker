import { Search } from "lucide-react";
import colors from "../../theme/colors";

export default function SearchBar() {
  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: colors.sage }}>
      <h2 className="flex items-center text-xl font-semibold mb-4" style={{ color: colors.darkGreen }}>
        <Search className="w-5 h-5 mr-2" /> Search & Add Friends
      </h2>

      <div className="flex gap-3">
        <input
          className="flex-1 px-3 py-2 rounded-lg border"
          style={{ borderColor: colors.sage }}
          placeholder="Enter username..."
        />
        <button className="px-4 py-2 rounded flex items-center gap-2" style={{ backgroundColor: colors.sage, color: "white" }}>
          <Search className="w-4 h-4" /> Search
        </button>
      </div>
    </div>
  );
}
