'use client';

import React, { useEffect, useState } from 'react';
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

  const handleDownload = async () => {
    if (!qrDataUrl) return;
    const qrImage = new Image();

    await new Promise<void>((resolve, reject) => {
      qrImage.onload = () => resolve();
      qrImage.onerror = () => reject(new Error('QR image could not be prepared.'));
      qrImage.src = qrDataUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1180;
    const context = canvas.getContext('2d');
    if (!context) return;

    const drawCentered = (text: string, y: number, font: string, color: string, maxWidth = 800) => {
      context.font = font;
      context.fillStyle = color;
      let renderedText = text || 'Not recorded';
      while (context.measureText(renderedText).width > maxWidth && renderedText.length > 1) {
        renderedText = `${renderedText.slice(0, -2)}…`;
      }
      context.fillText(renderedText, canvas.width / 2, y);
    };

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const headerGradient = context.createLinearGradient(0, 0, canvas.width, 0);
    headerGradient.addColorStop(0, '#15803d');
    headerGradient.addColorStop(1, '#1d4ed8');
    context.fillStyle = headerGradient;
    context.fillRect(0, 0, canvas.width, 168);

    context.textAlign = 'center';
    drawCentered('PENRO BATANES', 63, '700 34px Arial, sans-serif', '#ffffff');
    drawCentered('ICT ASSET VERIFICATION LABEL', 108, '700 18px Arial, sans-serif', '#dbeafe');
    drawCentered('DENR · REGION 2', 139, '600 14px Arial, sans-serif', '#dcfce7');

    context.drawImage(qrImage, 160, 205, 580, 580);
    context.strokeStyle = '#d4d4d8';
    context.lineWidth = 2;
    context.strokeRect(160, 205, 580, 580);

    drawCentered('PROPERTY NUMBER', 842, '700 15px Arial, sans-serif', '#64748b');
    drawCentered(item.propertyNumber, 885, '700 30px monospace', '#111827');
    drawCentered('SERIAL NUMBER', 940, '700 15px Arial, sans-serif', '#64748b');
    drawCentered(item.serialNumber || 'Not recorded', 975, '600 20px monospace', '#1f2937');
    drawCentered('EQUIPMENT MODEL', 1032, '700 15px Arial, sans-serif', '#64748b');
    drawCentered(`${item.brand} ${item.model}`.trim(), 1067, '700 22px Arial, sans-serif', '#111827');

    context.fillStyle = '#f1f5f9';
    context.fillRect(0, 1110, canvas.width, 70);
    drawCentered('Scan to review and verify this equipment on site', 1153, '600 16px Arial, sans-serif', '#475569');

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PENRO-Batanes-QR-${item.propertyNumber.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
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
            <button onClick={handleDownload} disabled={!qrDataUrl} className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900">
              Download PNG
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
