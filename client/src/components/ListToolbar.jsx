import { useState } from 'react';
import { Icon } from './Icon.jsx';

/**
 * Search on the left, filters and sort beside it. On phones the filters fold behind a
 * "Filters" button (showing how many are active) so the list starts near the top of the screen.
 */
export function ListToolbar({ search, activeFilterCount, onClear, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="toolbar">
      <div className="toolbar-main">
        {search}
        <button
          type="button"
          className="btn btn-secondary filters-toggle"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <Icon name="filter" size={16} />
          Filters{activeFilterCount > 0 && <span className="count-badge num">{activeFilterCount}</span>}
        </button>
      </div>
      <div className={`toolbar-filters${isOpen ? ' is-open' : ''}`}>
        {children}
        {activeFilterCount > 0 && (
          <button type="button" className="btn btn-ghost clear-filters" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
