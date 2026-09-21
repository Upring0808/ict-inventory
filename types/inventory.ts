export type EquipmentType =
  | 'Desktop Computers'
  | 'Laptop Computers'
  | 'Printers'
  | 'Scanners';

export type EquipmentStatusCategory =
  | 'Serviceable'
  | 'Needs Attention'
  | 'Parts Replacement'
  | 'For Repair'
  | 'For Disposal'
  | 'Not Yet Found';

export type ShelfLifeCategory = 'WITHIN 5 YEARS' | 'BEYOND 5 YEARS';

export interface EquipmentVerification {
  id: string;
  verifiedAt: string;
  verifiedBy?: string;
  comment?: string;
  /** Records an explicit on-site clearing of the active equipment remark. */
  remarkResolved?: boolean;
  resolvedRemark?: string;
  method: 'qr';
}

export interface InventoryItem {
  id: string;
  propertyNumber: string;
  serialNumber?: string;
  equipmentType: EquipmentType;
  model: string;
  brand: string;
  location: string; // Office / Division
  accountablePersonnel: string;
  accountableSex?: string;
  accountableStatus?: string;
  yearAcquired?: string;
  shelfLife: ShelfLifeCategory;

  // Hardware Specifications (Desktops / Laptops)
  processor?: string;
  ram?: string;
  gpu?: string;
  rangeCategory?: string;
  osInstalled?: string;
  officeProductivityProduct?: string;
  endpointProtection?: string;
  computerName?: string;

  // Operational & Maintenance Status
  datePmsConducted?: string;
  status: string;
  statusCategory: EquipmentStatusCategory;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  /** QR audit fields. These are updated only after an on-site confirmation. */
  lastVerifiedAt?: string;
  lastVerifiedBy?: string;
  verificationCount?: number;
  verificationHistory?: EquipmentVerification[];
}

export interface InventorySummary {
  total: number;
  desktopCount: number;
  laptopCount: number;
  printerCount: number;
  scannerCount: number;
  serviceableCount: number;
  partsReplacementCount: number;
  forRepairCount: number;
  needsAttentionCount: number;
  forDisposalCount: number;
  beyond5YearsCount: number;
  within5YearsCount: number;
  locationsCount: number;
  serviceableRate: number;
  agingRate: number;
}

export interface FilterState {
  searchQuery: string;
  type: string;
  location: string;
  brand: string;
  statusCategory: string;
  shelfLife: string; // 'BEYOND 5 YEARS' | 'WITHIN 5 YEARS' | ''
  year: string; // '5_YEARS_OLD' | specific year '2025', '2024', etc. | ''
}
