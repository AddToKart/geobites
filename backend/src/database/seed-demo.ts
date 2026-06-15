import { DataSource } from 'typeorm';
import { Vendor } from '../entities/vendor.entity';
import { MenuItem } from '../entities/menu-item.entity';

const timestamp = new Date().toISOString();

const demoVendors = [
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
  },
];

const demoMenus: Record<string, any[]> = {
  'demo-kape-baryo': [
    {
      id: 'demo-kape-baryo-tapsilog',
      name: 'Tapsilog Supreme',
      description: 'Cured beef tapa, garlic rice, fried egg, and atsara.',
      price: 145,
      category: 'Breakfast plates',
      isAvailable: true,
    },
    {
      id: 'demo-kape-baryo-pandesal-set',
      name: 'Pandesal Breakfast Box',
      description: 'Fresh pandesal, kesong puti spread, and brewed barako coffee.',
      price: 120,
      category: 'Breakfast plates',
      isAvailable: true,
    },
    {
      id: 'demo-kape-baryo-spanish-latte',
      name: 'Spanish Latte',
      description: 'Creamy espresso drink served hot or iced.',
      price: 105,
      category: 'Coffee',
      isAvailable: true,
    },
    {
      id: 'demo-kape-baryo-chicken-arroz',
      name: 'Chicken Arroz Caldo',
      description: 'Slow-cooked rice porridge with toasted garlic and boiled egg.',
      price: 130,
      category: 'Comfort bowls',
      isAvailable: true,
    },
  ],
  'demo-ihaw-central': [
    {
      id: 'demo-ihaw-central-liempo',
      name: 'Liempo Rice Plate',
      description: 'Char-grilled liempo with java rice and ensalada.',
      price: 189,
      category: 'Grill plates',
      isAvailable: true,
    },
    {
      id: 'demo-ihaw-central-sisig',
      name: 'Sizzling Sisig',
      description: 'Classic chopped sisig served on a hot plate.',
      price: 210,
      category: 'Sizzling',
      isAvailable: true,
    },
    {
      id: 'demo-ihaw-central-inalsal',
      name: 'Chicken Inasal Quarter',
      description: 'Juicy inasal chicken with garlic rice and toyomansi.',
      price: 175,
      category: 'Grill plates',
      isAvailable: true,
    },
    {
      id: 'demo-ihaw-central-platter',
      name: 'Barkada Ihaw Platter',
      description: 'Liempo, barbecue, chicken inasal, and grilled vegetables.',
      price: 699,
      category: 'Sharing platters',
      isAvailable: true,
    },
  ],
  'demo-pancit-palengke': [
    {
      id: 'demo-pancit-palengke-bihon',
      name: 'Pancit Bihon Bilao',
      description: 'Party-size bihon with pork, vegetables, and calamansi.',
      price: 390,
      category: 'Bilao specials',
      isAvailable: true,
    },
    {
      id: 'demo-pancit-palengke-canton',
      name: 'Pancit Canton Solo',
      description: 'Wok-fried canton noodles for one with toasted garlic.',
      price: 120,
      category: 'Solo trays',
      isAvailable: true,
    },
    {
      id: 'demo-pancit-palengke-lumpia',
      name: 'Lumpiang Sariwa Pair',
      description: 'Two fresh lumpia rolls with peanut garlic sauce.',
      price: 95,
      category: 'Merienda',
      isAvailable: true,
    },
    {
      id: 'demo-pancit-palengke-puto',
      name: 'Puto Bumbong Box',
      description: 'Four sticky rice cakes with coconut and muscovado.',
      price: 110,
      category: 'Merienda',
      isAvailable: true,
    },
  ],
  'demo-garden-sweets': [
    {
      id: 'demo-garden-sweets-halo',
      name: 'Premium Halo-Halo Jar',
      description: 'Layered shaved ice dessert with leche flan and ube halaya.',
      price: 149,
      category: 'Desserts',
      isAvailable: true,
    },
    {
      id: 'demo-garden-sweets-mango',
      name: 'Mango Graham Cooler',
      description: 'Fresh mango cream cooler with crushed graham.',
      price: 125,
      category: 'Cold drinks',
      isAvailable: true,
    },
    {
      id: 'demo-garden-sweets-flan',
      name: 'Leche Flan Duo',
      description: 'Two silky leche flan cups packed chilled.',
      price: 135,
      category: 'Desserts',
      isAvailable: true,
    },
    {
      id: 'demo-garden-sweets-soft-serve',
      name: 'Ube Soft Serve',
      description: 'Creamy ube soft serve topped with toasted pinipig.',
      price: 99,
      category: 'Desserts',
      isAvailable: true,
    },
  ],
};

export async function seedDemoData(dataSource: DataSource) {
  const vendorRepo = dataSource.getRepository(Vendor);
  const menuRepo = dataSource.getRepository(MenuItem);

  console.log('Seeding demo data...');

  for (const v of demoVendors) {
    const existing = await vendorRepo.findOne({ where: { id: v.id } });
    if (!existing) {
      console.log(`Creating vendor: ${v.name}`);
      await vendorRepo.save(v);
      
      const items = demoMenus[v.id] || [];
      for (const item of items) {
        await menuRepo.save({ ...item, vendorId: v.id });
      }
    }
  }

  console.log('Demo data seeded successfully');
}
