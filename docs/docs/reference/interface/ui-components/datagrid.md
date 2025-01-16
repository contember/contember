---
title: Datagrid
---


This covers the **UI Data Grid**—a higher-level library built on top of the headless Data View system. It provides **pre-built**, **Tailwind + Shadcn**-based components (columns, filters, layouts, pagination, etc.) so you can **quickly spin up** a feature-rich data listing interface without having to build all the UI manually.

> **Note**  
> If you want full control over styling, layout, or filter logic, check out our [Headless Data View documentation](#) to build a custom UI. Otherwise, this UI Data Grid is a great out-of-the-box solution.
  

## **1. Introduction**

### **1.1 What Is the UI Data Grid?**

The UI Data Grid is a collection of **ready-made** React components that:

- Display data in **table** form (or alternate layouts).
- Provide **sorting** (by columns), **filtering** (text, enum, boolean, date, etc.), and **pagination**.
- Include a **toolbar** with search, layout toggles, and other features.
- Integrate seamlessly with the [Contember interface binding](../data-binding/overview.md) to render fields and relations.

Internally, it **re-uses** the logic from `@contember/react-dataview` (filters, sorting, paging, etc.), but **wraps** it in a **pre-styled** set of components that follow standard data grid patterns.

### **1.2 When to Use It vs. Headless Data View**

- **Choose the UI Data Grid** if you want **fast, conventional** table-based UIs with minimal custom code.
- **Choose Headless** if you have **unconventional layouts** (like highly custom UIs, advanced card/tile patterns, or a unique design system not easily adapted from the shipped components).

  

## **2. Quick Start**

Here’s the shortest route to a functional grid: `<DefaultDataGrid>`.

### **2.1 Minimal Example**

```tsx
import { Binding } from '@contember/interface'
import { DefaultDataGrid, DataGridTextColumn, DataGridEnumColumn } from '~/lib/datagrid'
import { Button } from '~/lib/ui/button'

export default () => <>
  <Binding>
    <DefaultDataGrid entities="GridArticle">
        {/* A column for textual data */}
      <DataGridTextColumn field="title" header="Title" />

      {/* Another column for an enum field */}
      <DataGridEnumColumn field="state" header="State" />
    </DefaultDataGrid>
  </Binding>
</>
```

By default, `<DefaultDataGrid>` includes:

- A **toolbar** (with a simple query filter, layout switcher, visible columns toggle, export, reload).
- A **loader** that automatically shows loading states.
- A **table** layout with your listed columns.
- A **pagination** control at the bottom.

You get **sorting** by clicking the column headers, basic searching, and the rest of the standard features with minimal setup.

  

## **3. Core Components**

Depending on how much customization you need, you can either keep `<DefaultDataGrid>` or build your own assembly using `<DataGrid>` plus separate `<DataGridToolbar>`, `<DataGridLoader>`, `<DataGridTable>`, etc.

### **3.1 DataGrid vs. DefaultDataGrid**

1. **`<DefaultDataGrid>`**

- One-stop shop. It automatically includes a toolbar, loader, table, and pagination in a standard layout.
- Props:
  - Same as `DataViewProps` (e.g., `entities`, `initialSorting`, `filteringStateStorage`), plus:
    - `toolbar?: ReactNode` — optional override or addition to the default toolbar contents.
- Example usage is in the [Quick Start](#21-minimal-example).

2. **`<DataGrid>`**

- Lower-level version. You manually place the `<DataGridToolbar>`, `<DataGridLoader>`, `<DataGridTable>`, `<DataGridPagination>`, etc. in whichever arrangement you desire.
- Great for **partial** or **more custom** UIs.

  

### **3.2 DataGridToolbar**

- `<DataGridToolbar>` is a container for filter inputs, layout switchers, an export button, etc.
- By default, `<DefaultDataGrid>` provides one. If you use `<DataGrid>` you must supply your own `<DataGridToolbar>`.

In the toolbar, you can place:

- `<DataGridQueryFilter>` for a basic “search all text fields” approach.
- Any additional filters (e.g., `<DataGridTextFilter field="title" />`).
- `<DataGridLayoutSwitcher>` (built-in component for switching between table/tiles).
- `<DataGridAutoExport>` or `<DataGridExportTrigger>` for exports.
- A reload button (depending on your preference).

Example with `<DataGrid>`:

```tsx
<DataGrid entities="GridArticle">
    <DataGridToolbar>
        <DataGridQueryFilter label="Search" />
        {/* You can add more filters or custom buttons here */}
    </DataGridToolbar>

    <DataGridLoader>
        <DataGridTable>
            <DataGridTextColumn field="title" header="Title" />
            <DataGridEnumColumn field="state" header="State" />
        </DataGridTable>
    </DataGridLoader>

    <DataGridPagination />
</DataGrid>
```

  

### **3.3 DataGridLoader**

- `<DataGridLoader>` handles showing different **loading states** (initial, refreshing, failed, loaded).
- Typically wraps `<DataGridTable>` or `<DataGridTiles>`.
- If you prefer custom loading messages or no-results messages, you can override `<DataGridNoResults>` or integrate your own.

  

### **3.4 DataGridPagination**

- `<DataGridPagination>` is a ready-made component for page navigation. It includes previous/next buttons, optional page number links, and so forth.
- `<DataGridPerPageSelector>` can also appear to let users pick a page size (like 10, 20, 50).

  

### **3.5 DataGridTable vs. DataGridTiles**

- `<DataGridTable>`: A conventional HTML table layout. Each column you add (like `<DataGridTextColumn>`) becomes a `<th>` in the header and each row uses `<td>` in the body.
- `<DataGridTiles>`: A simple “tiling” layout, more like cards or grid items, for an alternative to the classic table.
- You can also define custom `<DataViewLayout>` blocks inside `<DataGridLoader>` if you want multiple layout styles that the user can toggle.

  

## **4. Columns and Filters**

### **4.1 Built-in Column Types**

All the following “column” components are designed to work **inside** `<DataGridTable>`. They provide:

1. A **header** (that can show sorting controls).
2. A **filter** (optional).
3. A default or custom **formatter** for cell content.

#### **4.1.1 `<DataGridTextColumn>`**

- Props:
  - `field: string`
  - `header?: ReactNode` (defaults to a label derived from `field` if not provided)
  - `format?: (value: string | null) => ReactNode` (custom formatting)
  - `children?: ReactNode` (completely replace the default cell content)
  - `filter?: ReactNode` (replace the built-in text filter with your own)

Internally, `<DataGridTextColumn>` uses a **text filter** if you allow filtering on that column. Sorting is automatic if you click the header (unless you configure otherwise).

#### **4.1.2 `<DataGridNumberColumn>`**

Similar to the text column but geared toward numeric fields:

- `format?: (value: number | null) => ReactNode`
- If not provided, it just renders the raw value.

#### **4.1.3 `<DataGridBooleanColumn>`**

Displays a boolean (`true`/`false`), often with a check icon or custom label:

- `format?: (value: boolean | null) => ReactNode`

#### **4.1.4 `<DataGridEnumColumn>`**

Displays an enum field with optional “include/exclude” filter tooltip:

- `options?: Record<string, ReactNode>` for custom labeling.
- Example: `{ draft: 'Draft', published: 'Published' }`.
- Clicking the cell triggers a tooltip with filtering actions by default (unless overridden).

#### **4.1.5 `<DataGridDateColumn>` and `<DataGridDateTimeColumn>`**

- They parse the field as a date or datetime and format accordingly (e.g., `YYYY-MM-DD` or including time).
- You can override with `format` prop if needed.

#### **4.1.6 `<DataGridHasOneColumn>` and `<DataGridHasManyColumn>`**

These are for **related entities**. For example:

```tsx
<DataGridHasOneColumn header="Author" field="author">
  <Field field="name" />
</DataGridHasOneColumn>
```

Inside, you can place standard binding components.  
They also provide tooltips for including/excluding specific related entity IDs in the filter.

#### **4.1.7 `<DataGridIsDefinedColumn>`**

Checks whether a field is “defined” (non-null). Renders a check icon or a cross icon, or whatever your custom format is. Also includes an “is defined” filter.

#### **4.1.8 `<DataGridUuidColumn>`**

For displaying UUID fields with optional formatting.

#### **4.1.9 `<DataGridColumn>`**

A **base** column with minimal assumptions. Use it to build your own specialized or custom logic:

```tsx
<DataGridColumn header="Custom" sortingField="customField">
	<YourCustomCell />
</DataGridColumn>
```

Props:

- `header?: ReactNode`
- `sortingField?: string` if you want sorting on this column
- `filter?: ReactNode` if you want to attach a filter
- `cellClassName?`, `headerClassName?` for styling

  

### **4.2 Built-in Filter Components**

When you specify a `field` on these columns, the grid automatically wires in the correct filter (e.g., text, number, enum). But you can also manually add filters in the **toolbar**. Some common ones:

- `<DataGridTextFilter>`: text-based
- `<DataGridEnumFilter>`: for enum fields (inclusion/exclusion)
- `<DataGridBooleanFilter>`: for boolean fields
- `<DataGridDateFilter>`: for date range
- `<DataGridNumberFilter>`: for numeric range
- `<DataGridHasOneFilter>`, `<DataGridHasManyFilter>`: for relations
- `<DataGridIsDefinedFilter>`: for checking null vs. not-null
- `<DataGridUnionTextFilter>`: for searching multiple fields in one input
- `<DataGridQueryFilter>`: a special text filter that targets `_query` by default (the universal text search in DataView)

By default, columns **already** provide a filter if applicable. If you prefer **not** to have a filter in the header or you want a more advanced filter in the toolbar, you can supply `filter={null}` or define your own.

  

### **4.3 Custom or Manual Columns**

If none of the pre-built columns meet your needs—maybe you want a special layout or multiple fields in one cell—use `<DataGridColumn>` or `<DataGridActionColumn>`.

- `<DataGridActionColumn>` is specifically for **buttons** or **menus** (e.g., “Edit” / “Delete” / “Show Detail”), typically pinned at the far left or far right.

Example:

```tsx
<DataGridTable>
  <DataGridActionColumn>
    <Button>Edit</Button>
  </DataGridActionColumn>

  <DataGridTextColumn field="title" />

  <DataGridDateColumn field="publishedAt" />

  {/* ... */}
</DataGridTable>
```

  

## **5. Other Customization Points**

### **5.1 Action Columns**

As mentioned, `<DataGridActionColumn>` is a specialized variant of `<DataGridColumn>` for quick “button area” usage. Often you’ll see something like:

```tsx
<DataGridActionColumn>
  <Button>View</Button>
  <Button variant="destructive">Delete</Button>
</DataGridActionColumn>
```

No sorting or filtering is typically tied to an action column, but you can do so if needed.

  

### **5.2 Layout Switching**

If you want to **toggle** between, say, a **table** layout and a **tiles** layout, you can:

1. Include multiple `<DataViewLayout name="table">` and `<DataViewLayout name="tiles">` blocks inside `<DataGridLoader>`.
2. Use `<DataGridLayoutSwitcher>` in the toolbar to display a row of buttons letting the user pick which layout is active.

For instance:

```tsx
<DataGrid entities="GridArticle">
  <DataGridToolbar>
    <DataGridLayoutSwitcher /> 
  </DataGridToolbar>

  <DataGridLoader>
    <DataGridTable />
    <DataGridTiles />
    {/* or custom <DataViewLayout name="rows"><CustomRowLayout /></DataViewLayout> */}
  </DataGridLoader>

  <DataGridPagination />
</DataGrid>
```

  

### **5.3 Visibility Toggle (Column Hiding)**

Internally, DataGrid uses **DataView’s selection** to store which columns are visible.

- `<DataGridToolbar>` includes a default “columns” button to toggle columns on/off.
- Each `<DataGridColumn>` or derived component typically has a `name` prop used for storing visibility preferences.

If you don’t want this feature, you can remove or override it in the toolbar.

  

### **5.4 Row-Level Expansions**

For advanced layouts, you might want an “expandable row.” The DataGrid doesn’t provide a built-in “accordion row” by default, but you can:

- Use `<DataGridColumn>` that, when clicked, toggles a local state for expansion.
- Render the expanded content in an extra row or inside the same `<td>`.

This is more of a **custom** approach, but DataGrid columns are flexible enough to allow it.

  

## **6. Putting It All Together**

### **6.1 Example: Simple Grid**

```tsx
import { Binding } from '@contember/interface'
import {
    DataGrid,
    DataGridToolbar,
    DataGridQueryFilter,
    DataGridLoader,
    DataGridTable,
    DataGridTextColumn,
    DataGridEnumColumn,
    DataGridPagination,
} from '~/lib/datagrid'

export default function SimpleGrid() {
    return (
        <Binding>
            <DataGrid entities="GridArticle">
                <DataGridToolbar>
                    <DataGridQueryFilter label="Search" />
                </DataGridToolbar>
                <DataGridLoader>
                    <DataGridTable>
                        <DataGridTextColumn header="Title" field="title" />
                        <DataGridEnumColumn header="State" field="state" />
                    </DataGridTable>
                </DataGridLoader>
                <DataGridPagination />
            </DataGrid>
        </Binding>
    )
}
```

- You get a search bar, a table with two columns, and pagination.
- Clicking on a column header toggles sorting, searching by the input filters by the `_query` filter, and pagination is shown at the bottom.

### **6.2 Example: Complex Grid**

A more advanced example might add:

- Additional columns (date, hasOne, hasMany, boolean).
- A more extensive toolbar with multiple filters (enum, date, is-defined).
- A tile layout option.
- A custom action column with a dropdown or a delete button.

See the example in your snippet where you created a **`CustomGridColumn`** with many columns including relationships, tooltips, and an action dropdown. That example demonstrates how you can mix and match these provided components in a single `<DataGrid>`.

  

## **7. Detailed Reference**

### **7.1 DataGrid Core Components**

1. **`<DefaultDataGrid>`**

- Props:
  - `children: ReactNode` (columns)
  - All the typical `DataViewProps` (e.g., `entities`, `initialFilters`, etc.)
  - `toolbar?: ReactNode` (additional/override elements in the top toolbar)

2. **`<DataGrid>`**

- A more manual approach. You place `<DataGridToolbar>`, `<DataGridLoader>`, `<DataGridTable>`, `<DataGridTiles>`, etc. yourself.

3. **`<DataGridToolbar>`**

- Container for filters, layout switchers, export, and reload.

4. **`<DataGridLoader>`**

- Displays loading/failure states automatically for the Data Grid.

5. **`<DataGridTable>`**

- Traditional table layout. Children are **column** components.
- `children: ReactNode` of type `<DataGridColumn>` or derived columns.

6. **`<DataGridTiles>`**

- A simple tile layout.

7. **`<DataGridPagination>`**

- Renders pagination UI at the bottom (including prev/next links).

8. **`<DataGridPerPageSelector>`**

- A small dropdown or buttons to change items-per-page.

  

### **7.2 Column Components**

1. **`<DataGridActionColumn>`**

- For placing buttons/menus in each row.
- `children: ReactNode`

2. **`<DataGridTextColumn>`**

- Props:
  - `field: string`
  - `header?: ReactNode`
  - `format?: (value: string | null) => ReactNode`
  - `filter?: ReactNode` to override default text filter

3. **`<DataGridNumberColumn>`**

- Similar, but `format` receives `(value: number | null)`.

4. **`<DataGridBooleanColumn>`**

- `format?: (value: boolean | null) => ReactNode`

5. **`<DataGridEnumColumn>`**

- `options?: Record<string, ReactNode>`
- `tooltipActions?: ReactNode` if you want extra elements in the value tooltip.

6. **`<DataGridDateColumn>`** / **`<DataGridDateTimeColumn>`**

- `format?: (value: string | null) => ReactNode`

7. **`<DataGridHasOneColumn>`**

- For a **hasOne** relation. Inside, you place `<Field>` components.
- Also supports a tooltip for advanced filtering on that relationship.

8. **`<DataGridHasManyColumn>`**

- For a **hasMany** relation.
- `children` typically includes `<Field>` or `<HasMany>` from the binding.

9. **`<DataGridIsDefinedColumn>`**

- Check if the field is non-null. Renders a check mark or cross, etc.

10. **`<DataGridUuidColumn>`**

- For fields storing UUIDs.

11. **`<DataGridColumn>`** (base)

- Low-level. You can specify `header`, `sortingField`, `filter`, etc., and render **any** cell content you want.

  

### **7.3 Additional Filter Components**

- **`<DataGridQueryFilter>`**: For a global text search across multiple fields. Maps to `name="_query"` in DataView.
- **`<DataGridTextFilter>`**: For a single text field.
- **`<DataGridEnumFilter>`**: For enumerations.
- **`<DataGridBooleanFilter>`**: For booleans.
- **`<DataGridDateFilter>`**: For date ranges, possibly with pre-defined date range shortcuts.
- **`<DataGridHasOneFilter>`** / **`<DataGridHasManyFilter>`**: For relations.
- **`<DataGridIsDefinedFilter>`**: For checking if a field is `null` or not.
- **`<DataGridNumberFilter>`**: For numeric ranges.
- **`<DataGridUnionTextFilter>`**: For searching multiple fields with one input.

  

### **7.4 Other Utility Components**

- **`<DataGridAutoExport>`**
  - A simple button that triggers CSV export of **all** fields currently present in the data grid.

- **`<DataGridExport>`** (or `<DataGridExportTrigger>`)
  - A more manual approach if you want to specify certain fields or a custom export factory.

- **`<DataGridLayoutSwitcher>`**
  - Renders a set of buttons that let you switch between “table”, “tiles”, or any `<DataViewLayout>` you define inside `<DataGridLoader>`.

- **`DataGridNoResults`**
  - A small component for rendering a “No results found” message.

  

## **8. Conclusion**

The **UI Data Grid** library streamlines the creation of typical data listings—**tables, tiles, filtering, sorting, pagination, exports**, and more—without manually wiring up each piece.

- **If you need** total flexibility or a highly custom layout, revisit the [Headless Data View docs](../headless-components/dataview.md).
- **Otherwise**, the UI Data Grid is your fastest path to a fully featured data experience that’s easy to theme or extend.

