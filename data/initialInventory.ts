import type { InventoryItem } from '@/types/inventory';

/** Fictional examples for development and documentation. Never auto-import into a live database. */
export const initialInventoryItems: InventoryItem[] = [
  {
    id: 'sample-desktop-001',
    propertyNumber: 'EXAMPLE-DESKTOP-001',
    serialNumber: 'SAMPLE-000001',
    equipmentType: 'Desktop Computers',
    model: 'Sample Workstation A',
    brand: 'Example Brand',
    location: 'DEMO OFFICE',
    accountablePersonnel: 'Alex Example',
    yearAcquired: '2025',
    shelfLife: 'WITHIN 5 YEARS',
    status: 'Serviceable',
    statusCategory: 'Serviceable',
  },
  {
    id: 'sample-printer-001',
    propertyNumber: 'EXAMPLE-PRINTER-001',
    serialNumber: 'SAMPLE-000002',
    equipmentType: 'Printers',
    model: 'Sample Printer B',
    brand: 'Example Brand',
    location: 'DEMO OFFICE',
    accountablePersonnel: 'Taylor Example',
    yearAcquired: '2024',
    shelfLife: 'WITHIN 5 YEARS',
    status: 'Serviceable',
    statusCategory: 'Serviceable',
  },
];
