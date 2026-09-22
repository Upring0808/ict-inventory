import { createBrowserClient } from '@/lib/supabase/client';
import { EquipmentVerification, InventoryItem } from '@/types/inventory';
import { initialInventoryItems } from '@/data/initialInventory';
import { normalizeYearAcquired } from '@/lib/inventoryFormatting';

const LOCAL_STORAGE_KEY = 'ict_inventory_data_v3';
const LEGACY_STORAGE_KEY = 'ict_inventory_data_v2';
export const INVENTORY_BROADCAST_CHANNEL = 'ict_inventory_sync_channel';
export const INVENTORY_CUSTOM_EVENT = 'ict:inventory:changed';

export function broadcastLocalChange(action: string, itemId?: string) {
  if (typeof window === 'undefined') return;

  // 1. In-tab custom event
  try {
    window.dispatchEvent(
      new CustomEvent(INVENTORY_CUSTOM_EVENT, {
        detail: { action, itemId, timestamp: Date.now() },
      })
    );
  } catch {}

  // 2. Cross-tab BroadcastChannel
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(INVENTORY_BROADCAST_CHANNEL);
      channel.postMessage({ action, itemId, timestamp: Date.now() });
      channel.close();
    } catch {}
  }
}

export type StorageSource = 'supabase' | 'local';

export interface SyncStatus {
  source: StorageSource;
  isConnectedToSupabase: boolean;
  message: string;
}

/**
 * Ensures all items have clean, non-empty, and unique property numbers.
 * Prevents PostgreSQL ON CONFLICT DO UPDATE batch collision errors.
 */
export function sanitizeInventoryItems(items: InventoryItem[]): { items: InventoryItem[]; modified: boolean } {
  const seen = new Map<string, number>();
  let modified = false;

  const sanitized = items.map((item) => {
    let prop = (item.propertyNumber || '').trim();
    if (!prop) {
      prop = `ASSET-${item.id}`;
      modified = true;
    }
    const upper = prop.toUpperCase();
    const count = seen.get(upper) || 0;
    seen.set(upper, count + 1);

    const normalizedYear = normalizeYearAcquired(item.yearAcquired, prop);
    if (normalizedYear !== item.yearAcquired) modified = true;

    if (count > 0) {
      modified = true;
      const disambiguated = `${prop}-${String.fromCharCode(64 + count + 1)}`;
      return {
        ...item,
        propertyNumber: disambiguated,
        yearAcquired: normalizeYearAcquired(item.yearAcquired, disambiguated),
      };
    }

    if (prop !== item.propertyNumber || normalizedYear !== item.yearAcquired) {
      modified = true;
      return { ...item, propertyNumber: prop, yearAcquired: normalizedYear };
    }

    return item;
  });

  return { items: sanitized, modified };
}

// Helper to get local data safely with automatic deduplication
export function getLocalItems(): InventoryItem[] {
  if (typeof window === 'undefined') {
    return sanitizeInventoryItems(initialInventoryItems).items;
  }
  try {
    let raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    // Fallback check from v2 if v3 is not yet populated
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
      }
    }

    if (!raw) {
      const clean = sanitizeInventoryItems(initialInventoryItems).items;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
      return clean;
    }

    const parsed = JSON.parse(raw);
    const candidateList = Array.isArray(parsed) && parsed.length > 0 ? parsed : initialInventoryItems;
    const { items: cleanItems, modified } = sanitizeInventoryItems(candidateList);

    if (modified || !localStorage.getItem(LOCAL_STORAGE_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanItems));
    }

    return cleanItems;
  } catch (err) {
    console.warn('Failed to read from localStorage, using initial data:', err);
    return sanitizeInventoryItems(initialInventoryItems).items;
  }
}

// Helper to save local data safely
export function saveLocalItems(items: InventoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const { items: cleanItems } = sanitizeInventoryItems(items);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanItems));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Map Supabase DB row to InventoryItem
function mapDbRowToItem(row: Record<string, unknown>): InventoryItem {
  const verificationHistory = Array.isArray(row.verification_history)
    ? row.verification_history as EquipmentVerification[]
    : [];

  return {
    id: String(row.id),
    propertyNumber: String(row.property_number),
    serialNumber: row.serial_number ? String(row.serial_number) : undefined,
    equipmentType: row.equipment_type as InventoryItem['equipmentType'],
    model: String(row.model),
    brand: String(row.brand),
    location: String(row.location),
    accountablePersonnel: String(row.accountable_personnel),
    accountableSex: row.accountable_sex ? String(row.accountable_sex) : undefined,
    accountableStatus: row.accountable_status ? String(row.accountable_status) : undefined,
    yearAcquired: normalizeYearAcquired(
      row.year_acquired ? String(row.year_acquired) : undefined,
      String(row.property_number)
    ),
    shelfLife: (row.shelf_life as InventoryItem['shelfLife']) || 'WITHIN 5 YEARS',

    processor: row.processor ? String(row.processor) : undefined,
    ram: row.ram ? String(row.ram) : undefined,
    gpu: row.gpu ? String(row.gpu) : undefined,
    rangeCategory: row.range_category ? String(row.range_category) : undefined,
    osInstalled: row.os_installed ? String(row.os_installed) : undefined,
    officeProductivityProduct: row.office_productivity_product ? String(row.office_productivity_product) : undefined,
    endpointProtection: row.endpoint_protection ? String(row.endpoint_protection) : undefined,
    computerName: row.computer_name ? String(row.computer_name) : undefined,

    datePmsConducted: String(row.date_pms_conducted || ''),
    status: String(row.status || 'Serviceable'),
    statusCategory: (row.status_category as InventoryItem['statusCategory']) || 'Serviceable',
    remarks: row.remarks ? String(row.remarks) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    // `updated_at` is reserved for an approved QR check-in, not ordinary edits.
    updatedAt: row.last_verified_at && row.updated_at ? String(row.updated_at) : undefined,
    lastVerifiedAt: row.last_verified_at ? String(row.last_verified_at) : undefined,
    lastVerifiedBy: row.last_verified_by ? String(row.last_verified_by) : undefined,
    verificationCount: typeof row.verification_count === 'number'
      ? row.verification_count
      : Number(row.verification_count || verificationHistory.length) || undefined,
    verificationHistory,
  };
}

// Map InventoryItem to DB row
function mapItemToDbRow(item: InventoryItem): Record<string, unknown> {
  return {
    property_number: item.propertyNumber,
    serial_number: item.serialNumber || null,
    equipment_type: item.equipmentType,
    model: item.model,
    brand: item.brand,
    location: item.location,
    accountable_personnel: item.accountablePersonnel,
    accountable_sex: item.accountableSex || null,
    accountable_status: item.accountableStatus || null,
    year_acquired: normalizeYearAcquired(item.yearAcquired, item.propertyNumber) || null,
    shelf_life: item.shelfLife || 'WITHIN 5 YEARS',

    processor: item.processor || null,
    ram: item.ram || null,
    gpu: item.gpu || null,
    range_category: item.rangeCategory || null,
    os_installed: item.osInstalled || null,
    office_productivity_product: item.officeProductivityProduct || null,
    endpoint_protection: item.endpointProtection || null,
    computer_name: item.computerName || null,

    date_pms_conducted: item.datePmsConducted || null,
    status: item.status,
    status_category: item.statusCategory,
    remarks: item.remarks || null,
    last_verified_at: item.lastVerifiedAt || null,
    last_verified_by: item.lastVerifiedBy || null,
    verification_count: item.verificationCount || 0,
    verification_history: item.verificationHistory || [],
  };
}

/**
 * Finds an equipment record for the QR verification screen. Cloud data is
 * preferred so a phone sees the same record as the office dashboard.
 */
export async function findItemByPropertyNumber(propertyNumber: string): Promise<InventoryItem | null> {
  const normalized = propertyNumber.trim();
  if (!normalized) return null;

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('property_number', normalized)
      .maybeSingle();

    if (!error && data) return mapDbRowToItem(data);
  } catch (err) {
    console.warn('Could not read equipment from Supabase, checking local cache:', err);
  }

  return getLocalItems().find(
    (item) => item.propertyNumber.trim().toLowerCase() === normalized.toLowerCase()
  ) ?? null;
}

/**
 * Records an explicit on-site QR confirmation. Keeping the history with the
 * record lets local mode work, while Supabase sync makes the audit portable.
 */
export async function recordQrVerification(
  item: InventoryItem,
  verifiedBy?: string,
  comment?: string,
  resolveActiveRemark = false
): Promise<InventoryItem> {
  const verifiedAt = new Date().toISOString();
  const resolvedRemark = resolveActiveRemark ? item.remarks?.trim() : undefined;
  const verification: EquipmentVerification = {
    id: `verify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    verifiedAt,
    verifiedBy: verifiedBy?.trim() || undefined,
    comment: comment?.trim() || undefined,
    remarkResolved: Boolean(resolvedRemark),
    resolvedRemark,
    method: 'qr',
  };

  return updateItem({
    ...item,
    updatedAt: verifiedAt,
    lastVerifiedAt: verifiedAt,
    lastVerifiedBy: verification.verifiedBy,
    verificationCount: (item.verificationCount || 0) + 1,
    verificationHistory: [verification, ...(item.verificationHistory || [])].slice(0, 100),
    // Clearing a note does not alter the condition category. It only removes the
    // stale remark embedded in the reported status, which keeps staff in control.
    remarks: resolvedRemark ? undefined : item.remarks,
    status: resolvedRemark ? item.statusCategory : item.status,
  });
}

/**
 * Loads inventory items from Supabase if table exists, otherwise falls back to localStorage.
 */
export async function loadInventory(): Promise<{ items: InventoryItem[]; status: SyncStatus }> {
  const localItems = getLocalItems();

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase query error (falling back to local cache):', error.message);
      return {
        items: localItems,
        status: {
          source: 'local',
          isConnectedToSupabase: false,
          message: error.message.includes('relation')
            ? 'Supabase table not created yet. Run the SQL schema to enable live DB sync.'
            : error.message,
        },
      };
    }

    if (!data || data.length === 0) {
      return {
        items: localItems,
        status: {
          source: 'local',
          isConnectedToSupabase: true,
          message: 'Connected to Supabase. Table is ready and empty (click "Sync to Cloud" to upload).',
        },
      };
    }

    const dbItems = data.map(mapDbRowToItem);
    saveLocalItems(dbItems);

    return {
      items: dbItems,
      status: {
        source: 'supabase',
        isConnectedToSupabase: true,
        message: `Synchronized live with Supabase PostgreSQL (${dbItems.length} records).`,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failed';
    return {
      items: localItems,
      status: {
        source: 'local',
        isConnectedToSupabase: false,
        message: msg,
      },
    };
  }
}

/**
 * Adds an equipment item to both Supabase (if available) and LocalStorage.
 */
export async function createItem(newItem: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<InventoryItem> {
  const localItems = getLocalItems();
  const timestamp = new Date().toISOString();
  const createdItem: InventoryItem = {
    ...newItem,
    id: 'eq-' + Date.now().toString().slice(-6),
    createdAt: timestamp,
    yearAcquired: normalizeYearAcquired(newItem.yearAcquired, newItem.propertyNumber),
  };

  const updatedLocal = [createdItem, ...localItems];
  saveLocalItems(updatedLocal);

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('equipment')
      .insert([mapItemToDbRow(createdItem)])
      .select()
      .single();

    if (!error && data) {
      const persisted = mapDbRowToItem(data);
      saveLocalItems([persisted, ...localItems]);
      broadcastLocalChange('create', persisted.id);
      return persisted;
    }
  } catch (err) {
    console.warn('Could not insert directly to Supabase, saved locally:', err);
  }

  broadcastLocalChange('create', createdItem.id);
  return createdItem;
}

/**
 * Updates an equipment item in Supabase and LocalStorage.
 */
export async function updateItem(item: InventoryItem): Promise<InventoryItem> {
  const normalizedItem: InventoryItem = {
    ...item,
    yearAcquired: normalizeYearAcquired(item.yearAcquired, item.propertyNumber),
  };
  const localItems = getLocalItems();
  const updatedLocal = localItems.map((it) => (it.id === normalizedItem.id ? normalizedItem : it));
  saveLocalItems(updatedLocal);

  try {
    const supabase = createBrowserClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedItem.id);

    const query = isUuid
      ? supabase.from('equipment').update(mapItemToDbRow(normalizedItem)).eq('id', normalizedItem.id).select()
      : supabase.from('equipment').update(mapItemToDbRow(normalizedItem)).eq('property_number', normalizedItem.propertyNumber).select();

    const { error } = await query;
    if (error) {
      console.warn('Could not update directly to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Could not update directly to Supabase, updated locally:', err);
  }

  broadcastLocalChange('update', normalizedItem.id);
  return normalizedItem;
}

/**
 * Listen for live updates made across all tabs, windows, devices, or QR verification scans.
 */
export function subscribeToInventoryChanges(onChange: () => void): () => void {
  let isCleanedUp = false;

  // 1. Supabase Realtime channel for cross-device updates
  let supabaseChannel: ReturnType<ReturnType<typeof createBrowserClient>['channel']> | null = null;
  let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

  try {
    supabaseClientInstance = createBrowserClient();
    const channelId = `eq-live-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    supabaseChannel = supabaseClientInstance
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipment' },
        () => {
          if (!isCleanedUp) {
            onChange();
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('Supabase Realtime status:', status, err);
        }
      });
  } catch (err) {
    console.warn('Live cloud subscription unavailable:', err);
  }

  // 2. BroadcastChannel for instant cross-tab / cross-window sync
  let broadcastChannel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(INVENTORY_BROADCAST_CHANNEL);
      broadcastChannel.onmessage = () => {
        if (!isCleanedUp) {
          onChange();
        }
      };
    } catch {}
  }

  // 3. Storage event listener (fallback cross-tab communication)
  const handleStorage = (e: StorageEvent) => {
    if (!isCleanedUp && (e.key === LOCAL_STORAGE_KEY || e.key === null)) {
      onChange();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // 4. Custom event for local in-page updates
  const handleCustomEvent = () => {
    if (!isCleanedUp) {
      onChange();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener(INVENTORY_CUSTOM_EVENT, handleCustomEvent);
  }

  // 5. Visibility and focus listener: refresh automatically when switching back to this tab
  const handleVisibilityOrFocus = () => {
    if (!isCleanedUp && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      onChange();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
  }

  // 6. Background heartbeat (every 15 seconds) so background tabs / sleeping connections stay updated
  let heartbeat: number | null = null;
  if (typeof window !== 'undefined') {
    heartbeat = window.setInterval(() => {
      if (!isCleanedUp && document.visibilityState === 'visible') {
        onChange();
      }
    }, 15000);
  }

  return () => {
    isCleanedUp = true;
    if (heartbeat) window.clearInterval(heartbeat);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(INVENTORY_CUSTOM_EVENT, handleCustomEvent);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    }
    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {}
    }
    if (supabaseChannel && supabaseClientInstance) {
      try {
        void supabaseClientInstance.removeChannel(supabaseChannel);
      } catch {}
    }
  };
}

/**
 * Deletes an equipment item from Supabase and LocalStorage.
 */
export async function deleteItem(id: string, propertyNumber: string): Promise<boolean> {
  const localItems = getLocalItems();
  const updatedLocal = localItems.filter((it) => it.id !== id);
  saveLocalItems(updatedLocal);

  try {
    const supabase = createBrowserClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      await supabase.from('equipment').delete().eq('id', id);
    } else {
      await supabase.from('equipment').delete().eq('property_number', propertyNumber);
    }
  } catch (err) {
    console.warn('Could not delete directly from Supabase, deleted locally:', err);
  }

  broadcastLocalChange('delete', id);
  return true;
}

/**
 * Batch pushes all current items to Supabase table safely without duplicate key collisions.
 */
export async function pushAllToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  let items = getLocalItems();
  try {
    const supabase = createBrowserClient();

    // 1. Ensure zero duplicate property numbers exist in local dataset
    const { items: cleanItems, modified } = sanitizeInventoryItems(items);
    if (modified) {
      items = cleanItems;
      saveLocalItems(cleanItems);
    }

    // 2. Map items to database rows
    const rows = items.map(mapItemToDbRow);

    // 3. Strict deduplication by property_number to guarantee no intra-batch collisions
    const dedupedRowsMap = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const key = String(row.property_number).trim().toUpperCase();
      dedupedRowsMap.set(key, row);
    }
    const safeRows = Array.from(dedupedRowsMap.values());

    // 4. Batch in chunks of 50 for optimal network performance and reliability
    const BATCH_SIZE = 50;
    for (let i = 0; i < safeRows.length; i += BATCH_SIZE) {
      const chunk = safeRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('equipment')
        .upsert(chunk, { onConflict: 'property_number' });

      if (error) {
        return { success: false, count: 0, error: error.message };
      }
    }

    return { success: true, count: safeRows.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Batch push failed';
    return { success: false, count: 0, error: msg };
  }
}
