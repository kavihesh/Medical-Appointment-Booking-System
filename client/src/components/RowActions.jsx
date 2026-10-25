import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon.jsx';

/** The "more" button at the end of a table row: Edit and Delete in a small menu. */
export function RowActions({ label, editTo, onDelete, deleteLabel = 'Delete' }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [isOpen]);

  return (
    <div className="row-actions" ref={rootRef}>
      <button
        type="button"
        className="icon-button"
        aria-label={`Actions for ${label}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon name="more" size={20} />
      </button>
      {isOpen && (
        <div className="menu" id={menuId}>
          <Link to={editTo} className="menu-item">
            <Icon name="edit" size={16} />
            Edit
          </Link>
          {onDelete && (
            <button
              type="button"
              className="menu-item menu-item-danger"
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
            >
              <Icon name="trash" size={16} />
              {deleteLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
