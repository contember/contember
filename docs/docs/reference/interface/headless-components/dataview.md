---
title: DataView
---

This guide introduces the **headless DataView** API from `@contember/react-dataview`. It is intended for React developers who want full control over the UI of their data listings (tables, grids, tile views, etc.) while benefiting from robust built-in logic for filtering, sorting, pagination, highlighting rows, exporting, and more.

Unlike a “batteries-included” component, the headless DataView **does not impose any specific UI**. Instead, it provides reusable primitives (components, hooks, utilities) that you can assemble into **any** design—table, list, tiles, or a custom layout. If you prefer a ready-to-use, styled grid component, see the [**UI DataGrid**](../ui-components/datagrid.md) documentation instead.


## Core Concepts

1. **DataView State**  
   Each “data view” consists of:

- **Filtering** state (which conditions are applied to the data)
- **Sorting** state (the order of items)
- **Paging** state (current page, items per page)
- **Selection & Layout** state (e.g., which layout to show or which columns to hide)

2. **Decoupled Logic & UI**  
   DataView handles data querying, filter condition creation, and pagination. **You** supply the markup (tables, inputs, buttons, etc.). The library’s components and hooks help you connect these UI elements to the underlying state.

3. **Storage & Persistence**  
   You can store DataView state in the URL, session storage, local storage, or a custom storage. This makes it easy to preserve user settings across page refreshes or navigations.


## Basic Example

Below is a minimal usage example illustrating a custom table with pagination and a text filter.

```tsx
import { DataView, DataViewFilterScope, DataViewTextFilterInput, DataViewChangePageTrigger, DataViewEachRow, DataViewLoaderState } from '@contember/react-dataview'
import { Field, HasMany } from '@contember/interface'

export default () => <>
  <DataView entities="Article" initialItemsPerPage={5}>
    {/* Text filter (stored under a special key "_query") */}
    <DataViewFilterScope name="_query">
      <DataViewTextFilterInput debounceMs={300}>
        <input placeholder="Search..." />
      </DataViewTextFilterInput>
    </DataViewFilterScope>

    {/* Loading states */}
    <DataViewLoaderState initial refreshing>
      <p>Loading...</p>
    </DataViewLoaderState>
      
    <DataViewLoaderState failed>
      <p>Failed to load data</p>
    </DataViewLoaderState>
      
    <DataViewLoaderState loaded>
      <table>
        <tr>
          <th>Title</th>
          <th>Tags</th>
        </tr>
        <DataViewEachRow>
          <tr>
            <td>
              <Field field="title" />
            </td>
            <td>
              <HasMany field="tags">
                <Field field="name" />{', '}
              </HasMany>
            </td>
          </tr>
        </DataViewEachRow>
      </table>
    </DataViewLoaderState>

    {/* Pagination controls */}
    <div style={{ marginTop: '1rem' }}>
      <DataViewChangePageTrigger page="previous">
        <button>Previous</button>
      </DataViewChangePageTrigger>
      <DataViewChangePageTrigger page="next">
        <button>Next</button>
      </DataViewChangePageTrigger>
    </div>
  </DataView>
</>
```



- **`<DataView>`** wraps the entire data listing.
- **`<DataViewFilterScope>`** scoping a filter to a particular name (in this case `_query`).
- **`<DataViewTextFilterInput>`** wires an input to the text-filter state.
- **`<DataViewLoaderState>`** conditionally renders content based on loading state (`initial`, `loaded`, `refreshing`, `failed`).
- **`<DataViewEachRow>`** repeats its children for each entity item in the result.
- **`<DataViewChangePageTrigger>`** navigates between pages.

## DataView and ControlledDataView

### `<DataView>`

The most common approach is to use `<DataView>` directly, which automatically manages:

- Internal state for sorting, filtering, paging, etc.
- Merging that state with an underlying entity list (`entities="Post"` or similar).
- Optionally storing/retrieving this state from URL, localStorage, etc.

```tsx
<DataView
  entities="Article"
  initialFilters={{}}
  filteringStateStorage="url"
  initialSorting={{ publishedAt: 'desc' }}
  sortingStateStorage="local"
  initialItemsPerPage={10}
  currentPageStateStorage="session"
  /* ...etc. */
>
  {/* ...child components... */}
</DataView>
```

#### DataView Props

| Prop            | Type                   | Description                                                 |
|-----------------------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `entities`         | `string \| QualifiedEntityList`      | **Required.** The Contember entity list query, e.g. `"Article"` or an object describing a nested list.   |
| `children`         | `ReactNode`                 | The actual UI you render—filters, table rows, triggers, etc.                        |
| `queryField`         | `string \| string[]`           | Shortcut for using a text filter across multiple fields.                           |
| `initialFilters`       | `Record<string, any> \| (stored => … )`  | Initial filter values (per filter name). You can also pass a function that merges with stored defaults.  |
| `initialSorting`       | `Record<string, 'asc' \| 'desc'>`    | Initial sorting directions per field name.                                 |
| `initialItemsPerPage`    | `number \| null`             | Default items-per-page. If `null`, no limit is applied. Defaults to `50`.                  |
| `initialSelection`     | `DataViewSelectionValues \| (stored => …)` | Default selection state for layout or column visibility (optional).                    |
| `filterTypes`        | `DataViewFilterHandlerRegistry`      | A registry of custom or built-in filter handlers.                             |
| `filteringStateStorage`  | `'url' \| 'session' \| 'local' \| null \| CustomStorage` | Where to store filter state. Defaults to `null` (in-memory only).                     |
| `sortingStateStorage`    | `'url' \| 'session' \| 'local' \| null \| CustomStorage` | Where to store sorting state.                                       |
| `currentPageStateStorage`  | `'url' \| 'session' \| 'local' \| null \| CustomStorage` | Where to store the current page index.                                   |
| `pagingSettingsStorage`  | `'url' \| 'session' \| 'local' \| null \| CustomStorage` | Where to store items-per-page.                                       |
| `selectionStateStorage`  | `'url' \| 'session' \| 'local' \| null \| CustomStorage` | Where to store selection/visibility state.                                 |
| `onSelectHighlighted`    | `(entity: EntityAccessor) => void`     | Callback when the highlighted entity changes (e.g., on keyboard nav).                    |
| `dataViewKey`        | `string`                 | Unique key identifying this DataView instance. If omitted, derived from `entities`. Used for state storage.|

### `<ControlledDataView>`

`<ControlledDataView>` is an even lower-level API for advanced scenarios.

```tsx
const { state, methods, info } = useControlledDataView({
  // same props as in DataView
})

// here you can access or intercept state / methods of the dataview 

const dataview = <ControlledDataView state={state} methods={methods} info={info} />
```

Most developers don’t need `<ControlledDataView>`—use `<DataView>` unless you must orchestrate your own state.

## State & Methods

Under the hood, `<DataView>` merges and exposes state for **Filtering, Sorting, Paging**, and optional **Selection**. You typically don’t manage these states directly; rather, you use:

- **Filter Components** (e.g., `<DataViewTextFilter>`) or hooks (`useDataViewFilter`)
- **Trigger Components** (e.g., `<DataViewChangePageTrigger>`) or methods (`useDataViewPagingMethods`)

### Filtering

DataView supports multiple filter types out of the box (text, boolean, enum, date, number, relation, etc.). You can also write custom filters using `createFilterHandler`.

**Key Points**:

- Each filter is identified by a `name`.
- You apply filter logic via a “filter handler” that translates user input (e.g., text query) into a GraphQL condition.
- The library merges all active filters into one final “where” condition in the underlying query.

### Sorting

You can define initial sorting or adjust it via:

- `<DataViewSortingTrigger>`
- Hooks like `useDataViewSortingMethods`

Sorting state is stored and can be multi-sorted if you hold Ctrl/Meta while clicking triggers (optional behavior).

### Paging

Supports classic numbered pages:

- `<DataViewChangePageTrigger>` for “next,” “previous,” “first,” “last,” or a specific page index.
- `<DataViewSetItemsPerPageTrigger>` to let the user pick how many items appear per page.

### Selection & Layout

Optionally, DataView can track a “layout” mode or column visibility. This is accessed/updated via:

- `useDataViewSelectionMethods`
- `<DataViewLayout>` and `<DataViewElement>` (to show/hide named columns/fields)
- `<DataViewLayoutTrigger>` or `<DataViewVisibilityTrigger>`

These are purely optional if you want a single, fixed layout.

## Data rendering component

### `DataViewEachRow`

Repeats its children for each item in the current dataset:

```tsx
<DataViewEachRow>
  <div>{/* ... row markup ... */}</div>
</DataViewEachRow>
```

### `DataViewEmpty` and `DataViewNonEmpty`

Conditionally render based on whether the dataset is empty or not:

```tsx
<DataViewEmpty>
  <p>No items found</p>
</DataViewEmpty>
<DataViewNonEmpty>
  {/* If there's at least one item */}
</DataViewNonEmpty>
```

### `DataViewLoaderState`

Renders children only if the loader is in a particular state (`initial`, `loaded`, `refreshing`, `failed`):

```tsx
<DataViewLoaderState loaded>
  <p>Data is fully loaded now.</p>
</DataViewLoaderState>
```

## Filter Components

The library provides **composable** filter components that set or modify a filter value within the DataView. Here are the main ones. Each must be used **inside** a `<DataView>` (or `<ControlledDataView>`) so it can access and update the filter state.

> **Note**: Most of these follow a pattern: a parent filter component `<DataViewTextFilter>` (which sets up the context) plus smaller child inputs or triggers that manipulate the filter state.

### `DataViewTextFilter`

Headless “text filter” provider. Typically you wrap its children (like `<DataViewTextFilterInput>`) inside:

```tsx
<DataViewTextFilter field="title" name="titleFilter">
  {/* children here */}
</DataViewTextFilter>
```

| Prop  | Type                  | Description                            |
|---------|-----------------------------------------|------------------------------------------------------------------|
| `field` | `string`                | The underlying entity field name (e.g. `"title"`)        |
| `name`  | `string` (optional)           | Unique filter name. Defaults to the field name if not provided.  |
| `children` | `ReactNode`              | Filter UI, e.g. inputs or reset triggers.            |

Within it, you might use:

#### `DataViewTextFilterInput`

A single child input that manipulates the text query.

```tsx
<DataViewTextFilterInput debounceMs={300}>
  <input type="text" placeholder="Search..." />
</DataViewTextFilterInput>
```

| Prop    | Type     | Description                         |
|-------------|-----------|-----------------------------------------------------------|
| `name`    | `string`? | Filter name, infers from the nearest `<DataViewTextFilter>` if omitted. |
| `debounceMs`| `number`? | Debounce user typing before applying the filter. Defaults to `500`. |
| `children`  | `ReactElement` | The actual `<input>` element.                  |

#### `DataViewTextFilterResetTrigger`

A button that resets this text filter to an empty query:

```tsx
<DataViewTextFilterResetTrigger>
  <button>Reset</button>
</DataViewTextFilterResetTrigger>
```

---

### Other Built-In Filters

- **`DataViewBooleanFilter`** – For true/false fields.
- **`DataViewEnumFilter`** – For enum fields (can include/exclude certain enum values).
- **`DataViewNumberFilter`** – For numeric fields (range inputs).
- **`DataViewDateFilter`** – For date ranges (start/end).
- **`DataViewHasOneFilter`, `DataViewHasManyFilter`** – For relation fields (include/exclude certain entity IDs).
- **`DataViewIsDefinedFilter`** – Filters items where a field is (not) null.

Each has a similar signature:

```tsx
<DataViewBooleanFilter field="published" name="publishedFilter">
  {/* Possibly triggers, checkboxes, or custom UI */}
</DataViewBooleanFilter>
```

Then use the relevant triggers or inputs inside (e.g., `<DataViewBooleanFilterTrigger>`).

## Trigger Components

Triggers are interactive elements (usually buttons) that update the DataView state (e.g., navigate pages, toggle filters, set sort order).

### `DataViewChangePageTrigger`

Navigates to a specified page:

```tsx
<DataViewChangePageTrigger page="next">
  <button>Next</button>
</DataViewChangePageTrigger>
```

| Prop    | Type                 | Description                                 |
|-----------|------------------------------------|-----------------------------------------------------------------------------|
| `page`  | `number \| 'first' \| 'last' \| 'next' \| 'previous'` | Target page index or a keyword.                       |
| `children`| `ReactNode`            | Usually a `<button>`.                             |

### `DataViewSortingTrigger`

Cycles or sets the sorting for a column:

```tsx
<DataViewSortingTrigger field="publishedAt" action="next">
  <button>Sort by Date</button>
</DataViewSortingTrigger>
```

| Prop  | Type                        | Description                                  |
|---------|---------------------------------------------------|------------------------------------------------------------------------------|
| `field` | `string`                      | Column/field name to sort by.                        |
| `action`| `'asc' \| 'desc' \| 'clear' \| 'toggleAsc' \| 'toggleDesc' \| 'next'` (default: `'next'`) | Defines how the click changes the sorting.                   |
| `children` | `ReactElement`                 | Typically a button element.                          |

### `DataViewSetItemsPerPageTrigger`

Changes items-per-page setting:

```tsx
<DataViewSetItemsPerPageTrigger value={20}>
  <button>20 per page</button>
</DataViewSetItemsPerPageTrigger>
```

### Filter-Specific Triggers

- `DataViewBooleanFilterTrigger`
- `DataViewEnumFilterTrigger`
- `DataViewNullFilterTrigger`
- `DataViewRelationFilterTrigger`

These allow you to **toggle** or **set** a particular filter’s state (e.g., “include `true`,” “exclude nulls,” etc.). You typically nest these inside the matching filter component or reference its `name`.


## Selection components

### `DataViewElement`

Allows toggling visibility of sub-sections by name (part of the “selection” concept):

```tsx
<DataViewElement name="tags" fallback>
  {/* Show tags if not hidden */}
</DataViewElement>
```

---

## Hooks

### `useDataView(args)`

A low-level hook that creates a DataView state and methods you can feed into `<ControlledDataView>`. Usually `<DataView>` handles this for you automatically.

### `useDataViewFilteringState`, `useDataViewFilteringMethods`

Access or manipulate the current filtering state. E.g.:

```ts
const filteringState = useDataViewFilteringState()
const methods = useDataViewFilteringMethods()

// E.g. methods.setFilter('myFilterKey', { query: 'test' })
```

### `useDataViewSortingState`, `useDataViewSortingMethods`

Similar, but for sorting.

### `useDataViewPagingState`, `useDataViewPagingMethods`

Similar, but for paging.

### `useDataViewSelectionState`, `useDataViewSelectionMethods`

If you use layout/visibility selection, these manage that.

### Various Filter-Specific Hooks

- `useDataViewTextFilterInput`, `useDataViewNumberFilterInput`, etc. for building custom filter UIs.

---

## Exporting Data

### `DataViewExportTrigger`

Allows you to download all matching data (beyond the current page). By default, it uses `CsvExportFactory`:

```tsx
<DataViewExportTrigger baseName="articles-export">
  <button>Export CSV</button>
</DataViewExportTrigger>
```

| Prop      | Type    | Description                        |
|---------------|------------|----------------------------------------------------------|
| `fields`    | `ReactNode` | Fields to include in export (if not provided, all).   |
| `baseName`  | `string`  | Filename base (defaults to entity + date).        |
| `exportFactory` | `ExportFactory`? | For customizing the exported format.        |

---

## Advanced Features

### Infinite Loading

You can enable an “infinite scroll” pattern:

- `<DataViewInfiniteLoadProvider>` wraps your content.
- Use `<DataViewInfiniteLoadTrigger>` or `<DataViewInfiniteLoadScrollObserver>` to load more data upon scrolling or a button click.

```tsx
<DataViewInfiniteLoadProvider>
  <DataViewInfiniteLoadEachRow>
    {/* Repeats rows, extends automatically */}
  </DataViewInfiniteLoadEachRow>
  <DataViewInfiniteLoadTrigger>
    <button>Load more</button>
  </DataViewInfiniteLoadTrigger>
</DataViewInfiniteLoadProvider>
```

### Keyboard Handling & Highlighting

- **`<DataViewHighlightRow>`**: highlight one row at a time, possibly navigating with arrow keys.
- **`<DataViewKeyboardEventHandler>`**: captures keyboard events for row selection or other shortcuts.

---

## Full API Reference

Below is a quick index of the main exports from `@contember/react-dataview`. Each of these has been touched on above:

- **Root Components**
  - [`<DataView>`](#dataview-and-controlleddataview)
  - [`<ControlledDataView>`](#dataview-and-controlleddataview)

- **Utilities & Factories**
  - `createBooleanFilter`, `createDateFilter`, `createEnumFilter`, `createNumberFilter`, `createTextFilter`, etc.
  - `CsvExportFactory`

- **Filter Components**
  - `DataViewTextFilter`, `DataViewTextFilterInput`, `DataViewTextFilterResetTrigger`,
  - `DataViewBooleanFilter`, `DataViewBooleanFilterTrigger`,
  - `DataViewEnumFilter`, `DataViewEnumFilterTrigger`,
  - `DataViewNumberFilter`, `DataViewNumberFilterInput`, `DataViewNumberFilterResetTrigger`,
  - `DataViewDateFilter`, `DataViewDateFilterInput`, `DataViewDateFilterResetTrigger`,
  - `DataViewHasOneFilter`, `DataViewHasManyFilter`,
  - `DataViewIsDefinedFilter`,
  - `DataViewFilterScope` (for scoping filter names).

- **Trigger Components**
  - `DataViewChangePageTrigger`, `DataViewSetItemsPerPageTrigger`,
  - `DataViewSortingTrigger`,
  - `DataViewNullFilterTrigger`,
  - `DataViewRelationFilterTrigger`.

- **Layout/Visibility Components**
  - `DataViewLayout`, `DataViewLayoutTrigger`,
  - `DataViewElement`, `DataViewVisibilityTrigger`.

- **Miscellaneous UI**
  - `DataViewLoaderState`, `DataViewEmpty`, `DataViewNonEmpty`,
  - `DataViewEachRow`, `DataViewHighlightRow`,
  - `DataViewInfiniteLoadProvider`, `DataViewInfiniteLoadEachRow`, `DataViewInfiniteLoadTrigger`, `DataViewInfiniteLoadScrollObserver`,
  - `DataViewExportTrigger`.

- **Hooks**
  - `useDataView`, `useDataViewFilteringState`, `useDataViewFilteringMethods`,
  - `useDataViewSortingState`, `useDataViewSortingMethods`,
  - `useDataViewPagingState`, `useDataViewPagingMethods`,
  - `useDataViewSelectionState`, `useDataViewSelectionMethods`,
  - `useDataViewTextFilterInput`, `useDataViewNumberFilterInput`, etc.

Use these building blocks to implement exactly the UI and behavior you need. For a fully-featured, pre-styled data grid, see our **UI DataGrid** documentation.

---

## Conclusion

**DataView** provides all the underlying functionality for listing, filtering, sorting, paging, and highlighting data—while letting you implement your own custom UI in React.

- If you want a ready-to-use UI layer, check out our **UI Data Grid** package.
- If you need ultimate control or a unique design, use these headless primitives to build your own layouts.
