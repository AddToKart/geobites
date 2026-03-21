export const mapStyles = {
  default: undefined,
  openstreetmap: 'https://tiles.openfreemap.org/styles/bright',
  openstreetmap3d: 'https://tiles.openfreemap.org/styles/liberty',
} as const;

export type MapStyleKey = keyof typeof mapStyles;

export const defaultMapStyle: MapStyleKey = 'openstreetmap3d';

export const mapStyleLabels: Record<MapStyleKey, string> = {
  default: 'Default (Carto)',
  openstreetmap: 'OpenStreetMap',
  openstreetmap3d: 'OpenStreetMap 3D',
};
