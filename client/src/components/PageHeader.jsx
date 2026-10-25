import { usePageMeta } from '../hooks/usePageMeta.js';

/**
 * The page's h1, an optional one-line summary under it and the page's actions on the right.
 * `crumbs` are the parent pages ({ label, to }) shown in the top bar.
 */
export function PageHeader({ title, subtitle, crumbs = [], children }) {
  usePageMeta(title, crumbs);

  return (
    <div className="page-header">
      <div className="page-heading">
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
