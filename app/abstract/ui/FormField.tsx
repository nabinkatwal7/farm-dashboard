"use client";

import { TextInput, Select, Textarea, NumberInput } from "@mantine/core";
import React from "react";

type BaseProps = {
  label: React.ReactNode;
  error?: string | null;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
};

type InputFieldProps = BaseProps & {
  as?: "input";
  placeholder?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  min?: string;
  max?: string;
  step?: string;
};

type SelectFieldProps = BaseProps & {
  as: "select";
  children: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

type TextareaFieldProps = BaseProps & {
  as: "textarea";
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

type Props = InputFieldProps | SelectFieldProps | TextareaFieldProps;

export default function FormField(props: Props) {
  const { label, error, required, helperText, disabled, id, name, as, ...rest } = props;
  const fieldId =
    id ??
    name ??
    (typeof label === "string"
      ? label.toLowerCase().replace(/\s+/g, "-")
      : "field");

  if (as === "select") {
    const { children, value, onChange } = rest as SelectFieldProps;
    const data = (React.Children.toArray(children) as React.ReactElement<{ value?: string; children?: string }>[])
      .filter((child) => child.type === "option")
      .map((child) => ({
        value: child.props.value ?? "",
        label: String(child.props.children ?? ""),
      }));
    return (
      <Select
        label={label}
        description={helperText}
        error={error}
        required={required}
        id={fieldId}
        name={name}
        data={data}
        value={value}
        disabled={disabled}
        onChange={(v) => onChange?.({ target: { value: v ?? "" } } as React.ChangeEvent<HTMLSelectElement>)}
      />
    );
  }

  if (as === "textarea") {
    const { placeholder, rows, value, onChange } = rest as TextareaFieldProps;
    return (
      <Textarea
        label={label}
        description={helperText}
        error={error}
        required={required}
        id={fieldId}
        name={name}
        placeholder={placeholder}
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e as unknown as React.ChangeEvent<HTMLTextAreaElement>)}
      />
    );
  }

  const { placeholder, type, value, onChange, readOnly, min, max, step } = rest as InputFieldProps;

  if (type === "number") {
    return (
      <NumberInput
        label={label}
        description={helperText}
        error={error}
        required={required}
        id={fieldId}
        name={name}
        placeholder={placeholder}
        value={
          value === "" || value === undefined || value === null
            ? ""
            : typeof value === "string"
              ? parseFloat(value)
              : (value as number)
        }
        onChange={(v) => onChange?.({ target: { value: String(v ?? "") } } as React.ChangeEvent<HTMLInputElement>)}
        readOnly={readOnly}
        disabled={disabled}
        min={min ? parseFloat(min) : undefined}
        max={max ? parseFloat(max) : undefined}
        step={step ? parseFloat(step) : undefined}
      />
    );
  }

  return (
    <TextInput
      label={label}
      description={helperText}
      error={error}
      required={required}
      id={fieldId}
      name={name}
      placeholder={placeholder}
      type={type}
      value={value}
      disabled={disabled}
      onChange={onChange}
      readOnly={readOnly}
    />
  );
}
