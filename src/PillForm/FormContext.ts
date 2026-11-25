"use client"
import { createContext } from "react";

export type FieldLayout = "stacked" | "inline";
export type FormErrors = "inline" | "native";

export interface FormContextValue {
  /** The layout of the text fields, unless they set their own. */
  layout?: FieldLayout;
  /** Where the browser's validation messages show. */
  errors: FormErrors;
}

export const FormContext = createContext<FormContextValue>({ errors: "inline" });
