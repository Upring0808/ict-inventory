'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AppBrand } from '@/components/branding/AppBrand';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { EquipmentVerificationActionPanel } from '@/components/inventory/EquipmentVerificationActionPanel';
import { EquipmentVerificationRecordDetails } from '@/components/inventory/EquipmentVerificationRecordDetails';
import { EquipmentVerificationSummary } from '@/components/inventory/EquipmentVerificationSummary';
import type { InventoryItem } from '@/types/inventory';

const item: InventoryItem = {
  id: 'preview',
  propertyNumber: 'SEMI-LAP-23-101-001',
  serialNumber: 'SN-123456789',
  equipmentType: 'Laptop Computers',
  model: 'ThinkPad E14 Gen 5',
  brand: 'Lenovo',
  location: 'Administrative Division',
  accountablePersonnel: 'Alexandra Reyes',
  yearAcquired: '2023',
  shelfLife: 'WITHIN 5 YEARS',
  status: 'Needs Attention',
  statusCategory: 'Needs Attention',
  remarks: 'Battery drains quickly during field work. Inspect and replace if needed.',
  verificationCount: 2,
  verificationHistory: [],
};

export default function VerificationPreview() {
  const [comment, setComment] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [resolveRemark, setResolveRemark] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return (
    <main className="min-h-[100svh] bg-[#f7f6f3] px-3 pb-6 pt-4 text-slate-950 sm:px-6 sm:pb-8 sm:pt-6">
      <div className="mx-auto w-full max-w-5xl">
        <nav aria-label="Equipment verification navigation" className="mb-7 flex min-h-12 items-center justify-between gap-3">
          <AppBrand size={34} className="inline-flex min-w-0 items-center gap-2.5" organizationClassName="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600" nameClassName="block truncate text-sm font-bold tracking-tight text-slate-950" descriptorClassName="ml-1.5 text-[0.82em] font-semibold tracking-normal text-slate-600" />
          <Link href="/scanner" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"><CameraIcon />Scan</Link>
        </nav>
        <header className="mb-6">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl">Equipment verification</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">Compare this record with the physical equipment, then save a check-in.</p>
        </header>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.78fr)] lg:grid-rows-[max-content_max-content] lg:items-start lg:gap-6">
          <EquipmentVerificationSummary item={item} canEdit />
          <EquipmentVerificationActionPanel item={item} actorName="Maria Cristina Dela Cruz" actorEmail="maria.cristina.delacruz@example.gov.ph" verificationComment={comment} confirmed={confirmed} resolveActiveRemark={resolveRemark} isSaving={false} successMessage={null} errorMessage={null} onCommentChange={setComment} onConfirmationChange={setConfirmed} onRemarkResolutionChange={setResolveRemark} onSubmit={handleSubmit} className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-4 lg:self-start" />
          <EquipmentVerificationRecordDetails item={item} verificationCount={2} className="lg:col-start-1 lg:row-start-2" />
        </div>
      </div>
    </main>
  );
}
