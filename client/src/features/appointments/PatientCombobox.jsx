import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { Icon } from '../../components/Icon.jsx';
import { SEARCH_DEBOUNCE_MS } from '../../config.js';
import { useApi } from '../../hooks/useApi.js';

const RESULT_LIMIT = 8;

/**
 * Type-to-search picker for patients (ARIA combobox pattern).
 * Shows matches by name, NIC or phone as you type; Arrow keys move, Enter picks, Escape closes.
 * Once a patient is picked it shows as a card with a "Change" button.
 */
export function PatientCombobox({ patient, onSelect, error }) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [isOpen]);

  const search = new URLSearchParams({ sort: 'fullName', limit: RESULT_LIMIT, ...(query && { q: query }) });
  const { data, error: loadError, isLoading } = useApi(isOpen && !patient ? `/patients?${search}` : null);
  const results = data?.items ?? [];

  const pick = (picked) => {
    onSelect(picked);
    setIsOpen(false);
    setText('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (results.length ? (index + step + results.length) % results.length : 0));
    } else if (event.key === 'Enter' && isOpen && results[activeIndex]) {
      event.preventDefault();
      pick(results[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (patient) {
    return (
      <div className="field field-wide">
        <span className="label">Patient</span>
        <div className="selected-card">
          <Avatar name={patient.fullName} />
          <div>
            <strong>{patient.fullName}</strong>
            <div className="subline">
              NIC {patient.nic} · {patient.phone}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm selected-change"
            onClick={() => {
              onSelect(null);
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus());
            }}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  const messageId = 'field-patient-message';
  const activeId = isOpen && results[activeIndex] ? `${listId}-${activeIndex}` : undefined;

  return (
    <div className={`field field-wide${error ? ' field-invalid' : ''}`} ref={rootRef}>
      <label htmlFor="field-patient">Patient</label>
      <div className="combobox">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            id="field-patient"
            className="control"
            type="text"
            role="combobox"
            autoComplete="off"
            placeholder="Type a name, NIC or phone number"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            aria-invalid={Boolean(error)}
            aria-describedby={messageId}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setActiveIndex(0);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {isOpen && (
          <ul className="combobox-list" id={listId} role="listbox" aria-label="Matching patients">
            {loadError && <li className="combobox-note">{loadError.message}</li>}
            {!loadError && !data && <li className="combobox-note">Searching...</li>}
            {data && results.length === 0 && (
              <li className="combobox-note">{query ? `No patients match "${query}".` : 'No patients registered yet.'}</li>
            )}
            {results.map((p, index) => (
              <li
                key={p._id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`combobox-option${index === activeIndex ? ' is-active' : ''}`}
                onPointerDown={(event) => event.preventDefault()}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => pick(p)}
              >
                <Avatar name={p.fullName} />
                <span>
                  <strong>{p.fullName}</strong>
                  <span className="subline">
                    NIC {p.nic} · {p.phone}
                  </span>
                </span>
              </li>
            ))}
            {data && data.total > results.length && (
              <li className="combobox-note">
                Showing {results.length} of {data.total}. Keep typing to narrow the list.
              </li>
            )}
            {isLoading && data && <li className="combobox-note">Updating...</li>}
          </ul>
        )}
      </div>
      {error ? (
        <p id={messageId} className="field-error">
          <Icon name="alert" size={14} />
          {error}
        </p>
      ) : (
        <p id={messageId} className="field-hint">
          New patient? <Link to="/patients/new">Register them first</Link>.
        </p>
      )}
    </div>
  );
}
