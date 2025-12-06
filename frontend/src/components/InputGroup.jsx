import colors from "../theme/colors";

export default function InputGroup({
  label,
  Icon,
  type = "text",
  value = "",
  onChange,
  unit,
  placeholder
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium" style={{ color: colors.textDark }}>
        {label}
      </label>

      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-white"
        style={{ borderColor: colors.lightGreen }}
      >
        <Icon className="w-5 h-5 opacity-70" style={{ color: colors.sage }} />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 outline-none"
        />
        {/**If unit exists render small text for unit at the right of the input box*/}
        {unit && (
          <span className="text-sm opacity-70" style={{ color: colors.darkGreen }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}