import { InventoryItem } from '@/types/inventory';
import { getEquipmentYear } from '@/lib/inventoryFormatting';

export function exportInventoryToCsv(items: InventoryItem[], filename = 'PENRO_Batanes_ICT_Inventory.csv') {
  const headers = [
    'Property Number',
    'Serial Number',
    'Type of Equipment',
    'Model',
    'Brand',
    'Accountable Personnel',
    'Accountable Sex',
    'Accountable Employment Status',
    'Location',
    'Year Acquired',
    'Shelf Life',
    'Processor',
    'RAM',
    'Graphics / GPU',
    'Range Category',
    'Operating System',
    'Office Productivity Software',
    'Endpoint Protection',
    'Computer Name',
    'Date PMS Conducted',
    'Status',
    'Condition Category',
    'Remarks',
    'Last Verified At',
    'Last Verified By',
    'QR Verification Count',
    'Latest Verification Comment',
    'Verification History',
    'Record Created At',
    'Record Updated At',
  ];

  const escapeCsv = (str: string | undefined | null) => {
    if (!str) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map((item) => [
    escapeCsv(item.propertyNumber),
    escapeCsv(item.serialNumber),
    escapeCsv(item.equipmentType),
    escapeCsv(item.model),
    escapeCsv(item.brand),
    escapeCsv(item.accountablePersonnel),
    escapeCsv(item.accountableSex),
    escapeCsv(item.accountableStatus),
    escapeCsv(item.location),
    escapeCsv(getEquipmentYear(item)),
    escapeCsv(item.shelfLife),
    escapeCsv(item.processor),
    escapeCsv(item.ram),
    escapeCsv(item.gpu),
    escapeCsv(item.rangeCategory),
    escapeCsv(item.osInstalled),
    escapeCsv(item.officeProductivityProduct),
    escapeCsv(item.endpointProtection),
    escapeCsv(item.computerName),
    escapeCsv(item.datePmsConducted),
    escapeCsv(item.status),
    escapeCsv(item.statusCategory),
    escapeCsv(item.remarks || ''),
    escapeCsv(item.lastVerifiedAt),
    escapeCsv(item.lastVerifiedBy),
    escapeCsv(String(item.verificationCount || 0)),
    escapeCsv(item.verificationHistory?.[0]?.comment),
    escapeCsv(item.verificationHistory?.map((verification) => [
      verification.verifiedAt,
      verification.verifiedBy || 'Unspecified verifier',
      verification.comment || 'No comment',
    ].join(' · ')).join(' | ')),
    escapeCsv(item.createdAt),
    escapeCsv(item.updatedAt),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
