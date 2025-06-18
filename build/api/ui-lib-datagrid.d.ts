import { DataViewBooleanFilterProps } from '@contember/react-dataview';
import { DataViewDateFilterProps } from '@contember/react-dataview';
import { DataViewEnumFilterProps } from '@contember/react-dataview';
import { DataViewHasManyFilterProps } from '@contember/react-dataview';
import { DataViewHasOneFilterProps } from '@contember/react-dataview';
import { DataViewNumberFilterProps } from '@contember/react-dataview';
import { DataViewProps } from '@contember/react-dataview';
import { DataViewTextFilterProps } from '@contember/react-dataview';
import { DataViewUnionTextFilterProps } from '@contember/react-dataview';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import * as React_2 from 'react';
import { ReactNode } from 'react';
import { SugaredRelativeEntityList } from '@contember/interface';
import { SugaredRelativeSingleEntity } from '@contember/interface';
import { SugaredRelativeSingleField } from '@contember/interface';

/**
 * Creates a predefined date range object for use in a `DataGrid` filter.
 *
 * - Computes start and end dates based on the given day offsets.
 * - Returns the range in `YYYY-MM-DD` format.
 *
 * @param label - The displaydd label for the predefined range.
 * @param dayDeltaStart - The number of days from today for the start date (negative for past dates).
 * @param dayDeltaEnd - The number of days from today for the end date.
 * @returns A `DataGridPredefinedDateRange` object with formatted start and end dates.
 *
 * #### Example: Last 7 days
 * ```tsx
 * const lastWeek = createDataGridDateRange('Last 7 days', -7, 0)
 * console.log(lastWeek)
 * // { label: 'Last 7 days', start: '2025-01-01', end: '2025-01-07' }
 * ```
 */
export declare const createDataGridDateRange: (label: ReactNode, dayDeltaStart: number, dayDeltaEnd: number) => DataGridPredefinedDateRange;

/**
 * `DataGrid` is a flexible data display component that provides sorting, filtering, selection,
 * and pagination capabilities. The UI is customizable, allowing you to define how data is presented.
 *
 * #### Props {@link DataGridProps}
 * - **Primary:** `children`, `entities`
 * - **Optional:** `queryField`, `filterTypes`, `dataViewKey`, `onSelectHighlighted`
 * - **Initial values:** `initialFilters`, `initialSorting`, `initialSelection`, `initialItemsPerPage`
 * - **Storage settings:** `filteringStateStorage`, `sortingStateStorage`, `currentPageStateStorage`, `selectionStateStorage`, `pagingSettingsStorage`
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataGrid
 *     entities="Project"
 *     initialSorting={{
 *         createdAt: 'asc',
 *     }}
 * >
 *     <DataGridToolbar>
 *         <DataGridQueryFilter />
 *         <DataGridEnumFilter field="state" />
 *         <DataGridHasOneFilter field="author" label="Author">
 *             <Field field="name" />
 *         </DataGridHasOneFilter>
 *     </DataGridToolbar>
 *     <DataGridLoader>
 *         <DataGridTable>
 *             <DataGridActionColumn>
 *                 <Button>Show detail</Button>
 *             </DataGridActionColumn>
 *             <DataGridTextColumn header="Title" field="title" />
 *             <DataGridEnumColumn field="state" />
 *             <DataGridDateColumn header="Created at" field="createdAt" />
 *             <DataGridHasOneColumn header="Company" field="company">
 *                 <Field field="name" />
 *             </DataGridHasOneColumn>
 *         </DataGridTable>
 *
 *         <DataGridTiles>
 *             <MyCustomTile />
 *         </DataGridTiles>
 *
 *         <DataViewLayout name="rows" label="Rows">
 *             <DataViewEachRow>
 *                 <MyCustomRow />
 *             </DataViewEachRow>
 *         </DataViewLayout>
 *     </DataGridLoader>
 *     <DataGridPagination />
 * </DataGrid>
 * ```
 */
export declare const DataGrid: NamedExoticComponent<Omit<DataViewProps, "children"> & {
children: ReactNode;
}>;

/**
 * `DataGridActionColumn` renders a column with action buttons in a `DataGridTable`.
 * It is typically used to provide interactive controls such as edit, delete, or custom actions.
 *
 * #### Example: Basic usage with a button
 * ```tsx
 * <DataGridTable>
 *   <DataGridActionColumn>
 *     <Button variant="outline">Click me</Button>
 *   </DataGridActionColumn>
 * </DataGridTable>
 * ```
 */
export declare const DataGridActionColumn: React_2.NamedExoticComponent<{
    children: ReactNode;
}>;

/**
 * Button for exporting data grid to CSV.
 * If no fields are provided, all fields will be exported.
 *
 * #### Example
 * ```tsx
 * <DataGridExport />
 * ```
 */
export declare const DataGridAutoExport: ({ fields }: {
    fields?: ReactNode;
}) => JSX_2.Element;

/**
 * Props {@link DataGridBooleanColumnProps}.
 *
 * Renders a column with boolean content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridBooleanColumn field="isPublished" />
 *     <DataGridBooleanColumn field="isActive" format={it => it ? 'Hooray' : 'Oh noooo!'} />
 *     <DataGridBooleanColumn field="hasImage" format={it => it ? <CheckIcon /> : <XIcon />} />
 * </DataGridTable>
 * ```
 */
export declare const DataGridBooleanColumn: React_2.NamedExoticComponent<DataGridBooleanColumnProps>;

/**
 * Props for {@link DataGridBooleanColumn}.
 */
export declare type DataGridBooleanColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom cell content. If not provided, the field value is displayed.
     */
    children?: ReactNode;
    /**
     * Custom value formatter.
     */
    format?: (value: boolean | null) => ReactNode;
    /**
     * Custom filter. If not provided, a default boolean filter is used.
     */
    filter?: ReactNode;
};

/**
 * Props {@link DataGridBooleanFilterProps}
 *
 * `DataGridBooleanFilter` provides a boolean filter for `DataGrid` with a default UI.
 *
 * #### Example
 * ```tsx
 * <DefaultDataGrid entities="Project">
 *   <DataGridBooleanFilter field="locked" label="Locked" />
 * </DefaultDataGrid>
 * ```
 */
export declare const DataGridBooleanFilter: NamedExoticComponent<DataGridBooleanFilterProps>;

/**
 * Props for {@link DataGridBooleanFilter}.
 *
 * Extends {@link DataViewBooleanFilterProps}, excluding the `children` prop.
 */
export declare interface DataGridBooleanFilterProps extends Omit<DataViewBooleanFilterProps, 'children'> {
    /**
     * Label for the filter UI
     * */
    label: ReactNode;
}

/**
 * Props {@link DataGridColumnProps}
 *
 * Low-level component for rendering a column in a data grid.
 */
export declare const DataGridColumn: React_2.NamedExoticComponent<DataGridColumnProps>;

/**
 * Props for {@link DataGridColumn}.
 */
export declare type DataGridColumnProps = {
    children: ReactNode;
    header?: ReactNode;
    name?: string;
    hidingName?: string;
    sortingField?: string;
    cellClassName?: string;
    headerClassName?: string;
    filter?: ReactNode;
    filterName?: string;
};

/**
 * Props {@link DataGridDateColumnProps}.
 *
 * Renders a column with date content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridDateColumn field="createdAt" />
 * </DataGridTable>
 * ```
 */
export declare const DataGridDateColumn: React_2.NamedExoticComponent<DataGridDateColumnProps>;

/**
 * Props for {@link DataGridDateColumn}.
 */
export declare type DataGridDateColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom cell content. If not provided, the field value is displayed.
     */
    children?: ReactNode;
    /**
     * Custom value formatter. If not provided, the default date formatter is used.
     */
    format?: (value: string | null) => ReactNode;
    /**
     * Custom filter. If not provided, a default date filter is used.
     */
    filter?: ReactNode;
};

/**
 * Props {@link DataGridDateFilterProps}
 *
 * `DataGridDateFilter` is a date filter component designed for use within a `DataGrid`.
 * It provides a default UI for selecting date ranges and filtering data accordingly.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridDateFilter field="createdAt" label="Created at" />
 * ```
 *
 * #### Example: With predefined date ranges
 * ```tsx
 * <DataGridDateFilter field="updatedAt" ranges={[{ label: 'Last 7 days', value: '7d' }]} />
 * ```
 */
export declare const DataGridDateFilter: NamedExoticComponent<DataGridDateFilterProps>;

/**
 * Props for {@link DataGridDateFilter}.
 */
export declare interface DataGridDateFilterProps extends Omit<DataViewDateFilterProps, 'children'> {
    label: ReactNode;
    ranges?: DataGridPredefinedDateRange[];
}

/**
 * Props {@link DataGridDateTimeColumnProps}.
 *
 * Renders a column with date-time content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridDateTimeColumn field="createdAt" />
 * </DataGridTable>
 * ```
 */
export declare const DataGridDateTimeColumn: React_2.NamedExoticComponent<DataGridDateTimeColumnProps>;

/**
 * Props for {@link DataGridDateTimeColumn}.
 */
export declare type DataGridDateTimeColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom cell content. If not provided, the field value is displayed.
     */
    children?: ReactNode;
    /**
     * Custom value formatter. If not provided, the default date-time formatter is used.
     */
    format?: (value: string | null) => ReactNode;
    /**
     * Custom filter. If not provided, a default date filter is used.
     */
    filter?: ReactNode;
};

/**
 * Renders a cell with an enum value.
 * Contains a tooltip with filter actions.
 */
export declare const DataGridEnumCell: React_2.NamedExoticComponent<DataGridEnumCellProps>;

/**
 * Props for {@link DataGridEnumCell}.
 */
export declare type DataGridEnumCellProps = {
    /**
     * Field to be displayed.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * Filter identifier. If not provided, the filter is resolved from the field name.
     */
    filterName?: string;
    /**
     * Enum options to be displayed in the tooltip. If not provided, the options are resolved from the enum.
     */
    options?: Record<string, ReactNode>;
    /**
     * Custom actions to be displayed in the tooltip.
     */
    tooltipActions?: ReactNode;
};

/**
 * Props {@link DataGridEnumColumnProps}.
 *
 * Renders a column with enum content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridEnumColumn field="status" />
 *     <DataGridEnumColumn field="status" options={{ active: 'Active', inactive: 'Inactive' }} />
 * </DataGridTable>
 * ```
 */
export declare const DataGridEnumColumn: React_2.NamedExoticComponent<DataGridEnumColumnProps>;

/**
 * Props for {@link DataGridEnumColumn}.
 */
export declare type DataGridEnumColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Enum options for value formatting and filter options. If not provided, the options are resolved from the enum.
     */
    options?: Record<string, ReactNode>;
    /**
     * Custom cell content. If not provided, the field value with a tooltip is displayed.
     */
    children?: ReactNode;
    /**
     * Custom filter. If not provided, a default enum filter is used.
     */
    filter?: ReactNode;
    /**
     * Additional actions in the tooltip.
     */
    tooltipActions?: ReactNode;
};

/**
 * Props {@link DataGridEnumFieldTooltipProps}
 *
 * `DataGridEnumFieldTooltip` renders a value with a tooltip that allows users to include or exclude
 * the value from the filter. It is primarily used in {@link DataGridEnumColumn}, but can be
 * utilized in custom columns as well.
 *
 * #### Example: Basic usage inside a custom column
 * ```tsx
 * <DataGridEnumFieldTooltip value="active">
 *   <span>Active</span>
 * </DataGridEnumFieldTooltip>
 * ```
 *
 * #### Example: With additional actions
 * ```tsx
 * <DataGridEnumFieldTooltip value="inactive" actions={<CustomActionButton />}>
 *   <span>Inactive</span>
 * </DataGridEnumFieldTooltip>
 * ```
 */
export declare const DataGridEnumFieldTooltip: ({ children, actions, value, ...props }: DataGridEnumFieldTooltipProps & {
    children: ReactNode;
    value: string;
    actions?: ReactNode;
}) => JSX_2.Element;

/**
 * Props for {@link DataGridEnumFieldTooltip}.
 */
export declare type DataGridEnumFieldTooltipProps = Omit<DataViewEnumFilterProps, 'children'>;

/**
 * Props {@link DataGridEnumFilterProps}
 *
 * `DataGridEnumFilter` is an enum-based filter component for `DataGrid` with a default UI.
 * It allows filtering records based on predefined enum values.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridEnumFilter field="status" />
 * ```
 *
 * #### Example: With custom enum options
 * ```tsx
 * <DataGridEnumFilter
 *   field="status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' }
 *   ]}
 * />
 * ```
 */
export declare const DataGridEnumFilter: NamedExoticComponent<DataGridEnumFilterProps>;

/**
 * Props for {@link DataGridEnumFilter}.
 */
export declare interface DataGridEnumFilterProps extends Omit<DataViewEnumFilterProps, 'children'> {
    /**
     * Options for the filter.
     */
    options?: Record<string, ReactNode>;
    /**
     * Label for the filter.
     */
    label?: ReactNode;
}

/**
 * Renders a cell with an enum list.
 * Contains a tooltip with filter actions.
 */
export declare const DataGridEnumListCell: React_2.NamedExoticComponent<DataGridEnumListCellProps>;

/**
 * Props for {@link DataGridEnumListCell}.
 */
export declare type DataGridEnumListCellProps = {
    /**
     * Field to be displayed.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * Filter identifier. If not provided, the filter is resolved from the field name.
     */
    filterName?: string;
    /**
     * Enum options to be displayed in the tooltip. If not provided, the options are resolved from the enum.
     */
    options?: Record<string, ReactNode>;
    /**
     * Custom actions to be displayed in the tooltip.
     */
    tooltipActions?: ReactNode;
};

/**
 * Props {@link DataGridEnumListColumnProps}.
 *
 * Renders a column with enum list content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridEnumListColumn field="target" />
 * </DataGridTable>
 * ```
 */
export declare const DataGridEnumListColumn: React_2.NamedExoticComponent<DataGridEnumListColumnProps>;

/**
 * Props for {@link DataGridEnumListColumn}.
 */
export declare type DataGridEnumListColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Enum options for value formatting and filter options. If not provided, the options are resolved from the enum.
     */
    options?: Record<string, ReactNode>;
    /**
     * Custom cell content. If not provided, the field value with a tooltip is displayed.
     */
    children?: ReactNode;
    /**
     * Custom filter. If not provided, a default enum filter is used.
     */
    filter?: ReactNode;
    /**
     * Additional actions in the tooltip.
     */
    tooltipActions?: ReactNode;
};

/**
 * Renders a cell with a has-many relation.
 * Contains a tooltip with filter actions.
 */
export declare const DataGridHasManyCell: React_2.NamedExoticComponent<DataGridHasManyCellProps>;

/**
 * Props for {@link DataGridHasManyCell}.
 */
export declare type DataGridHasManyCellProps = {
    /**
     * Has-many field to be displayed.
     */
    field: SugaredRelativeEntityList['field'];
    /**
     * Filter identifier. If not provided, the filter is resolved from the field name.
     */
    filterName?: string;
    /**
     * Cell content in the context of the has-many relation.
     */
    children: ReactNode;
    /**
     * Custom actions to be displayed in the tooltip.
     */
    tooltipActions?: ReactNode;
};

/**
 * Props {@link DataGridHasManyColumnProps}
 *
 * Renders a column with has-many relation content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridHasManyColumn field="tags">
 *         <Field field="name" />
 *     </DataGridHasManyColumn>
 * </DataGridTable>
 * ```
 */
export declare const DataGridHasManyColumn: React_2.NamedExoticComponent<DataGridHasManyColumnProps>;

/**
 * Props for {@link DataGridHasManyColumn}.
 */
export declare type DataGridHasManyColumnProps = {
    /**
     * Has-many relation field.
     */
    field: SugaredRelativeEntityList['field'];
    /**
     * Filter identifier. If not provided, the filter is resolved from the field name.
     */
    filterName?: string;
    /**
     * Cell content in the context of the has-many relation.
     */
    children: ReactNode;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom filter. If not provided, a default has-many filter is used.
     */
    filter?: ReactNode;
    /**
     * Additional actions in the tooltip.
     */
    tooltipActions?: ReactNode;
};

/**
 * Has many filter for DataGrid with default UI.
 *
 * ## Props {@link DataGridHasManyFilterProps}
 * field, label, children, ?name, ?options
 *
 * #### Example
 * ```tsx
 * <DataGridHasManyFilter field={'tags'} label="Tags">
 *     <Field field="name" />
 * </DataGridHasManyFilter>
 * ```
 */
export declare const DataGridHasManyFilter: NamedExoticComponent<DataViewHasManyFilterProps & {
children: ReactNode;
label: ReactNode;
}>;

/**
 * Props for {@link DataGridHasManyFilter}.
 */
export declare type DataGridHasManyFilterProps = DataViewHasManyFilterProps & {
    children: ReactNode;
    label: ReactNode;
};

/**
 * Component for rendering a value with a tooltip that allows to include/exclude the value from the filter.
 * Used in DataGridHasManyColumn, but can be used in custom columns as well.
 *
 * ## Props {@link DataGridHasManyTooltipProps}
 * field, children, ?name, ?options, ?actions
 *
 * #### Example
 * ```tsx
 * <HasMany field="tags">
 *     <DataGridHasManyTooltip field={'tags'}>
 *         <button className="text-sm border border-gray-200 rounded-sm px-2 py-1">
 *             <Field field="name" />
 *         </button>
 *     </DataGridHasManyTooltip>
 * </HasMany>
 * ```
 */
export declare const DataGridHasManyTooltip: NamedExoticComponent<DataGridHasManyTooltipProps>;

/**
 * Props for {@link DataGridHasManyTooltip}.
 */
export declare type DataGridHasManyTooltipProps = DataViewHasManyFilterProps & {
    children: ReactNode;
    /**
     * Custom actions to render in the tooltip.
     */
    actions?: ReactNode;
};

/**
 * Renders a cell with a has-one relation.
 * Contains a tooltip with filter actions.
 */
export declare const DataGridHasOneCell: React_2.NamedExoticComponent<DataGridHasOneCellProps>;

/**
 * Props for {@link DataGridHasOneCell}.
 */
export declare type DataGridHasOneCellProps = {
    /**
     * Has-one field to be displayed.
     */
    field: SugaredRelativeSingleEntity['field'];
    /**
     * Filter identifier. If not provided, the filter is resolved from the field name.
     */
    filterName?: string;
    /**
     * Cell content in the context of the has-one relation.
     */
    children: ReactNode;
    /**
     * Custom actions to be displayed in the tooltip.
     */
    tooltipActions?: ReactNode;
};

/**
 * Props {@link DataGridHasOneColumnProps}.
 *
 * Renders a column with has-one relation content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridHasOneColumn field="author">
 *         <Field field="name" />
 *     </DataGridHasOneColumn>
 * </DataGridTable>
 * ```
 */
export declare const DataGridHasOneColumn: React_2.NamedExoticComponent<DataGridHasOneColumnProps>;

/**
 * Props for {@link DataGridHasOneColumn}.
 */
export declare type DataGridHasOneColumnProps = {
    /**
     * Has-one relation field.
     */
    field: SugaredRelativeSingleEntity['field'];
    /**
     * Filter identifier. If not provided, the filter is resolved from the field name.
     */
    filterName?: string;
    /**
     * Cell content in the context of the has-one relation.
     */
    children: ReactNode;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom filter. If not provided, a default has-one filter is used.
     */
    filter?: ReactNode;
    /**
     * Additional actions in the tooltip.
     */
    tooltipActions?: ReactNode;
};

/**
 * Has one filter for DataGrid with default UI.
 *
 * ## Props {@link DataGridHasOneFilterProps}
 * field, label, children, ?name, ?options
 *
 * #### Example
 * ```tsx
 * <DataGridHasOneFilter field={'author'} label="Author">
 *     <Field field="name" />
 * </DataGridHasOneFilter>
 * ```
 */
export declare const DataGridHasOneFilter: NamedExoticComponent<DataViewHasOneFilterProps & {
children: ReactNode;
label: ReactNode;
}>;

/**
 * Props for {@link DataGridHasOneFilter}.
 */
export declare type DataGridHasOneFilterProps = DataViewHasOneFilterProps & {
    children: ReactNode;
    label: ReactNode;
};

/**
 * Component for rendering a value with a tooltip that allows to include/exclude the value from the filter.
 * Used in DataGridHasOneColumn, but can be used in custom columns as well.
 *
 * ## Props {@link DataGridHasOneTooltipProps}
 * field, children, ?name, ?options, ?actions
 *
 * #### Example
 * ```tsx
 * <HasOne field="category">
 * <DataGridHasOneTooltip field={'category'}>
 *     <button className="text-lg font-semibold text-gray-600">
 *        <Field field="category.name" />
 *     </button>
 *  </button>
 * </DataGridHasOneTooltip>
 * </HasOne>
 * ```
 */
export declare const DataGridHasOneTooltip: NamedExoticComponent<DataGridHasOneTooltipProps>;

/**
 * Props for {@link DataGridHasOneTooltip}.
 */
export declare type DataGridHasOneTooltipProps = DataViewHasOneFilterProps & {
    children: ReactNode;
    /**
     * Custom actions to render in the tooltip.
     */
    actions?: ReactNode;
};

/**
 * Props {@link DataGridIsDefinedColumnProps}.
 *
 * Renders a column with is-defined content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridIsDefinedColumn field="coverImage.url" />
 * </DataGridTable>
 * ```
 */
export declare const DataGridIsDefinedColumn: React_2.NamedExoticComponent<DataGridIsDefinedColumnProps>;

/**
 * Props for {@link DataGridIsDefinedColumn}.
 */
export declare type DataGridIsDefinedColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom cell content. If not provided, a checkmark or a cross is displayed.
     */
    children?: ReactNode;
    /**
     * Custom value formatter.
     */
    format?: (value: boolean) => ReactNode;
    /**
     * Custom filter. If not provided, a default is-defined filter is used.
     */
    filter?: ReactNode;
    filterName?: string;
};

/**
 * Props {@link DataGridIsDefinedFilterProps}
 *
 * `DataGridIsDefinedFilter` is a filter component for `DataGrid` that checks whether a field is defined or not.
 * It provides a default UI for filtering records based on the presence of a value.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridIsDefinedFilter field="deletedAt" label="Is Deleted?" />
 * ```
 */
export declare const DataGridIsDefinedFilter: NamedExoticComponent<Omit<DataViewBooleanFilterProps, "children"> & {
/**
* Label for the filter.
*/
label: ReactNode;
}>;

/**
 * Props for {@link DataGridIsDefinedFilter}.
 */
export declare type DataGridIsDefinedFilterProps = Omit<DataViewBooleanFilterProps, 'children'> & {
    /**
     * Label for the filter.
     */
    label: ReactNode;
};

/**
 * `DataGridLayoutSwitcher` is a UI component for switching between different data grid layouts.
 * It renders a set of buttons, allowing users to select and apply a layout dynamically.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataGridLayoutSwitcher />
 * ```
 */
export declare const DataGridLayoutSwitcher: () => JSX_2.Element;

/**
 * `DataGridLoader` manages the loading state for a data grid, displaying appropriate loaders
 * based on the current state (refreshing, initial load, or failure).
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataGridLoader>
 *     <DataGridTable>
 *         <DataGridTextColumn header="Title" field="title" />
 *     </DataGridTable>
 * </DataGridLoader>
 * ```
 */
export declare const DataGridLoader: ({ children }: DataGridLoaderProps) => JSX_2.Element;

/**
 * Props for the {@link DataGridLoader} component.
 */
export declare interface DataGridLoaderProps {
    children: ReactNode;
}

export declare const DataGridNoResults: () => JSX_2.Element;

/**
 * Props {@link DataGridNumberColumnProps}.
 *
 * Renders a column with number content. Should be used in a {@link DataGridTable}.
 *
 * #### Example
 * ```tsx
 * <DataGridTable>
 *     <DataGridNumberColumn field="price" format={it => it.toFixed(2)} />
 *     <DataGridNumberColumn field="price" header="Price with currency">
 *         <Field field="price" /> <Field field="currency" />
 *     </DataGridNumberColumn>
 * </DataGridTable>
 * ```
 */
export declare const DataGridNumberColumn: React_2.NamedExoticComponent<DataGridNumberColumnProps>;

/**
 * Props for {@link DataGridNumberColumn}.
 */
export declare type DataGridNumberColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom cell content. If not provided, the field value is displayed.
     */
    children?: ReactNode;
    /**
     * Custom value formatter.
     */
    format?: (value: number | null) => ReactNode;
    /**
     * Custom filter. If not provided, a default number filter is used.
     */
    filter?: ReactNode;
};

/**
 * Props {@link DataGridNumberFilterProps}
 *
 * `DataGridNumberFilter` provides a number filter UI for `DataGrid`, allowing users to filter numerical values efficiently.
 *
 * #### Example
 * ```tsx
 * <DataGridNumberFilter field="views" label="Views" />
 * ```
 */
export declare const DataGridNumberFilter: React_2.NamedExoticComponent<Omit<DataViewNumberFilterProps, "children"> & {
    label: ReactNode;
}>;

/**
 * Props for {@link DataGridNumberFilter}.
 */
export declare type DataGridNumberFilterProps = Omit<DataViewNumberFilterProps, 'children'> & {
    label: ReactNode;
};

/**
 * Props {@link DataGridPaginationProps}
 *
 * `DataGridPagination` provides pagination controls for navigating through pages in a `DataView`.
 * It includes buttons for navigating to the first, previous, next, and last pages.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataGridPagination />
 * ```
 */
export declare const DataGridPagination: ({ sticky }: DataGridPaginationProps) => JSX_2.Element;

/**
 * Props for {@link DataGridPagination} component.
 */
export declare type DataGridPaginationProps = {
    /**
     * Optional sticky position (default: false)
     * */
    sticky?: boolean;
};

/**
 * `DataGridPerPageSelector` allows users to set the number of items displayed per page
 * in a `DataView`. It provides a dropdown menu with preset options.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataGridPerPageSelector />
 * ```
 */
export declare const DataGridPerPageSelector: () => JSX_2.Element;

/**
 * Props for {@link DataGridDateFilter}.
 */
export declare type DataGridPredefinedDateRange = {
    /**
     * Start date in ISO format
     */
    start: string;
    /**
     * End date in ISO format
     */
    end: string;
    /**
     * Label for the range
     */
    label: ReactNode;
};

/**
 * Props for {@link DataGrid}.
 */
export declare type DataGridProps = Omit<DataViewProps, 'children'> & {
    children: ReactNode;
};

/**
 * Universal text filter for DataGrid with default UI. By default, it filters all text fields.
 *
 * #### Example
 * ```tsx
 * <DataGridQueryFilter label="Search" />
 * ```
 */
export declare const DataGridQueryFilter: React_2.NamedExoticComponent<DataGridQueryFilterProps>;

/**
 * Props for {@link DataGridQueryFilter}.
 */
export declare type DataGridQueryFilterProps = {
    label?: React_2.ReactNode;
};

/**
 * `DataGridTable` provides a table layout for `DataView`, allowing structured data representation.
 * It must be used within a `DataView` context to function correctly.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridTable>
 *   <DataGridTextColumn header="Title" field="title" />
 *   <DataGridTextColumn header="Author" field="author" />
 * </DataGridTable>
 * ```
 */
export declare const DataGridTable: NamedExoticComponent<DataViewTableProps>;

/**
 * Props {@link DataGridTextColumnProps}.
 *
 * Renders a column with text content and column controls in a header. Should be used in a {@link DataGridTable}.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataGridTable>
 *     <DataGridTextColumn field="title" />
 *     <DataGridTextColumn
 *         field="subtitle"
 *         format={it => (
 *             <span className="text-blue-500 flex items-center gap-2">
 *                 <Heading2Icon /> {it}
 *             </span>
 *         )}
 *     />
 *     <DataGridTextColumn field="description" format={it => it.slice(0, 100)} />
 * </DataGridTable>
 * ```
 */
export declare const DataGridTextColumn: React_2.NamedExoticComponent<DataGridTextColumnProps>;

/**
 * Props for {@link DataGridTextColumn}.
 */
export declare type DataGridTextColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom cell content. If not provided, the field value is displayed.
     */
    children?: ReactNode;
    /**
     * Custom value formatter.
     */
    format?: (value: string | null) => ReactNode;
    /**
     * Custom filter. If not provided, a default text filter is used.
     */
    filter?: ReactNode;
};

/**
 * Text filter for DataGrid with default UI.
 *
 * ## Props {@link DataGridTextFilterProps}
 * field, label, ?name
 *
 * #### Example
 * ```tsx
 * <DataGridTextFilter field={'name'} label="Name" />
 * ```
 */
export declare const DataGridTextFilter: React_2.NamedExoticComponent<Omit<DataViewTextFilterProps, "children"> & {
    label?: React_2.ReactNode;
}>;

/**
 * Props for {@link DataGridTextFilter}.
 */
export declare type DataGridTextFilterProps = Omit<DataViewTextFilterProps, 'children'> & {
    label?: React_2.ReactNode;
};

/**
 * `DataGridTiles` provides a simple grid layout for `DataView`, enabling a tile-based display.
 * It must be used within a `DataView` context.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DataGridTiles>
 *   <MyCustomTile />
 * </DataGridTiles>
 * ```
 */
export declare const DataGridTiles: NamedExoticComponent<DataGridTilesProps>;

/**
 * Props for the {@link DataGridTiles} component.
 */
export declare type DataGridTilesProps = {
    children: React.ReactNode;
    className?: string;
};

/**
 * `DataGridToolbar` provides a toolbar for `DataGrid` with default UI components.
 * It includes filtering, layout settings, export functionality, and a reload button.
 *
 * #### Example: Basic usage with custom filters
 * ```tsx
 * <DataGridToolbar>
 *   <DataGridQueryFilter />
 *   <DataGridTextFilter field="name" label="Name" />
 * </DataGridToolbar>
 * ```
 */
export declare const DataGridToolbar: NamedExoticComponent<DataGridToolbarProps>;

/**
 * Props for the {@link DataGridToolbar} component.
 */
export declare type DataGridToolbarProps = {
    children?: ReactNode;
    /**
     * UI props from {@link DataGridToolbarUI}
     */
    sticky?: boolean;
};

/**
 * Text filter which filters multiple fields at once for DataGrid with default UI.
 *
 * ## Props {@link DataGridUnionTextFilterProps}
 * fields, label, ?name
 *
 * #### Example
 * ```tsx
 * <DataGridUnionTextFilter fields={['name', 'description']} label="Name or description" />
 * ```
 */
export declare const DataGridUnionTextFilter: React_2.NamedExoticComponent<Omit<DataViewUnionTextFilterProps, "children"> & {
    label?: React_2.ReactNode;
}>;

/**
 * Props for {@link DataGridUnionTextFilter}.
 */
export declare type DataGridUnionTextFilterProps = Omit<DataViewUnionTextFilterProps, 'children'> & {
    label?: React_2.ReactNode;
};

/**
 * Props {@link DataGridUuidColumnProps}.
 *
 * Renders a column with UUID content. Should be used in a {@link DataGridTable}.
 */
export declare const DataGridUuidColumn: React_2.NamedExoticComponent<DataGridUuidColumnProps>;

/**
 * Props for {@link DataGridUuidColumn}.
 */
export declare type DataGridUuidColumnProps = {
    /**
     * Displayed field.
     */
    field: string;
    /**
     * Custom header. If not provided, the label formatter is used.
     */
    header?: ReactNode;
    /**
     * Custom cell content. If not provided, the field value is displayed.
     */
    children?: ReactNode;
    /**
     * Custom value formatter.
     */
    format?: (value: string | null) => ReactNode;
};

/**
 * Props for the {@link DataGridTable} component.
 */
export declare type DataViewTableProps = {
    children: ReactNode;
};

/**
 * `DefaultDataGrid` is a pre-configured `DataGrid` component that includes a toolbar, loader, table, and pagination.
 * It provides a structured layout for displaying data with minimal configuration.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DefaultDataGrid entities="Project">
 *     <DataGridActionColumn>
 *         <Button>Show detail</Button>
 *     </DataGridActionColumn>
 *     <DataGridTextColumn header="Title" field="title" />
 *     <DataGridEnumColumn header="State" field="state" />
 * </DefaultDataGrid>
 * ```
 */
export declare const DefaultDataGrid: NamedExoticComponent<Omit<DataViewProps, "children"> & {
children: ReactNode;
toolbar?: ReactNode;
}>;

/**
 * Props for {@link DefaultDataGrid}.
 */
export declare type DefaultDataGridProps = Omit<DataViewProps, 'children'> & {
    children: ReactNode;
    toolbar?: ReactNode;
};

export { }
