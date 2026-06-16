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
  isTemporarilyClosed: boolean;
  businessPermit: string;
  businessPermitExpiry: string;
  foodSafetyCert: string;
  foodSafetyCertExpiry: string;
  commissionRate: string;
  operatingHours: OperatingHoursFormState[];
  imageFile: File | null;
  imagePreview: string | null;
};

export type NewMenuItemFormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  prepTimeMinutes: string;
  stockQuantity: string;
  imageFile: File | null;
  imagePreview: string | null;
};
