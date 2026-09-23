'use client';

import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  EquipmentType,
  EquipmentStatusCategory,
  ShelfLifeCategory,
} from '@/types/inventory';
import { StatusBadge } from './StatusBadge';

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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={itemToEdit ? 'Edit equipment' : 'Register equipment'}
        className="flex h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-zinc-200/80 bg-slate-50 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 dark:border-zinc-800 dark:bg-zinc-950 sm:h-[88vh] sm:rounded-2xl"
      >
        {/* Header with Brand Gradient Icon */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-200/80 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 sm:px-6 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-blue-500/20"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #2563eb 100%)' }}
            >
              {itemToEdit ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {itemToEdit ? 'Edit Equipment Specifications' : 'Register New ICT Asset'}
                </h3>
                {itemToEdit ? (
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {itemToEdit.propertyNumber}
                    </span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
                      {itemToEdit.equipmentType}
                    </span>
                    <StatusBadge
                      category={itemToEdit.statusCategory}
                      rawStatus={itemToEdit.status}
                      size="sm"
                      showRemark={false}
                    />
                  </div>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/50">
                    New PPE Asset
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {itemToEdit
                  ? 'Update technical hardware specs, physical custody, lifecycle status, or maintenance history.'
                  : 'Digitalize and add equipment details into the government property management system.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-transparent p-2 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-all"
            title="Close (Esc)"
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
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6 bg-slate-50/80 dark:bg-zinc-950/90">
          
          {/* Card 1: Asset Identity & Lifecycle */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Property Identification & Classification
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Official inventory tracking numbers and asset category
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
                Core Identity
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Property Number <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-normal text-zinc-400">Sticker barcode/tag</span>
                </label>
                <input
                  type="text"
                  required
                  value={propertyNumber}
                  onChange={(e) => setPropertyNumber(e.target.value)}
                  placeholder="e.g. 2025-05-03-COMP-02"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Serial Number</span>
                  <span className="text-[10px] font-normal text-zinc-400">Manufacturer S/N</span>
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. DQBKLSP0023520037B3000"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Equipment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                >
                  <option value="Desktop Computers">Desktop Computers</option>
                  <option value="Laptop Computers">Laptop Computers</option>
                  <option value="Printers">Printers</option>
                  <option value="Scanners">Scanners</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Shelf-Life Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value as ShelfLifeCategory)}
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                >
                  <option value="WITHIN 5 YEARS">Within 5 Years (Active Lifecycle)</option>
                  <option value="BEYOND 5 YEARS">Beyond 5 Years (Aged / Fully Depreciated)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Equipment Model & Specifications */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Equipment Model & Specifications
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Manufacturer details, brand name, and hardware configuration
                  </p>
                </div>
              </div>
            </div>

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
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
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
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
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
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                />
              </div>
            </div>

            {/* Nested Computing Specs Sub-Card (Computers Only) */}
            {isComputer && (
              <div className="mt-4 rounded-xl border border-blue-100/90 bg-blue-50/30 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 shadow-2xs">
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    Workstation Computing Specs
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    For Desktops & Laptops
                  </span>
                </div>
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
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Custody & Location Assignment */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Custody & Location Assignment
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Personnel accountability and organizational placement
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Accountable Officer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountablePersonnel}
                  onChange={(e) => setAccountablePersonnel(e.target.value)}
                  placeholder="e.g. RODERICK Y. ABAD"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Office / Division <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="locations-list"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. ICT, FINANCE, RPS"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                />
                <datalist id="locations-list">
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Card 4: Operational Condition & Maintenance */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Operational Condition & Preventive Maintenance (PMS)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Current health status, periodic maintenance records, and findings
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Health Condition <span className="text-rose-500">*</span>
                </label>
                <select
                  value={statusCategory}
                  onChange={(e) => setStatusCategory(e.target.value as EquipmentStatusCategory)}
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                >
                  <option value="Serviceable">Serviceable (Normal / Operational)</option>
                  <option value="Needs Attention">Needs Attention (Minor Issue / Sluggish)</option>
                  <option value="Parts Replacement">Parts Replacement (HDD, Battery, LCD)</option>
                  <option value="For Repair">For Repair (Inoperable / Major Defect)</option>
                  <option value="For Disposal">For Disposal (Condemned / Beyond Economic Repair)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>PMS Conducted Date</span>
                  <span className="text-[10px] font-normal text-zinc-400">Latest inspection</span>
                </label>
                <input
                  type="text"
                  value={datePmsConducted}
                  onChange={(e) => setDatePmsConducted(e.target.value)}
                  placeholder="e.g. MAY 18, 2026"
                  className="w-full rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                />
              </div>

              {/* Maintenance Remarks & Defect Details */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Maintenance Remarks & Defect Details</span>
                  <span className="text-[10px] font-normal text-zinc-400">Displayed in Remarks column</span>
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Upgrade of HDD to SSD recommended; Screen replacement needed; Battery defective"
                  className="w-full min-h-[72px] resize-y rounded-xl border border-zinc-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          </div>

          {/* Pinned Bottom Footer Bar */}
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-zinc-200/80 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 sm:px-6 shadow-md shadow-zinc-950/5">
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
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #2563eb 100%)' }}
            >
              {isSubmitting && (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSubmitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Register ICT Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
