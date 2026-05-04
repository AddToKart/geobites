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
