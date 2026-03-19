# react-form

Low-level form components for creating HTML inputs bound to entity fields.

## Core Components

- `FormInput` — slot-based input with value formatting/parsing via `FormInputHandler`
- `FormLabel` — accessible label component
- `FormCheckbox`, `FormRadioInput` — specialized inputs
- `FormFieldStateProvider` — context for field state (errors, dirty, validation)
- `FormFieldScope`, `FormHasOneRelationScope`, `FormHasManyRelationScope` — scope providers

## FormInputHandler

Type-specific parsing/formatting with `parseValue`, `formatValue`, and `defaultInputProps` for column types: String, Integer, Double, Date, DateTime, Time, Bool, Enum.

## Binding Integration

Uses `useField()` and `useEntity()` from react-binding. `FormInput` reads/writes via `FieldAccessor`, accesses schema info for type-aware parsing. Validation handled via `useFormInputValidationHandler` (blur/focus).
