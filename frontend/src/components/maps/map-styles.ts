export const mapStyles = {
  default: {},
  openstreetmap: {
    light: 'https://tiles.openfreemap.org/styles/bright',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  openstreetmap3d: {
    light: 'https://tiles.openfreemap.org/styles/liberty',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
} as const;

export type MapStyleKey = keyof typeof mapStyles;

export const defaultMapStyle: MapStyleKey = 'openstreetmap3d';

export const mapStyleLabels: Record<MapStyleKey, string> = {
  default: 'Default (Carto)',
  openstreetmap: 'OpenStreetMap',
  openstreetmap3d: 'OpenStreetMap 3D',
};
