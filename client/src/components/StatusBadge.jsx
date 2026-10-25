// Pale tint with dark text of the same hue; one status mark per row.
const TONES = {
  Scheduled: 'info',
  Completed: 'positive',
  Cancelled: 'neutral',
  'No-show': 'negative',
  Available: 'positive',
  'On leave': 'warning',
};

export function StatusBadge({ status }) {
  return <span className={`pill pill-${TONES[status] ?? 'neutral'}`}>{status}</span>;
}
