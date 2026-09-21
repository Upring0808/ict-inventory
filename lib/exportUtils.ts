import { InventoryItem } from '@/types/inventory';

export function exportInventoryToCsv(items: InventoryItem[], filename = 'PENRO_Batanes_ICT_Inventory.csv') {
  const headers = [
    'Property Number',
    'Type of Equipment',
    'Model',
    'Brand',
    'Accountable Personnel',
    'Location',
    'Date PMS Conducted',
    'Status',
    'Condition Category',
    'Remarks',
  ];

  const escapeCsv = (str: string | undefined | null) => {
    if (!str) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map((item) => [
    escapeCsv(item.propertyNumber),
    escapeCsv(item.equipmentType),
    escapeCsv(item.model),
    escapeCsv(item.brand),
    escapeCsv(item.accountablePersonnel),
    escapeCsv(item.location),
    escapeCsv(item.datePmsConducted),
    escapeCsv(item.status),
    escapeCsv(item.statusCategory),
    escapeCsv(item.remarks || ''),
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
