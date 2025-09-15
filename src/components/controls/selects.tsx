'use client';
import * as React from 'react';

type Option = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  id?: string;
  className?: string;
};
export function Select({ label, value, onChange, options, id, className }: SelectProps) {
  const selectId = id || React.useId();
  return (
    <label htmlFor={selectId} className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <select
        id={selectId}
        className={['rounded border px-2 py-1', className].filter(Boolean).join(' ')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type MultiSelectProps = {
  label: string;
  values: string[];
  onChange: (vals: string[]) => void;
  options: Option[];
  id?: string;
  className?: string;
  cap?: number; // optional plan cap (e.g., 1/2/Infinity)
};
export function MultiSelect({ label, values, onChange, options, id, className, cap }: MultiSelectProps) {
  const selectId = id || React.useId();
  function toggle(v: string) {
    const on = values.includes(v);
    if (on) onChange(values.filter((x) => x !== v));
    else if (cap && values.length >= cap) {
      // soft gate; replace alert with inline banner in your app shell
      // eslint-disable-next-line no-alert
      alert(`Plan limit reached (${cap}).`);
    } else onChange([...values, v]);
  }
  return (
    <div className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <div id={selectId} className={['flex flex-wrap gap-2', className].filter(Boolean).join(' ')}>
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              disabled={o.disabled}
              onClick={() => toggle(o.value)}
              className={['rounded border px-3 py-1 text-sm',
                on ? 'bg-black text-white' : 'bg-white text-black'].join(' ')}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Common option sets */
export const recurrenceOpts: Option[] = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];
export const reminderOpts: Option[] = [
  { value: 'off', label: 'Off' },
  { value: '5', label: '5 min before' },
  { value: '10', label: '10 min before' },
  { value: '15', label: '15 min before' },
  { value: '30', label: '30 min before' },
  { value: '60', label: '60 min before' },
];
export const visibilityOpts: Option[] = [
  { value: 'family', label: 'Family' },
  { value: 'relatives', label: 'Relatives' },
  { value: 'caregivers', label: 'Caregivers' },
  { value: 'custom', label: 'Custom (pick users)' },
];
export const roleOpts: Option[] = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Family', label: 'Parent/Family' },
  { value: 'Child', label: 'Minor/Child' },
  { value: 'Relative', label: 'Relative (limited)' },
  { value: 'Caregiver', label: 'Caregiver (expiry)' },
  { value: 'Guest', label: 'Guest (read-only)' },
];
export const caregiverExpiryOpts: Option[] = [
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'custom', label: 'Custom…' },
];
export const autoActionOpts: Option[] = [
  { value: 'play_loud_alert', label: 'Loud alert' },
  { value: 'screen_lock', label: 'Lock screen' },
  { value: 'network_pause', label: 'Pause network' },
  { value: 'app_restart', label: 'Restart app' },
  { value: 'device_restart', label: 'Restart device' },
  { value: 'device_shutdown', label: 'Shutdown device' },
];
export const deviceKindOpts: Option[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'pc', label: 'PC' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'other', label: 'Other' },
];
export const zonePresetOpts: Option[] = [
  { value: 'home', label: 'Home' },
  { value: 'school', label: 'School' },
  { value: 'custom', label: 'Custom' },
];
export const routeOpts: Option[] = [
  { value: 'PO', label: 'Oral (PO)' },
  { value: 'SC', label: 'Subcutaneous (SC)' },
  { value: 'IM', label: 'Intramuscular (IM)' },
  { value: 'TOP', label: 'Topical' },
];
export const barcodeFormatOpts: Option[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'upc', label: 'UPC' },
  { value: 'gs1', label: 'GS1' },
];
