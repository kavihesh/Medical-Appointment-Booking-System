import { useEffect, useState } from 'react';
import { LIMITS } from '@mab/shared';
import { SEARCH_DEBOUNCE_MS } from '../config.js';
import { Icon } from './Icon.jsx';

/** Search box that reports its value after the user pauses typing. */
export function SearchInput({ id, label, value, onSearch, placeholder }) {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (text.trim() === value) return undefined;
    const timer = setTimeout(() => onSearch(text.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, value, onSearch]);

  return (
    <div className="field field-search">
      <label htmlFor={id}>{label}</label>
      <div className="search-box">
        <Icon name="search" size={16} />
        <input
          id={id}
          type="search"
          className="control"
          value={text}
          placeholder={placeholder}
          maxLength={LIMITS.SEARCH_MAX}
          autoComplete="off"
          onChange={(event) => setText(event.target.value)}
        />
      </div>
    </div>
  );
}
