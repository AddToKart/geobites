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
      className="rounded-none border border-border bg-background px-3 py-2 text-xs font-bold uppercase tracking-widest text-foreground outline-none"
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
