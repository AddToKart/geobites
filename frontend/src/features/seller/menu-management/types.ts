export type OperatingHoursFormState = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export type VendorFormState = {
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
  businessPermit: string;
  businessPermitExpiry: string;
  foodSafetyCert: string;
  foodSafetyCertExpiry: string;
  commissionRate: string;
  operatingHours: OperatingHoursFormState[];
};

export type NewMenuItemFormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  prepTimeMinutes: string;
  stockQuantity: string;
};
