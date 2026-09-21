'use client';

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { InventoryItem } from '@/types/inventory';
import { equipmentVerificationUrl } from '@/lib/qrEquipment';

interface EquipmentQrLabelProps {
  item: InventoryItem;
}

export function EquipmentQrLabel({ item }: EquipmentQrLabelProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = equipmentVerificationUrl(item, window.location.origin);
    let isCurrent = true;

    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 360,
      color: { dark: '#111827', light: '#ffffff' },
    }).then((dataUrl) => {
      if (isCurrent) setQrDataUrl(dataUrl);
    }).catch(() => {
      if (isCurrent) setQrDataUrl(null);
    });

    return () => { isCurrent = false; };
  }, [item]);

  const verificationUrl = qrDataUrl && typeof window !== 'undefined'
    ? equipmentVerificationUrl(item, window.location.origin)
    : null;

  const labelTitle = useMemo(
    () => `${item.brand} ${item.model}`.trim(),
    [item.brand, item.model]
  );

  const handlePrint = () => {
    if (!qrDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!doctype html><html><head><title>QR label — ${item.propertyNumber}</title><style>body{font-family:Arial,sans-serif;padding:24px}.label{width:270px;border:2px solid #111827;border-radius:14px;padding:18px;text-align:center}.brand{font-size:11px;font-weight:bold;letter-spacing:.12em}.property{font-family:monospace;font-size:17px;font-weight:bold;margin:8px 0}.model{font-size:12px;color:#374151;min-height:30px}.qr{width:190px;height:190px;margin:12px auto 4px}.note{font-size:10px;color:#4b5563;margin:0}</style></head><body><div class="label"><div class="brand">PENRO BATANES · ICT ASSET</div><div class="property">${item.propertyNumber}</div><div class="model">${labelTitle}</div><img class="qr" src="${qrDataUrl}" alt="Equipment QR code"/><p class="note">Scan to verify this equipment on site</p></div><script>window.onload=function(){window.print();window.close()}</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <section className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-emerald-50 p-3.5 dark:border-blue-900/60 dark:from-blue-950/30 dark:to-emerald-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm dark:bg-zinc-50">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`QR code for ${item.propertyNumber}`} className="h-full w-full" />
          ) : (
            <div className="h-14 w-14 animate-pulse rounded bg-zinc-200" aria-label="Generating QR code" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300">Equipment QR</p>
          <p className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100">Scan to check and confirm on site</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">The mobile screen records a dated verification only after the reviewer approves the displayed details.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button onClick={handlePrint} disabled={!qrDataUrl} className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900">
              Print label
            </button>
            {verificationUrl && (
              <a href={verificationUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Open mobile view
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
