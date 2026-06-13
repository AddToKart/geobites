import { MenuItem, Vendor } from '@/types';

export const santaMariaBulacanCenter = {
  lat: 14.8214,
  lng: 120.9565,
};

const timestamp = '2026-03-21T08:00:00.000Z';

export type DemoVendor = Vendor & {
  etaMinutes: string;
  neighborhood: string;
  specialties: string[];
  priceBand: string;
  spotlight: string;
};

export const demoVendors: DemoVendor[] = [
  {
    id: 'demo-kape-baryo',
    userId: 'demo-seller-kape-baryo',
    name: 'Kape at Almusal Baryo',
    description:
      'Silog plates, kapeng barako, pandesal trays, and quick breakfast sets for the Santa Maria morning rush.',
    address: 'Poblacion Road corner C. Vergel Street, Santa Maria, Bulacan',
    latitude: 14.8222,
    longitude: 120.9557,
    rating: 4.9,
    totalRatings: 214,
    isActive: true,
    commissionRate: 0.15,
    createdAt: timestamp,
    updatedAt: timestamp,
    etaMinutes: '18-28 min',
    neighborhood: 'Poblacion',
    specialties: ['Breakfast', 'Coffee', 'Silog'],
    priceBand: '₱₱',
    spotlight: 'Morning favorite',
  },
  {
    id: 'demo-ihaw-central',
    userId: 'demo-seller-ihaw-central',
    name: 'Bulacan Ihaw Central',
    description:
      'Charcoal-grilled liempo, chicken inasal, sizzling sisig, and family platters made for lunch and late dinners.',
    address: 'Santa Maria Bypass Road, Guyong, Santa Maria, Bulacan',
    latitude: 14.8308,
    longitude: 120.9639,
    rating: 4.7,
    totalRatings: 143,
    isActive: true,
    commissionRate: 0.15,
    createdAt: timestamp,
    updatedAt: timestamp,
    etaMinutes: '25-35 min',
    neighborhood: 'Guyong',
    specialties: ['Ihaw-Ihaw', 'Sisig', 'Platters'],
    priceBand: '₱₱₱',
    spotlight: 'Group orders',
  },
  {
    id: 'demo-pancit-palengke',
    userId: 'demo-seller-pancit-palengke',
    name: 'Palengke Pancit Corner',
    description:
      'Classic Bulacan noodle trays, lumpiang sariwa, and merienda combos cooked fast for office and barangay orders.',
    address: 'Market Link Road, Bagbaguin, Santa Maria, Bulacan',
    latitude: 14.8161,
    longitude: 120.9498,
    rating: 4.6,
    totalRatings: 96,
    isActive: true,
    commissionRate: 0.15,
    createdAt: timestamp,
    updatedAt: timestamp,
    etaMinutes: '20-30 min',
    neighborhood: 'Bagbaguin',
    specialties: ['Pancit', 'Merienda', 'Bilao'],
    priceBand: '₱₱',
    spotlight: 'Merienda rush',
  },
  {
    id: 'demo-garden-sweets',
    userId: 'demo-seller-garden-sweets',
    name: 'Garden Halo & Sweets',
    description:
      'Halo-halo jars, leche flan boxes, fruit coolers, and soft-serve desserts for hot Santa Maria afternoons.',
    address: 'Catmon Service Lane, Santa Maria, Bulacan',
    latitude: 14.8119,
    longitude: 120.9621,
    rating: 4.8,
    totalRatings: 121,
    isActive: true,
    commissionRate: 0.15,
    createdAt: timestamp,
    updatedAt: timestamp,
    etaMinutes: '15-22 min',
    neighborhood: 'Catmon',
    specialties: ['Desserts', 'Cold drinks', 'Halo-halo'],
    priceBand: '₱',
    spotlight: 'Cool down pick',
  },
];

const demoVendorMenusById: Record<string, MenuItem[]> = {
  'demo-kape-baryo': [
    {
      id: 'demo-kape-baryo-tapsilog',
      vendorId: 'demo-kape-baryo',
      name: 'Tapsilog Supreme',
      description: 'Cured beef tapa, garlic rice, fried egg, and atsara.',
      price: 145,
      category: 'Breakfast plates',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-kape-baryo-pandesal-set',
      vendorId: 'demo-kape-baryo',
      name: 'Pandesal Breakfast Box',
      description: 'Fresh pandesal, kesong puti spread, and brewed barako coffee.',
      price: 120,
      category: 'Breakfast plates',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-kape-baryo-spanish-latte',
      vendorId: 'demo-kape-baryo',
      name: 'Spanish Latte',
      description: 'Creamy espresso drink served hot or iced.',
      price: 105,
      category: 'Coffee',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-kape-baryo-chicken-arroz',
      vendorId: 'demo-kape-baryo',
      name: 'Chicken Arroz Caldo',
      description: 'Slow-cooked rice porridge with toasted garlic and boiled egg.',
      price: 130,
      category: 'Comfort bowls',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  'demo-ihaw-central': [
    {
      id: 'demo-ihaw-central-liempo',
      vendorId: 'demo-ihaw-central',
      name: 'Liempo Rice Plate',
      description: 'Char-grilled liempo with java rice and ensalada.',
      price: 189,
      category: 'Grill plates',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-ihaw-central-sisig',
      vendorId: 'demo-ihaw-central',
      name: 'Sizzling Sisig',
      description: 'Classic chopped sisig served on a hot plate.',
      price: 210,
      category: 'Sizzling',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-ihaw-central-inalsal',
      vendorId: 'demo-ihaw-central',
      name: 'Chicken Inasal Quarter',
      description: 'Juicy inasal chicken with garlic rice and toyomansi.',
      price: 175,
      category: 'Grill plates',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-ihaw-central-platter',
      vendorId: 'demo-ihaw-central',
      name: 'Barkada Ihaw Platter',
      description: 'Liempo, barbecue, chicken inasal, and grilled vegetables.',
      price: 699,
      category: 'Sharing platters',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  'demo-pancit-palengke': [
    {
      id: 'demo-pancit-palengke-bihon',
      vendorId: 'demo-pancit-palengke',
      name: 'Pancit Bihon Bilao',
      description: 'Party-size bihon with pork, vegetables, and calamansi.',
      price: 390,
      category: 'Bilao specials',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-pancit-palengke-canton',
      vendorId: 'demo-pancit-palengke',
      name: 'Pancit Canton Solo',
      description: 'Wok-fried canton noodles for one with toasted garlic.',
      price: 120,
      category: 'Solo trays',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-pancit-palengke-lumpia',
      vendorId: 'demo-pancit-palengke',
      name: 'Lumpiang Sariwa Pair',
      description: 'Two fresh lumpia rolls with peanut garlic sauce.',
      price: 95,
      category: 'Merienda',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-pancit-palengke-puto',
      vendorId: 'demo-pancit-palengke',
      name: 'Puto Bumbong Box',
      description: 'Four sticky rice cakes with coconut and muscovado.',
      price: 110,
      category: 'Merienda',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  'demo-garden-sweets': [
    {
      id: 'demo-garden-sweets-halo',
      vendorId: 'demo-garden-sweets',
      name: 'Premium Halo-Halo Jar',
      description: 'Layered shaved ice dessert with leche flan and ube halaya.',
      price: 149,
      category: 'Desserts',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-garden-sweets-mango',
      vendorId: 'demo-garden-sweets',
      name: 'Mango Graham Cooler',
      description: 'Fresh mango cream cooler with crushed graham.',
      price: 125,
      category: 'Cold drinks',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-garden-sweets-flan',
      vendorId: 'demo-garden-sweets',
      name: 'Leche Flan Duo',
      description: 'Two silky leche flan cups packed chilled.',
      price: 135,
      category: 'Desserts',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'demo-garden-sweets-soft-serve',
      vendorId: 'demo-garden-sweets',
      name: 'Ube Soft Serve',
      description: 'Creamy ube soft serve topped with toasted pinipig.',
      price: 99,
      category: 'Desserts',
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
};

export function isDemoVendorId(id: string) {
  return id.startsWith('demo-');
}

export function getDemoVendorById(id: string) {
  return demoVendors.find((vendor) => vendor.id === id) ?? null;
}

export function getDemoVendorMenu(id: string) {
  return demoVendorMenusById[id] ?? [];
}

export function isNearSantaMariaBulacan(latitude: number, longitude: number) {
  return latitude >= 14.74 && latitude <= 14.90 && longitude >= 120.87 && longitude <= 121.03;
}

export function getVendorDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
