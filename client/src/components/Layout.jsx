import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { APP_NAME, APP_TAGLINE } from '../config.js';
import { BreadcrumbContext } from '../hooks/usePageMeta.js';
import { Icon } from './Icon.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: 'overview', end: true },
  { to: '/appointments', label: 'Appointments', icon: 'appointments' },
  { to: '/doctors', label: 'Doctors', icon: 'doctors' },
  { to: '/patients', label: 'Patients', icon: 'patients' },
];

const todayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
  new Date(),
);

/** App shell: sidebar on large screens, top bar with breadcrumbs, bottom tab bar on phones and tablets. */
export function Layout() {
  const [crumbs, setCrumbs] = useState([]);
  const parents = crumbs.slice(0, -1);

  return (
    <BreadcrumbContext.Provider value={setCrumbs}>
      <div className="shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <aside className="sidebar">
          <Brand />
          <nav aria-label="Main">
            <p className="nav-group">Clinic</p>
            <ul className="nav-list">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="nav-link">
                    <Icon name={item.icon} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <Link to="/appointments/new" className="btn btn-primary sidebar-action">
            <Icon name="plus" size={16} />
            Book appointment
          </Link>
        </aside>

        <header className="topbar">
          <div className="topbar-brand">
            <Brand compact />
          </div>
          <nav aria-label="Breadcrumb" className="breadcrumbs">
            <ol>
              {parents.map((crumb, index) => (
                <li key={crumb.to} className={index === parents.length - 1 ? 'crumb-up' : undefined}>
                  <Link to={crumb.to}>
                    <Icon name="back" size={16} className="crumb-back" />
                    {crumb.label}
                  </Link>
                </li>
              ))}
              {crumbs.length > 0 && (
                <li aria-current="page" className="crumb-current">
                  {crumbs[crumbs.length - 1].label}
                </li>
              )}
            </ol>
          </nav>
          <div className="topbar-end">
            <Icon name="calendar" size={16} />
            <span className="today">{todayLabel}</span>
          </div>
        </header>

        <main id="main" className="canvas" tabIndex={-1}>
          <Outlet />
        </main>

        <nav className="bottom-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="bottom-link">
              <Icon name={item.icon} size={22} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </BreadcrumbContext.Provider>
  );
}

function Brand({ compact = false }) {
  return (
    <Link to="/" className={`brand${compact ? ' brand-compact' : ''}`} aria-label={`${APP_NAME} home`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="32" height="32">
          <rect width="32" height="32" rx="8" fill="var(--accent)" />
          <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#fff" />
        </svg>
      </span>
      {!compact && (
        <span className="brand-text">
          <strong>{APP_NAME}</strong>
          <span>{APP_TAGLINE}</span>
        </span>
      )}
    </Link>
  );
}
