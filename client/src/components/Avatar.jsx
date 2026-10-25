// Pale hues for people's initials, at least 40 degrees apart; identity only, never data.
const HUES = [152, 200, 28, 340, 48, 176, 12, 220];

/** A person's initials on a stable pale tint derived from their name. */
export function Avatar({ name, size = 'md' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const hash = [...name].reduce((sum, char) => sum + char.codePointAt(0), 0);
  const hue = HUES[hash % HUES.length];

  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ '--avatar-bg': `hsl(${hue} 55% 92%)`, '--avatar-ink': `hsl(${hue} 45% 26%)` }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
