'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryItem, FilterState, EquipmentStatusCategory } from '@/types/inventory';
import {
  loadInventory,
  createItem,
  updateItem,
  deleteItem,
  subscribeToInventoryChanges,
  SyncStatus,
} from '@/lib/inventoryService';
import { calculateSummary } from '@/lib/summaryUtils';
import { exportInventoryToCsv } from '@/lib/exportUtils';

import { Sidebar, SidebarTab } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { OverviewView } from '@/components/inventory/OverviewView';
import { FilterBar } from '@/components/inventory/FilterBar';
import { EquipmentTable } from '@/components/inventory/EquipmentTable';
import { EquipmentCards } from '@/components/inventory/EquipmentCards';
import { EquipmentModal } from '@/components/inventory/EquipmentModal';
import { EquipmentDetailDrawer } from '@/components/inventory/EquipmentDetailDrawer';
import { SqlSchemaModal } from '@/components/inventory/SqlSchemaModal';
import { DeleteConfirmModal } from '@/components/inventory/DeleteConfirmModal';
import { QrScannerModal } from '@/components/inventory/QrScannerModal';

export default function InventoryDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState<SidebarTab>('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const sidebarPreferenceReady = useRef(false);
  const liveRefreshTimer = useRef<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    source: 'local',
    isConnectedToSupabase: false,
    message: 'Initializing...',
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    type: '',
    location: '',
    brand: '',
    statusCategory: '',
    shelfLife: '',
    year: '',
  });

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    const { items: loaded, status } = await loadInventory();
    setItems(loaded);
    setDetailItem((current) => current
      ? loaded.find((item) => item.id === current.id) ?? null
      : current
    );
    setSyncStatus(status);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const unsubscribe = subscribeToInventoryChanges(() => {
      if (liveRefreshTimer.current) window.clearTimeout(liveRefreshTimer.current);
      liveRefreshTimer.current = window.setTimeout(() => { void fetchData(); }, 180);
    });

    return () => {
      if (liveRefreshTimer.current) window.clearTimeout(liveRefreshTimer.current);
      unsubscribe();
    };
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsSidebarCollapsed(localStorage.getItem('ict_inventory_sidebar_collapsed') === 'true');
      sidebarPreferenceReady.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sidebarPreferenceReady.current) return;
    localStorage.setItem('ict_inventory_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleQrScanned = useCallback((verificationPath: string) => {
    setIsQrScannerOpen(false);
    router.push(verificationPath);
  }, [router]);

  // Compute live summary
  const summary = useMemo(() => calculateSummary(items), [items]);

  // Distinct locations & brands for filter dropdowns
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    items.forEach((it) => {
      if (it.location) locs.add(it.location.trim().toUpperCase());
    });
    return Array.from(locs).sort();
  }, [items]);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    items.forEach((it) => {
      if (it.brand) brands.add(it.brand.trim());
    });
    return Array.from(brands).sort();
  }, [items]);

  // Handle Tab Switch with Automatic Smart Filtering
  const handleSelectTab = (tab: SidebarTab) => {
    setCurrentTab(tab);
    if (tab === 'overview') {
      // Keep state intact
    } else if (tab === 'all') {
      setFilters((prev) => ({ ...prev, type: '', statusCategory: '', year: '' }));
    } else if (tab === 'desktops') {
      setFilters((prev) => ({ ...prev, type: 'Desktop Computers', statusCategory: '', year: '' }));
    } else if (tab === 'laptops') {
      setFilters((prev) => ({ ...prev, type: 'Laptop Computers', statusCategory: '', year: '' }));
    } else if (tab === 'printers') {
      setFilters((prev) => ({ ...prev, type: 'Printers', statusCategory: '', year: '' }));
    } else if (tab === 'scanners') {
      setFilters((prev) => ({ ...prev, type: 'Scanners', statusCategory: '', year: '' }));
    } else if (tab === 'issues') {
      setFilters((prev) => ({ ...prev, type: '', statusCategory: 'Needs Attention', year: '' }));
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // Search match — covers all key identifiable fields
      if (query) {
        const searchFields = [
          item.propertyNumber,
          item.model,
          item.brand,
          item.accountablePersonnel,
          item.location,
          item.status,
          item.serialNumber ?? '',
          item.computerName ?? '',
          item.equipmentType,
          item.remarks ?? '',
        ];
        const matched = searchFields.some((f) =>
          f.toLowerCase().includes(query)
        );
        if (!matched) return false;
      }

      // Equipment type filter
      if (filters.type && item.equipmentType !== filters.type) {
        return false;
      }

      // Location filter
      if (filters.location && item.location.trim().toUpperCase() !== filters.location) {
        return false;
      }

      // Brand filter
      if (filters.brand && item.brand.trim().toUpperCase() !== filters.brand.toUpperCase()) {
        return false;
      }

      // Status category filter
      if (filters.statusCategory) {
        if (filters.statusCategory === 'Needs Attention') {
          // Match all items needing attention, parts replacement, or repair
          if (
            item.statusCategory !== 'Needs Attention' &&
            item.statusCategory !== 'Parts Replacement' &&
            item.statusCategory !== 'For Repair'
          ) {
            return false;
          }
        } else if (item.statusCategory !== filters.statusCategory) {
          return false;
        }
      }

      // Acquisition Year / 5+ Year Aging Filter
      if (filters.year) {
        if (filters.year === '5_YEARS_OLD') {
          const matchYear = item.yearAcquired?.match(/\b(19\d\d|20\d\d)\b/);
          const yr = matchYear ? parseInt(matchYear[1], 10) : 0;
          const isOld = item.shelfLife === 'BEYOND 5 YEARS' || (yr > 0 && yr <= 2021);
          if (!isOld) return false;
        } else if (filters.year === 'OLDER') {
          const matchYear = item.yearAcquired?.match(/\b(19\d\d|20\d\d)\b/);
          const yr = matchYear ? parseInt(matchYear[1], 10) : 0;
          if (!(yr > 0 && yr <= 2019)) return false;
        } else {
          if (!item.yearAcquired?.includes(filters.year)) {
            return false;
          }
        }
      }

      // Lifespan / Shelf life filter (if set directly)
      if (filters.shelfLife && item.shelfLife !== filters.shelfLife) {
        return false;
      }

      return true;
    });
  }, [items, filters]);

  // CRUD Handlers
  const handleSaveItem = async (
    itemData: Omit<InventoryItem, 'id' | 'createdAt'>,
    id?: string
  ) => {
    if (id) {
      // Edit
      const existing = items.find((i) => i.id === id);
      if (!existing) return;
      const updated = await updateItem({ ...existing, ...itemData });
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      if (detailItem?.id === id) setDetailItem(updated);
      showToast(`Updated ${updated.propertyNumber} successfully`);
    } else {
      // Create
      const created = await createItem(itemData);
      setItems((prev) => [created, ...prev]);
      showToast(`Added ${created.propertyNumber} to inventory`);
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    setIsDeleting(true);
    await deleteItem(item.id, item.propertyNumber);
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    if (detailItem?.id === item.id) setDetailItem(null);
    setItemToDelete(null);
    setIsDeleting(false);
    showToast(`Removed ${item.propertyNumber} from inventory`);
  };

  const handleQuickStatusChange = async (
    item: InventoryItem,
    newCategory: EquipmentStatusCategory
  ) => {
    const updated = await updateItem({
      ...item,
      statusCategory: newCategory,
      status: item.remarks ? `${newCategory} (${item.remarks})` : newCategory,
    });
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    setDetailItem(updated);
    showToast(`Status updated to "${newCategory}"`);
  };

  const handleExportCsv = () => {
    const filename = filters.type
      ? `PENRO_Batanes_ICT_${filters.type.replace(/\s+/g, '_')}_Inventory.csv`
      : 'PENRO_Batanes_ICT_Inventory.csv';
    exportInventoryToCsv(filteredItems, filename);
    showToast(`Exported ${filteredItems.length} records to CSV`);
  };

  return (
    <div className="flex min-h-screen text-zinc-900 selection:bg-green-500/30 selection:text-white dark:text-zinc-50" style={{ background: 'var(--background)' }}>
      {/* SaaS Sidebar Navigation (Google Drive / Fingoals style) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        summary={summary}
        syncStatus={syncStatus}
        onOpenAddModal={() => {
          setItemToEdit(null);
          setIsModalOpen(true);
        }}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          title="PENRO BATANES ICT INVENTORY"
          searchQuery={filters.searchQuery}
          onSearchChange={(query) => setFilters((prev) => ({ ...prev, searchQuery: query }))}
          syncStatus={syncStatus}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          onExportCsv={handleExportCsv}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
        />

        {/* Main Body */}
        <main className="flex-1 px-4 py-5 sm:px-6 space-y-5">
          {/* Toast Alert Banner */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-bottom-4 duration-200 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-5 py-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-28 rounded-2xl" />
                ))}
              </div>
              <div className="skeleton h-40 rounded-2xl" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="skeleton h-56 rounded-2xl" />
                <div className="skeleton h-56 rounded-2xl" />
              </div>
            </div>
          ) : currentTab === 'overview' ? (
            /* Executive Analytics & Graph View — keyed for re-mount fade */
            <div key="overview" className="tab-content">
              <OverviewView
                items={items}
                summary={summary}
                onNavigateTab={handleSelectTab}
                onOpenAddModal={() => {
                  setItemToEdit(null);
                  setIsModalOpen(true);
                }}
                onViewDetails={(item) => setDetailItem(item)}
                searchQuery={filters.searchQuery}
                searchResults={filteredItems}
              />
            </div>
          ) : (
            /* Category / Equipment Inventory View — keyed for re-mount fade */
            <div key={currentTab} className="tab-content space-y-4">
              {/* Category Header */}
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {currentTab === 'all' && 'All Equipment'}
                  {currentTab === 'desktops' && 'Desktop PCs'}
                  {currentTab === 'laptops' && 'Laptops'}
                  {currentTab === 'printers' && 'Printers'}
                  {currentTab === 'scanners' && 'Scanners'}
                  {currentTab === 'issues' && 'Needs Attention'}
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {filteredItems.length} of {items.length} units
                </p>
              </div>

              {/* Filter Bar */}
              <FilterBar
                filters={filters}
                onFilterChange={(newFilters) =>
                  setFilters((prev) => ({ ...prev, ...newFilters }))
                }
                onResetFilters={() =>
                  setFilters({
                    searchQuery: '',
                    type: '',
                    location: '',
                    brand: '',
                    statusCategory: '',
                    shelfLife: '',
                    year: '',
                  })
                }
                availableLocations={availableLocations}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                resultCount={filteredItems.length}
              />

              {/* Data View: Table or Grid Cards */}
              {viewMode === 'table' ? (
                <EquipmentTable
                  items={filteredItems}
                  onViewDetails={(item) => setDetailItem(item)}
                  onEditItem={(item) => {
                    setItemToEdit(item);
                    setIsModalOpen(true);
                  }}
                  onDeleteItem={(item) => setItemToDelete(item)}
                />
              ) : (
                <EquipmentCards
                  items={filteredItems}
                  onViewDetails={(item) => setDetailItem(item)}
                  onEditItem={(item) => {
                    setItemToEdit(item);
                    setIsModalOpen(true);
                  }}
                  onDeleteItem={(item) => setItemToDelete(item)}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <EquipmentModal
        isOpen={isModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        availableLocations={availableLocations}
        availableBrands={availableBrands}
      />

      <EquipmentDetailDrawer
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => {
          setDetailItem(null);      // close view drawer first
          setItemToEdit(item);
          setIsModalOpen(true);     // then open edit modal above
        }}
        onDelete={(item) => {
          setItemToDelete(item);
        }}
        onQuickStatusChange={handleQuickStatusChange}
      />

      <DeleteConfirmModal
        item={itemToDelete}
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        isDeleting={isDeleting}
      />

      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        syncStatus={syncStatus}
        totalItems={items.length}
        onSyncSuccess={fetchData}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanned={handleQrScanned}
      />
    </div>
  );
}
