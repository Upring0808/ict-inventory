'use client';

import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  EquipmentType,
  EquipmentStatusCategory,
  ShelfLifeCategory,
} from '@/types/inventory';

interface EquipmentModalProps {
  isOpen: boolean;
  itemToEdit: InventoryItem | null;
  onClose: () => void;
  onSave: (itemData: Omit<InventoryItem, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  availableLocations: string[];
  availableBrands: string[];
}

export function EquipmentModal({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
  availableLocations,
  availableBrands,
}: EquipmentModalProps) {
  const [propertyNumber, setPropertyNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('Desktop Computers');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [accountablePersonnel, setAccountablePersonnel] = useState('');
  const [location, setLocation] = useState('');
  const [yearAcquired, setYearAcquired] = useState('');
  const [shelfLife, setShelfLife] = useState<ShelfLifeCategory>('WITHIN 5 YEARS');

  // Hardware specs
  const [processor, setProcessor] = useState('');
  const [ram, setRam] = useState('');
  const [gpu, setGpu] = useState('');
  const [osInstalled, setOsInstalled] = useState('');
  const [officeProductivityProduct, setOfficeProductivityProduct] = useState('');
  const [endpointProtection, setEndpointProtection] = useState('');

  // Maintenance & condition
  const [datePmsConducted, setDatePmsConducted] = useState('');
  const [statusCategory, setStatusCategory] = useState<EquipmentStatusCategory>('Serviceable');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (itemToEdit) {
      setPropertyNumber(itemToEdit.propertyNumber);
      setSerialNumber(itemToEdit.serialNumber || '');
      setEquipmentType(itemToEdit.equipmentType);
      setModel(itemToEdit.model);
      setBrand(itemToEdit.brand);
      setAccountablePersonnel(itemToEdit.accountablePersonnel);
      setLocation(itemToEdit.location);
      setYearAcquired(itemToEdit.yearAcquired || '');
      setShelfLife(itemToEdit.shelfLife || 'WITHIN 5 YEARS');

      setProcessor(itemToEdit.processor || '');
      setRam(itemToEdit.ram || '');
      setGpu(itemToEdit.gpu || '');
      setOsInstalled(itemToEdit.osInstalled || '');
      setOfficeProductivityProduct(itemToEdit.officeProductivityProduct || '');
      setEndpointProtection(itemToEdit.endpointProtection || '');

      setDatePmsConducted(itemToEdit.datePmsConducted || '');
      setStatusCategory(itemToEdit.statusCategory);
      setRemarks(itemToEdit.remarks || '');
      } else {
      setPropertyNumber('');
      setSerialNumber('');
      setEquipmentType('Desktop Computers');
      setModel('');
      setBrand('');
      setAccountablePersonnel('');
      setLocation('');
      setYearAcquired('');
      setShelfLife('WITHIN 5 YEARS');

      setProcessor('');
      setRam('');
      setGpu('');
      setOsInstalled('');
      setOfficeProductivityProduct('');
      setEndpointProtection('');

      setDatePmsConducted('');
      setStatusCategory('Serviceable');
      setRemarks('');
      }
      setError('');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyNumber.trim()) {
      setError('Property Number is required.');
      return;
    }
    if (!model.trim()) {
      setError('Model is required.');
      return;
    }
    if (!brand.trim()) {
      setError('Brand is required.');
      return;
    }
    if (!accountablePersonnel.trim()) {
      setError('Accountable Personnel is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const computedStatus = remarks.trim()
        ? `${statusCategory} (${remarks.trim()})`
        : statusCategory;

      await onSave(
        {
          propertyNumber: propertyNumber.trim(),
          serialNumber: serialNumber.trim() || undefined,
          equipmentType,
          model: model.trim(),
          brand: brand.trim(),
          accountablePersonnel: accountablePersonnel.trim(),
          location: location.trim().toUpperCase(),
          yearAcquired: yearAcquired.trim() || undefined,
          shelfLife,

          processor: processor.trim() || undefined,
          ram: ram.trim() || undefined,
          gpu: gpu.trim() || undefined,
          osInstalled: osInstalled.trim() || undefined,
          officeProductivityProduct: officeProductivityProduct.trim() || undefined,
          endpointProtection: endpointProtection.trim() || undefined,

          datePmsConducted: datePmsConducted.trim(),
          status: computedStatus,
          statusCategory,
          remarks: remarks.trim() || undefined,
        },
        itemToEdit ? itemToEdit.id : undefined
      );

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save equipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComputer = equipmentType === 'Desktop Computers' || equipmentType === 'Laptop Computers';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div role="dialog" aria-modal="true" aria-label={itemToEdit ? 'Edit equipment' : 'Register equipment'} className="max-h-[94svh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 dark:border-zinc-800 dark:bg-zinc-900 sm:max-h-[90vh] sm:rounded-2xl sm:p-6 sm:zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 sm:-mx-6 sm:-mt-6 sm:px-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {itemToEdit ? 'Edit Equipment Specifications' : 'Register New ICT Asset'}
            </h3>
            <p className="text-xs text-zinc-500">
              {itemToEdit
                ? 'Update asset specs, shelf-life lifecycle, or custody assignment.'
                : 'Digitalize and add an equipment record into the government inventory system.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Section 1: Identification */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Property Number *
              </label>
              <input
                type="text"
                required
                value={propertyNumber}
                onChange={(e) => setPropertyNumber(e.target.value)}
                placeholder="e.g. 2025-05-03-COMP-02"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. DQBKLSP0023520037B3000"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Equipment Type *
              </label>
              <select
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-400"
              >
                <option value="Desktop Computers">Desktop Computers</option>
                <option value="Laptop Computers">Laptop Computers</option>
                <option value="Printers">Printers</option>
                <option value="Scanners">Scanners</option>
              </select>
            </div>
          </div>

          {/* Section 2: Model, Brand & Age */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Model *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Aspire C-24-1800, L3210"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Brand *
              </label>
              <input
                type="text"
                required
                list="brands-list"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. ACER, HP, EPSON"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
              />
              <datalist id="brands-list">
                {availableBrands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Shelf Life / Age *
              </label>
              <select
                value={shelfLife}
                onChange={(e) => setShelfLife(e.target.value as ShelfLifeCategory)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-400"
              >
                <option value="WITHIN 5 YEARS">Within 5 Years</option>
                <option value="BEYOND 5 YEARS">Beyond 5 Years (Old)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Hardware Specifications (If Desktop/Laptop) */}
          {isComputer && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                Workstation Specifications (Computers)
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Processor (CPU)
                  </label>
                  <input
                    type="text"
                    value={processor}
                    onChange={(e) => setProcessor(e.target.value)}
                    placeholder="e.g. Intel Core i5-1135G7"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    RAM Memory
                  </label>
                  <input
                    type="text"
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    placeholder="e.g. 8.00 GB, 16.00 GB"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Operating System
                  </label>
                  <input
                    type="text"
                    value={osInstalled}
                    onChange={(e) => setOsInstalled(e.target.value)}
                    placeholder="e.g. WINDOWS 11, WINDOWS 10"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Graphics Card (GPU)
                  </label>
                  <input
                    type="text"
                    value={gpu}
                    onChange={(e) => setGpu(e.target.value)}
                    placeholder="e.g. NVIDIA GeForce MX330"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Productivity Software
                  </label>
                  <input
                    type="text"
                    value={officeProductivityProduct}
                    onChange={(e) => setOfficeProductivityProduct(e.target.value)}
                    placeholder="e.g. MICROSOFT 365"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Endpoint Security (Antivirus)
                  </label>
                  <input
                    type="text"
                    value={endpointProtection}
                    onChange={(e) => setEndpointProtection(e.target.value)}
                    placeholder="e.g. KASPERSKY, WINDOWS DEFENDER"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Custody & Maintenance */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Accountable Personnel *
              </label>
              <input
                type="text"
                required
                value={accountablePersonnel}
                onChange={(e) => setAccountablePersonnel(e.target.value)}
                placeholder="e.g. RODERICK Y. ABAD"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Office / Division *
              </label>
              <input
                type="text"
                required
                list="locations-list"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. ICT, FINANCE, RPS"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
              />
              <datalist id="locations-list">
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Year Acquired
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={yearAcquired}
                onChange={(e) => setYearAcquired(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="e.g. 2024"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                PMS Conducted Date
              </label>
              <input
                type="text"
                value={datePmsConducted}
                onChange={(e) => setDatePmsConducted(e.target.value)}
                placeholder="e.g. MAY 18, 2026"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Health Condition *
              </label>
              <select
                value={statusCategory}
                onChange={(e) => setStatusCategory(e.target.value as EquipmentStatusCategory)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-400"
              >
                <option value="Serviceable">Serviceable (Normal / Operational)</option>
                <option value="Needs Attention">Needs Attention</option>
                <option value="Parts Replacement">Parts Replacement (HDD, Battery, Fan)</option>
                <option value="For Repair">For Repair (Inoperable / Defective)</option>
                <option value="For Disposal">For Disposal (Condemned)</option>
              </select>
            </div>
          </div>

          {/* Defect Remarks */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Maintenance Remarks & Defect Details
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Upgrade of HDD to SSD recommended; Screen replacement needed"
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 -mx-4 -mb-4 flex items-center justify-end gap-3 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 sm:-mx-6 sm:-mb-6 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Register Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
