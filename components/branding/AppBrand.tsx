import Image from 'next/image';
import type { CSSProperties } from 'react';

export interface AppBrandProps {
  variant?: 'lockup' | 'mark';
  size?: number;
  showOrganization?: boolean;
  showName?: boolean;
  organizationName?: string;
  productName?: string;
  productDescriptor?: string;
  className?: string;
  markClassName?: string;
  organizationClassName?: string;
  nameClassName?: string;
  descriptorClassName?: string;
  decorative?: boolean;
  ariaLabel?: string;
}

function BrandMark({
  className,
  size,
  ariaHidden,
  role,
  ariaLabel,
}: {
  className?: string;
  size?: number;
  ariaHidden?: boolean;
  role?: 'img';
  ariaLabel?: string;
}) {
  const style: CSSProperties | undefined = size
    ? { width: size, height: size }
    : undefined;

  return (
    <span
      className={className ?? 'inline-flex shrink-0'}
      style={style}
      aria-hidden={ariaHidden || undefined}
      role={role}
      aria-label={ariaLabel}
    >
      <Image
        src="/brand/eco-inventory-mark.webp"
        alt=""
        width={size ?? 48}
        height={size ?? 48}
        loading="eager"
        className="block h-full w-full object-contain"
        aria-hidden="true"
      />
    </span>
  );
}

export function AppBrand({
  variant = 'lockup',
  size,
  showOrganization = true,
  showName = true,
  organizationName = 'PENRO Batanes',
  productName = 'ICT',
  productDescriptor = 'Inventory',
  className,
  markClassName,
  organizationClassName,
  nameClassName,
  descriptorClassName,
  decorative,
  ariaLabel = 'ICT Inventory',
}: AppBrandProps) {
  const hasVisibleName = variant === 'lockup' && (showOrganization || showName);
  const markIsDecorative = decorative ?? hasVisibleName;

  if (variant === 'mark') {
    return (
      <BrandMark
        className={className ?? 'inline-flex shrink-0'}
        size={size}
        ariaHidden={markIsDecorative}
        role={markIsDecorative ? undefined : 'img'}
        ariaLabel={markIsDecorative ? undefined : ariaLabel}
      />
    );
  }

  return (
    <div
      className={className ?? 'inline-flex items-center gap-2.5'}
      role={!hasVisibleName ? 'img' : undefined}
      aria-label={!hasVisibleName ? ariaLabel : undefined}
    >
      <BrandMark
        className={markClassName ?? 'inline-flex shrink-0'}
        size={size}
        ariaHidden={markIsDecorative}
      />
      {hasVisibleName ? (
        <span className="min-w-0">
          {showOrganization ? (
            <span className={organizationClassName ?? 'block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500'}>
              {organizationName}
            </span>
          ) : null}
          {showName ? (
            <span className={nameClassName ?? 'block truncate text-sm font-bold tracking-tight text-zinc-950 dark:text-white'}>
              <span>{productName}</span>
              {productDescriptor ? (
                <span className={descriptorClassName ?? 'ml-1.5 text-[0.82em] font-semibold tracking-normal text-zinc-500 dark:text-zinc-400'}>
                  {productDescriptor}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
