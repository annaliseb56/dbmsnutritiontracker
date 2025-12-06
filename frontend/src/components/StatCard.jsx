import colors from "../theme/colors";

export default function StatCard({ icon: Icon, iconBg, iconColor, value, label }) {
    return (
        <div
            className="p-5 rounded-2xl shadow-sm border-2 flex flex-col gap-3"
            style={{ borderColor: colors.lightGreen, backgroundColor: "white" }}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: iconBg, color: iconColor }}
            >
                <Icon className="w-7 h-7" />
            </div>

            <div className="text-xl font-semibold" style={{ color: colors.textDark }}>
                {value}
            </div>

            <div className="text-sm opacity-70" style={{ color: colors.darkGreen }}>
                {label}
            </div>
        </div>
    );
}