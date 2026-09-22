import { InventoryItem, InventorySummary } from '@/types/inventory';

export function calculateSummary(items: InventoryItem[]): InventorySummary {
  let desktopCount = 0;
  let laptopCount = 0;
  let printerCount = 0;
  let scannerCount = 0;
  let serviceableCount = 0;
  let partsReplacementCount = 0;
  let forRepairCount = 0;
  let needsAttentionCount = 0;
  let forDisposalCount = 0;
  let beyond5YearsCount = 0;
  let within5YearsCount = 0;
  const locations = new Set<string>();

  for (const item of items) {
    if (item.location) locations.add(item.location.trim().toUpperCase());

    switch (item.equipmentType) {
      case 'Desktop Computers':
        desktopCount++;
        break;
      case 'Laptop Computers':
        laptopCount++;
        break;
      case 'Printers':
        printerCount++;
        break;
      case 'Scanners':
        scannerCount++;
        break;
    }

    if (
      item.statusCategory === 'For Disposal' ||
      item.status?.toLowerCase().includes('disposal') ||
      item.status?.toLowerCase().includes('condemned')
    ) {
      forDisposalCount++;
    } else {
      switch (item.statusCategory) {
        case 'Serviceable':
          serviceableCount++;
          break;
        case 'Parts Replacement':
          partsReplacementCount++;
          break;
        case 'For Repair':
          forRepairCount++;
          break;
        case 'Needs Attention':
          needsAttentionCount++;
          break;
      }
    }

    if (item.shelfLife === 'BEYOND 5 YEARS') {
      beyond5YearsCount++;
    } else {
      within5YearsCount++;
    }
  }

  const total = items.length;
  const serviceableRate = total > 0 ? Math.round((serviceableCount / total) * 100) : 0;
  const agingRate = total > 0 ? Math.round((beyond5YearsCount / total) * 100) : 0;

  return {
    total,
    desktopCount,
    laptopCount,
    printerCount,
    scannerCount,
    serviceableCount,
    partsReplacementCount,
    forRepairCount,
    needsAttentionCount,
    forDisposalCount,
    beyond5YearsCount,
    within5YearsCount,
    locationsCount: locations.size,
    serviceableRate,
    agingRate,
  };
}

export function getLocationDistribution(items: InventoryItem[], limit = 8): { location: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const loc = item.location ? item.location.trim().toUpperCase() : 'UNASSIGNED';
    counts[loc] = (counts[loc] || 0) + 1;
  }
  const total = items.length || 1;
  return Object.entries(counts)
    .map(([location, count]) => ({
      location,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getBrandDistribution(items: InventoryItem[], limit = 8): { brand: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const b = item.brand ? item.brand.trim().toUpperCase() : 'UNKNOWN';
    counts[b] = (counts[b] || 0) + 1;
  }
  const total = items.length || 1;
  return Object.entries(counts)
    .map(([brand, count]) => ({
      brand,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getOsDistribution(items: InventoryItem[]): { os: string; count: number; color: string }[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (!item.osInstalled) continue;
    const os = item.osInstalled.trim().toUpperCase();
    if (os.includes('11')) counts['Windows 11'] = (counts['Windows 11'] || 0) + 1;
    else if (os.includes('10')) counts['Windows 10'] = (counts['Windows 10'] || 0) + 1;
    else if (os.includes('8')) counts['Windows 8 (Legacy)'] = (counts['Windows 8 (Legacy)'] || 0) + 1;
    else if (os.includes('7')) counts['Windows 7 (Legacy)'] = (counts['Windows 7 (Legacy)'] || 0) + 1;
    else counts['Other OS'] = (counts['Other OS'] || 0) + 1;
  }

  const colorMap: Record<string, string> = {
    'Windows 11': 'from-blue-500 to-indigo-600',
    'Windows 10': 'from-indigo-400 to-blue-500',
    'Windows 8 (Legacy)': 'from-amber-500 to-orange-500',
    'Windows 7 (Legacy)': 'from-rose-500 to-red-600',
    'Other OS': 'from-zinc-400 to-zinc-500',
  };

  return Object.entries(counts)
    .map(([os, count]) => ({
      os,
      count,
      color: colorMap[os] || 'from-zinc-400 to-zinc-500',
    }))
    .sort((a, b) => b.count - a.count);
}

export function getRamDistribution(items: InventoryItem[]): { ram: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (!item.ram) continue;
    const r = item.ram.trim().toUpperCase().replace(/\s+/g, '');
    let label = 'Other';
    if (r.includes('4GB') || r.includes('4.00GB')) label = '4 GB';
    else if (r.includes('8GB') || r.includes('8.00GB')) label = '8 GB';
    else if (r.includes('12GB') || r.includes('12.00GB')) label = '12 GB';
    else if (r.includes('16GB') || r.includes('16.00GB')) label = '16 GB';
    else if (r.includes('32GB') || r.includes('32.00GB')) label = '32 GB';
    else if (r.includes('64GB') || r.includes('64.00GB')) label = '64 GB';

    counts[label] = (counts[label] || 0) + 1;
  }

  const order = ['4 GB', '8 GB', '12 GB', '16 GB', '32 GB', '64 GB'];
  return Object.entries(counts)
    .sort((a, b) => {
      const idxA = order.indexOf(a[0]);
      const idxB = order.indexOf(b[0]);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    })
    .map(([ram, count]) => ({ ram, count }));
}
