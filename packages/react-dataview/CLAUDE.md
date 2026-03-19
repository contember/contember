# react-dataview

Data table/grid library with filtering, sorting, paging, selection, and CSV export.

## Core Components

- `DataView` / `ControlledDataView` — main data display with state management (10+ nested contexts for sorting, paging, filtering, selection)
- `DataViewEachRow` — row renderer
- `DataViewEmpty` / `DataViewNonEmpty` — conditional rendering
- `DataViewExportTrigger` / `DataViewReloadTrigger` — action triggers

## Filtering

Extensible filter type registry with built-in handlers:
- `DataViewFilteringText`, `DataViewFilteringNumber`, `DataViewFilteringDate`
- `DataViewFilteringBoolean`, `DataViewFilteringEnum`, `DataViewFilteringRelation`

## Key Hooks

- `useDataView()` — returns `{ state, info, methods }` for manual control
- `useDataViewFilter()` — generic filter hook
- `useDataViewElements()` — get displayed entities
- `useDataViewFetchAllData()` — fetch all data without paging
- `useDataViewTargetFieldSchema()` — schema introspection

## Binding Integration

Uses `useEnvironment()` for schema access, `QueryLanguage.desugarQualifiedEntityList()` for entity resolution, `useEntityListSubTreeLoader()` for relation data loading. Extends environment with selection extension via `EnvironmentMiddleware`.
