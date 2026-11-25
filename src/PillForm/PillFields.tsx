// No "use client": it holds no state
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

export interface PillFieldsProps extends ComponentPropsWithoutRef<"fieldset"> {
  /** What they're about. */
  label?: ReactNode;
  /** Two fields side by side, where there's room. */
  columns?: 1 | 2;
  /** A line between one field and the next. */
  separators?: boolean;
}

/** Fields that go together. */
export const PillFields = forwardRef<HTMLFieldSetElement, PillFieldsProps>(function PillFields(
  { label, columns = 1, separators = false, children, ...rest },
  ref,
) {
  return (
    <fieldset
      role={label ? undefined : "none"}
      {...rest}
      ref={ref}
      data-mp="fields"
      data-columns={columns}
      data-separators={separators ? "" : undefined}
    >
      {label && <legend data-mp="fields-label">{label}</legend>}
      <div>{children}</div>
    </fieldset>
  );
});
