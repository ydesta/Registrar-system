export const STUDENT_CARD_STATUS_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Draft' },
  { value: 2, label: 'Active' },
  { value: 3, label: 'Suspended' },
  { value: 4, label: 'Lost' },
  { value: 5, label: 'Expired' },
  { value: 6, label: 'Cancelled' },
  { value: 7, label: 'Replaced' }
];

const STATUS_MAP: Record<number, string> = {
  1: 'Draft',
  2: 'Active',
  3: 'Suspended',
  4: 'Lost',
  5: 'Expired',
  6: 'Cancelled',
  7: 'Replaced'
};

const ACTION_MAP: Record<number, string> = {
  1: 'Created',
  2: 'Activated',
  3: 'Suspended',
  4: 'Reinstated',
  5: 'Reported lost',
  6: 'Renewed',
  7: 'Cancelled',
  8: 'Expired',
  9: 'Replaced',
  10: 'Printed',
  11: 'Reprinted'
};

export function studentCardStatusLabel(status: number | string | null | undefined): string {
  if (status == null || status === '') {
    return '';
  }
  if (typeof status === 'number') {
    return STATUS_MAP[status] || String(status);
  }
  if (/^\d+$/.test(status)) {
    return STATUS_MAP[Number(status)] || status;
  }
  return String(status);
}

export function studentCardStatusColor(status: number | string | null | undefined): string {
  const label = studentCardStatusLabel(status).toLowerCase();
  if (label === 'active') return 'green';
  if (label === 'draft') return 'blue';
  if (label === 'suspended') return 'orange';
  if (label === 'lost' || label === 'cancelled') return 'red';
  if (label === 'expired' || label === 'replaced') return 'default';
  return 'default';
}

export function studentCardActionLabel(action: number | string | null | undefined): string {
  if (action == null || action === '') {
    return '';
  }
  if (typeof action === 'number') {
    return ACTION_MAP[action] || String(action);
  }
  if (/^\d+$/.test(action)) {
    return ACTION_MAP[Number(action)] || action;
  }
  return String(action);
}
