interface EquipmentVerificationFieldProps {
  label: string;
  value?: string;
  monospace?: boolean;
  inverse?: boolean;
}

export function formatVerificationDate(value?: string) {
  if (!value) return 'Not yet verified';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function EquipmentVerificationField({
  label,
  value,
  monospace = false,
  inverse = false,
}: EquipmentVerificationFieldProps) {
  return (
    <div className="min-w-0">
      <dt className={'text-xs font-semibold ' + (inverse ? 'text-emerald-100' : 'text-slate-700 dark:text-slate-300')}>
        {label}
      </dt>
      <dd
        className={
          'mt-1 break-words font-medium leading-5 ' +
          (inverse ? 'text-white ' : 'text-slate-950 dark:text-slate-100 ') +
          (monospace ? 'break-all font-mono text-[13px] font-semibold' : 'text-sm')
        }
      >
        {value?.trim() || '—'}
      </dd>
    </div>
  );
}
