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

const WORKSHEET_CATEGORIES = [
  'Desktop Computers',
  'Laptop Computers',
  'Printers',
  'Scanners',
] as const;

const WORKBOOK_COLUMNS = [
  { header: 'Property Number', key: 'propertyNumber', width: 20 },
  { header: 'Serial Number', key: 'serialNumber', width: 22 },
  { header: 'Type of Equipment', key: 'equipmentType', width: 22 },
  { header: 'Brand', key: 'brand', width: 18 },
  { header: 'Model', key: 'model', width: 24 },
  { header: 'Computer Name', key: 'computerName', width: 22 },
  { header: 'Office / Division', key: 'location', width: 26 },
  { header: 'Accountable Personnel', key: 'accountablePersonnel', width: 28 },
  { header: 'Accountable Sex', key: 'accountableSex', width: 16 },
  { header: 'Employment Status', key: 'accountableStatus', width: 20 },
  { header: 'Year Acquired', key: 'yearAcquired', width: 15 },
  { header: 'Shelf Life', key: 'shelfLife', width: 20 },
  { header: 'Processor', key: 'processor', width: 24 },
  { header: 'RAM', key: 'ram', width: 14 },
  { header: 'Graphics / GPU', key: 'gpu', width: 22 },
  { header: 'Range Category', key: 'rangeCategory', width: 20 },
  { header: 'Operating System', key: 'osInstalled', width: 24 },
  { header: 'Office Productivity Software', key: 'officeProductivityProduct', width: 28 },
  { header: 'Endpoint Protection', key: 'endpointProtection', width: 24 },
  { header: 'Date PMS Conducted', key: 'datePmsConducted', width: 20 },
  { header: 'Status', key: 'status', width: 24 },
  { header: 'Condition Category', key: 'statusCategory', width: 20 },
  { header: 'Remarks', key: 'remarks', width: 40 },
  { header: 'Last Verified At', key: 'lastVerifiedAt', width: 24 },
  { header: 'Last Verified By', key: 'lastVerifiedBy', width: 28 },
  { header: 'QR Verification Count', key: 'verificationCount', width: 18 },
  { header: 'Latest Verification Comment', key: 'latestVerificationComment', width: 36 },
  { header: 'Verification History', key: 'verificationHistory', width: 52 },
  { header: 'Record Created At', key: 'createdAt', width: 24 },
  { header: 'Record Updated At', key: 'updatedAt', width: 24 },
];

function isDisposalItem(item: InventoryItem) {
  return item.statusCategory === 'For Disposal'
    || item.status?.toLowerCase().includes('disposal')
    || item.status?.toLowerCase().includes('condemned');
}

function needsAttentionCount(items: InventoryItem[]) {
  return items.filter((item) => (
    item.statusCategory === 'Needs Attention'
    || item.statusCategory === 'Parts Replacement'
    || item.statusCategory === 'For Repair'
  ) && !isDisposalItem(item)).length;
}

function getWorkbookRow(item: InventoryItem) {
  const history = item.verificationHistory ?? [];
  return {
    propertyNumber: item.propertyNumber,
    serialNumber: item.serialNumber ?? '',
    equipmentType: item.equipmentType,
    brand: item.brand,
    model: item.model,
    computerName: item.computerName ?? '',
    location: item.location,
    accountablePersonnel: item.accountablePersonnel,
    accountableSex: item.accountableSex ?? '',
    accountableStatus: item.accountableStatus ?? '',
    yearAcquired: getEquipmentYear(item) ?? '',
    shelfLife: item.shelfLife,
    processor: item.processor ?? '',
    ram: item.ram ?? '',
    gpu: item.gpu ?? '',
    rangeCategory: item.rangeCategory ?? '',
    osInstalled: item.osInstalled ?? '',
    officeProductivityProduct: item.officeProductivityProduct ?? '',
    endpointProtection: item.endpointProtection ?? '',
    datePmsConducted: item.datePmsConducted ?? '',
    status: item.status,
    statusCategory: item.statusCategory,
    remarks: item.remarks ?? '',
    lastVerifiedAt: item.lastVerifiedAt ?? '',
    lastVerifiedBy: item.lastVerifiedBy ?? '',
    verificationCount: item.verificationCount ?? 0,
    latestVerificationComment: history[0]?.comment ?? '',
    verificationHistory: history.map((verification) => [
      verification.verifiedAt,
      verification.verifiedBy || 'Unspecified verifier',
      verification.comment || 'No comment',
    ].join(' · ')).join('\n'),
    createdAt: item.createdAt ?? '',
    updatedAt: item.updatedAt ?? '',
  };
}

function addStyledInventoryWorksheet(
  workbook: import('exceljs').Workbook,
  name: typeof WORKSHEET_CATEGORIES[number],
  items: InventoryItem[],
) {
  const worksheet = workbook.addWorksheet(name, {
    properties: { defaultRowHeight: 19 },
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2, topLeftCell: 'C2', showGridLines: false }],
  });

  worksheet.columns = WORKBOOK_COLUMNS;
  worksheet.addRows(items.map(getWorkbookRow));
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, items.length + 1), column: WORKBOOK_COLUMNS.length },
  };

  const heading = worksheet.getRow(1);
  heading.height = 32;
  heading.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123640' } };
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF16A34A' } } };
  });

  for (let rowNumber = 2; rowNumber <= items.length + 1; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    row.alignment = { vertical: 'top', wrapText: true };
    if (rowNumber % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F6F4' } };
      });
    }
    row.getCell(1).font = { bold: true, color: { argb: 'FF123640' } };
    row.getCell(27).alignment = { vertical: 'top', wrapText: true };
    row.getCell(28).alignment = { vertical: 'top', wrapText: true };
  }

  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  worksheet.pageSetup.printTitlesRow = '1:1';
  worksheet.headerFooter.oddFooter = '&LPENRO Batanes ICT Inventory&RPage &P of &N';
  return worksheet;
}

/**
 * Creates a styled workbook for the complete inventory. This function is intended
 * for a browser-side handler and loads ExcelJS only when the user asks to export.
 */
export async function exportInventoryToWorkbook(
  items: InventoryItem[],
  filename = 'PENRO_Batanes_ICT_Inventory.xlsx',
) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PENRO Batanes ICT Inventory';
  workbook.subject = 'Complete ICT equipment inventory';
  workbook.title = 'PENRO Batanes ICT Inventory';
  workbook.created = new Date();
  workbook.modified = new Date();
  const generatedAt = new Date().toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const typeRows = WORKSHEET_CATEGORIES.map((category) => [
    category,
    items.filter((item) => item.equipmentType === category).length,
  ]);
  const serviceable = items.filter((item) => item.statusCategory === 'Serviceable' && !isDisposalItem(item)).length;
  const disposal = items.filter(isDisposalItem).length;
  const attention = needsAttentionCount(items);
  const notYetFound = items.filter((item) => item.statusCategory === 'Not Yet Found').length;
  const beyondFiveYears = items.filter((item) => item.shelfLife === 'BEYOND 5 YEARS').length;
  const withinFiveYears = items.filter((item) => item.shelfLife === 'WITHIN 5 YEARS').length;
  const serviceableRate = items.length ? serviceable / items.length : 0;
  const agingRate = items.length ? beyondFiveYears / items.length : 0;
  const summary = workbook.addWorksheet('Summary', {
    properties: { defaultRowHeight: 22 },
    views: [{ state: 'frozen', ySplit: 2, showGridLines: false }],
  });
  summary.columns = [
    { width: 48 },
    { width: 24 },
  ];
  summary.mergeCells('A1:B1');
  summary.getCell('A1').value = 'PENRO BATANES  /  ICT INVENTORY';
  summary.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123640' } };
  summary.getCell('A1').font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  summary.getCell('A1').alignment = { vertical: 'middle', indent: 1 };
  summary.getRow(1).height = 42;
  summary.mergeCells('A2:B2');
  summary.getCell('A2').value = 'Complete equipment register · all inventory categories';
  summary.getCell('A2').font = { name: 'Aptos', size: 10, color: { argb: 'FF52636A' }, italic: true };
  summary.getRow(2).height = 26;
  summary.addRows([
    ['Generated', generatedAt],
    ['Total assets', items.length],
    [],
    ['Equipment type', 'Asset count'],
    ...typeRows,
    [],
    ['Condition / age', 'Asset count'],
    ['Serviceable', serviceable],
    ['Needs attention (includes repair and parts replacement)', attention],
    ['For disposal', disposal],
    ['Not yet found', notYetFound],
    ['Beyond five years', beyondFiveYears],
    ['Within five years', withinFiveYears],
    ['Serviceable rate', serviceableRate],
    ['Beyond five years rate', agingRate],
  ]);

  for (const rowNumber of [3, 4]) {
    const row = summary.getRow(rowNumber);
    row.getCell(1).font = { bold: rowNumber === 4, color: { argb: 'FF123640' } };
    row.getCell(2).font = { bold: rowNumber === 4, color: { argb: 'FF123640' } };
  }
  for (const rowNumber of [6, 12]) {
    const row = summary.getRow(rowNumber);
    row.height = 26;
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EFEB' } };
      cell.font = { bold: true, color: { argb: 'FF123640' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF9DB5AD' } } };
      cell.alignment = { vertical: 'middle' };
    });
  }
  summary.getColumn(2).alignment = { vertical: 'middle', horizontal: 'right' };
  summary.getColumn(1).alignment = { vertical: 'middle', wrapText: true };
  for (const rowNumber of [19, 20]) {
    summary.getCell(rowNumber, 2).numFmt = '0%';
    summary.getRow(rowNumber).getCell(1).font = { bold: true, color: { argb: 'FF23734D' } };
    summary.getRow(rowNumber).getCell(2).font = { bold: true, color: { argb: 'FF23734D' } };
  }
  summary.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
  };
  summary.headerFooter.oddFooter = '&LPENRO Batanes ICT Inventory&RPage &P of &N';

  for (const category of WORKSHEET_CATEGORIES) {
    addStyledInventoryWorksheet(
      workbook,
      category,
      items.filter((item) => item.equipmentType === category),
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer).buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
