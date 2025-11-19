import colors from "../theme/colors";

export default function InputGroup({
  label,
  Icon,
  type = "text",
  defaultValue = "",
  unit
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium" style={{ color: colors.textDark }}>
        {label}
      </label>

      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white"
        style={{ borderColor: colors.lightGreen }}
      >
        <Icon className="w-5 h-5 opacity-70" style={{ color: colors.sage }} />
        <input
          type={type}
          defaultValue={defaultValue}
          className="flex-1 outline-none"
        />
        {unit && (
          <span className="text-sm opacity-70" style={{ color: colors.darkGreen }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}