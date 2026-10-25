import { toOptions } from '../lib/options.jsx';

/** A labelled <select> for list filters and sorting. `options` are values or { value, label } pairs. */
export function SelectFilter({ id, label, value, onChange, options, allLabel }) {
  return (
    <div className="field field-filter">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="control control-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {allLabel && <option value="">{allLabel}</option>}
        {toOptions(options)}
      </select>
    </div>
  );
}
