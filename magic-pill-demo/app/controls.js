"use client";
import { useId } from "react";

/** Radio buttons styled as pills. */
export function ChipGroup({ legend, name, options, value, onChange }) {
  return (
    <fieldset className="chips">
      <legend>{legend}</legend>
      <div className="chip-list">
        {options.map((option) => (
          <label key={option.value} className="chip">
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TextField({ label, value, onChange, hint, multiline = false }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const Field = multiline ? "textarea" : "input";
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Field
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? hintId : undefined}
        rows={multiline ? 4 : undefined}
      />
      {hint && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
    </div>
  );
}
