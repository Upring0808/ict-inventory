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
  const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);

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
      setIsTechnicalDetailsOpen(Boolean(
        itemToEdit.processor?.trim() || itemToEdit.ram?.trim() || itemToEdit.gpu?.trim() ||
        itemToEdit.osInstalled?.trim() || itemToEdit.officeProductivityProduct?.trim() ||
        itemToEdit.endpointProtection?.trim()
      ));

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
      setIsTechnicalDetailsOpen(false);

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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 animate-in fade-in duration-150 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-modal-title"
        className="flex h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-xl animate-in fade-in duration-150 dark:border-zinc-800 dark:bg-zinc-950 sm:h-[88vh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <div className="min-w-0">
            <h3 id="equipment-modal-title" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {itemToEdit ? 'Edit equipment' : 'Add equipment'}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {itemToEdit ? `${itemToEdit.propertyNumber} · ${itemToEdit.equipmentType}` : 'Required fields are marked *.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close equipment form"
            className="-mr-2 -mt-1 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <svg className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Scrollable Form Body with Floating Elevated Cards */}
          <div className="min-h-0 flex-1 space-y-0 overflow-y-auto bg-white px-5 py-2 sm:px-6 dark:bg-zinc-950">

          {/* Card 1: Asset Identity & Lifecycle */}
          <div className="border-b border-zinc-200 py-5 last:border-b-0 dark:border-zinc-800">
            <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Equipment identity</h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Property number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={propertyNumber}
                  onChange={(e) => setPropertyNumber(e.target.value)}
                  placeholder="e.g. 2025-05-03-COMP-02"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Serial number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. DQBKLSP0023520037B3000"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Equipment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-medium text-zinc-900 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                >
                  <option value="Desktop Computers">Desktop Computers</option>
                  <option value="Laptop Computers">Laptop Computers</option>
                  <option value="Printers">Printers</option>
                  <option value="Scanners">Scanners</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Shelf life <span className="text-rose-500">*</span>
                </label>
                <select
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value as ShelfLifeCategory)}
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-medium text-zinc-900 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                >
                  <option value="WITHIN 5 YEARS">Within 5 years</option>
                  <option value="BEYOND 5 YEARS">Beyond 5 years</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Equipment Model & Specifications */}
          <div className="border-b border-zinc-200 py-5 last:border-b-0 dark:border-zinc-800">
            <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Equipment details</h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="brands-list"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. ACER, HP, EPSON"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                />
                <datalist id="brands-list">
                  {availableBrands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Aspire C-24-1800, L3210"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Year Acquired
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={yearAcquired}
                  onChange={(e) => setYearAcquired(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="e.g. 2024"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                />
              </div>
            </div>

            {/* Nested Computing Specs Sub-Card (Computers Only) */}
            {isComputer && (
              <details open={isTechnicalDetailsOpen} onToggle={(event) => setIsTechnicalDetailsOpen(event.currentTarget.open)} className="group mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-zinc-700 outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-zinc-300">
                  <span>Additional technical details <span className="text-xs font-normal text-zinc-500">(optional)</span></span>
                  <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.25 4.5a.75.75 0 0 1 1.06.02l4.25 4.5a.75.75 0 0 1 0 1.03l-4.25 4.5a.75.75 0 1 1-1.09-1.03L10.99 9.5 7.23 5.53a.75.75 0 0 1 .02-1.03Z" clipRule="evenodd" /></svg>
                </summary>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Processor (CPU)
                    </label>
                    <input
                      type="text"
                      value={processor}
                      onChange={(e) => setProcessor(e.target.value)}
                      placeholder="e.g. Intel Core i5-1135G7"
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      RAM Memory
                    </label>
                    <input
                      type="text"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      placeholder="e.g. 8.00 GB, 16.00 GB"
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Operating System
                    </label>
                    <input
                      type="text"
                      value={osInstalled}
                      onChange={(e) => setOsInstalled(e.target.value)}
                      placeholder="e.g. WINDOWS 11 PRO"
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Graphics Card (GPU)
                    </label>
                    <input
                      type="text"
                      value={gpu}
                      onChange={(e) => setGpu(e.target.value)}
                      placeholder="e.g. NVIDIA GeForce MX330"
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Productivity Suite
                    </label>
                    <input
                      type="text"
                      value={officeProductivityProduct}
                      onChange={(e) => setOfficeProductivityProduct(e.target.value)}
                      placeholder="e.g. MICROSOFT 365"
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Endpoint Protection
                    </label>
                    <input
                      type="text"
                      value={endpointProtection}
                      onChange={(e) => setEndpointProtection(e.target.value)}
                      placeholder="e.g. WINDOWS DEFENDER"
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              </details>
            )}
          </div>

          {/* Card 3: Custody & Location Assignment */}
          <div className="border-b border-zinc-200 py-5 last:border-b-0 dark:border-zinc-800">
            <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Custody and office</h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Accountable person <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountablePersonnel}
                  onChange={(e) => setAccountablePersonnel(e.target.value)}
                  disabled={Boolean(itemToEdit)}
                  placeholder="e.g. RODERICK Y. ABAD"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Office <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="locations-list"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={Boolean(itemToEdit)}
                  placeholder="e.g. ICT, FINANCE, RPS"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                />
                <datalist id="locations-list">
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>
            {itemToEdit && (
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                Custody changes require a recorded handoff. Open this equipment&apos;s details and use Transfer ownership.
              </p>
            )}
          </div>

          {/* Card 4: Operational Condition & Maintenance */}
          <div className="border-b border-zinc-200 py-5 last:border-b-0 dark:border-zinc-800">
            <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Condition and maintenance</h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Condition <span className="text-rose-500">*</span>
                </label>
                <select
                  value={statusCategory}
                  onChange={(e) => setStatusCategory(e.target.value as EquipmentStatusCategory)}
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                >
                  <option value="Serviceable">Serviceable</option>
                  <option value="Needs Attention">Needs attention</option>
                  <option value="Parts Replacement">Parts replacement</option>
                  <option value="For Repair">For repair</option>
                  <option value="For Disposal">For disposal</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Last PMS date
                </label>
                <input
                  type="text"
                  value={datePmsConducted}
                  onChange={(e) => setDatePmsConducted(e.target.value)}
                  placeholder="e.g. MAY 18, 2026"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                />
              </div>

              {/* Maintenance notes */}
              <div className="sm:col-span-2">
                <label htmlFor="equipment-remarks" className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Maintenance notes
                </label>
                <textarea
                  id="equipment-remarks"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Upgrade of HDD to SSD recommended; Screen replacement needed; Battery defective"
                  className="w-full min-h-[72px] resize-y rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          </div>

          {/* Pinned Bottom Footer Bar */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950"
            >
              {isSubmitting && (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSubmitting ? 'Saving...' : itemToEdit ? 'Save changes' : 'Add equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
