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

    // A compact, near-square label: QR first, with a concise asset identity strip.
    const W = 1000;
    const H = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper: draw centered text with overflow ellipsis
    const drawCentered = (text: string, y: number, font: string, color: string, maxWidth = 920) => {
      ctx.font = font;
      ctx.fillStyle = color;
      let rendered = text || 'Not recorded';
      while (ctx.measureText(rendered).width > maxWidth && rendered.length > 1) {
        rendered = `${rendered.slice(0, -2)}\u2026`;
      }
      ctx.fillText(rendered, W / 2, y);
    };

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // A deliberately quiet header keeps the label useful at small print sizes.
    const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
    headerGrad.addColorStop(0, '#14532d');
    headerGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, W, 76);

    ctx.textAlign = 'center';
    drawCentered('PENRO BATANES  \u00B7  ICT EQUIPMENT', 47, '700 23px Arial, sans-serif', '#ffffff');

    // QR code
    const QR_SIZE = 630;
    const QR_X = (W - QR_SIZE) / 2;
    const QR_Y = 94;
    ctx.drawImage(qrImage, QR_X, QR_Y, QR_SIZE, QR_SIZE);
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 2;
    ctx.strokeRect(QR_X, QR_Y, QR_SIZE, QR_SIZE);

    // Asset identity strip — property and serial are deliberately larger than the model.
    const STRIP_Y = 742;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(32, STRIP_Y + 14, W - 64, 230);
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, STRIP_Y);
    ctx.lineTo(W - 40, STRIP_Y);
    ctx.stroke();

    const modelStr = `${item.brand} ${item.model}`.trim();
    const serialStr = item.serialNumber || 'Not recorded';

    drawCentered('PROPERTY NUMBER', STRIP_Y + 28, '700 13px Arial, sans-serif', '#6b7280');
    drawCentered(item.propertyNumber, STRIP_Y + 70, '700 34px "Courier New", monospace', '#111827');
    drawCentered('SERIAL NUMBER', STRIP_Y + 109, '700 13px Arial, sans-serif', '#6b7280');
    drawCentered(serialStr, STRIP_Y + 148, '700 27px "Courier New", monospace', '#1d4ed8');
    drawCentered('MODEL', STRIP_Y + 187, '700 13px Arial, sans-serif', '#6b7280');
    drawCentered(modelStr, STRIP_Y + 226, '700 23px Arial, sans-serif', '#374151');

    // Draw this last so the trim guide remains visible over the header and all label sections.
    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.restore();

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
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">Square PNG with large property, serial, and model details.</p>
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
