import { mapStyleLabels, type MapStyleKey } from './map-styles';

export function MapStyleSelect({
  value,
  onChange,
}: {
  value: MapStyleKey;
  onChange: (value: MapStyleKey) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as MapStyleKey)}
      className="rounded-xl border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-2 text-sm font-medium text-[color:var(--color-text)] shadow-[0_12px_24px_rgba(15,23,42,0.14)] outline-none backdrop-blur-sm"
      aria-label="Map style"
    >
      {Object.entries(mapStyleLabels).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
