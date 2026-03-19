# react-select

Select/multi-select components for choosing related entities in forms.

## Core Components

- `Select` — single entity select with toggle/select/unselect actions
- `MultiSelect`, `SortableMultiSelect` — multi-entity selection with optional drag sorting
- `SelectDataView` — integration with react-dataview for large datasets
- `SelectOption`, `SelectPlaceholder`, `SelectNewItem`, `SelectEachItem` — UI elements

## Key Contexts

- `SelectCurrentEntitiesContext` — currently selected entities
- `SelectIsSelectedContext` — selection check predicate
- `SelectHandleSelectContext` — select/unselect/toggle handler

## Binding Integration

Uses `Component` wrapper from react-binding with `HasOne`/`HasMany` relations. Manages entity connections/disconnections at field level. Depends on `@contember/react-dataview` for option display and `@contember/react-repeater` for list handling.
