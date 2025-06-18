import { ChangeEvent } from 'react';
import { EntityAccessor } from '@contember/react-binding';
import { EntityId } from '@contember/react-binding';
import { EntityListAccessor } from '@contember/react-binding';
import { EntityListSubTreeLoaderState } from '@contember/react-binding';
import { EntityListSubTreeMarker } from '@contember/react-binding';
import { Environment } from '@contember/react-binding';
import { FieldMarker } from '@contember/react-binding';
import { Filter } from '@contember/react-binding';
import { ForwardRefExoticComponent } from 'react';
import { HasManyRelationMarker } from '@contember/react-binding';
import { HasOneRelationMarker } from '@contember/react-binding';
import { Input } from '@contember/client';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { JSXElementConstructor } from 'react';
import { NamedExoticComponent } from 'react';
import { OrderBy } from '@contember/react-binding';
import { QualifiedEntityList } from '@contember/react-binding';
import * as React_2 from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { ReceivedEntityData } from '@contember/react-binding';
import { RefAttributes } from 'react';
import { SchemaColumn } from '@contember/react-binding';
import { SchemaEntity } from '@contember/react-binding';
import { SchemaRelation } from '@contember/react-binding';
import { Serializable } from '@contember/react-utils';
import { SetStateAction } from 'react';
import { StateStorageOrName } from '@contember/react-utils';
import { SugaredQualifiedEntityList } from '@contember/react-binding';
import { SugaredRelativeEntityList } from '@contember/react-binding';
import { SugaredRelativeSingleEntity } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';
import { SugaredRelativeSingleField as SugaredRelativeSingleField_2 } from '@contember/binding-common';
import { UseEntityListSubTreeLoaderState } from '@contember/react-binding';
import { UseEntityListSubTreeLoaderStateMethods } from '@contember/react-binding';

export declare type BooleanFilterArtifacts = {
    includeTrue?: boolean;
    includeFalse?: boolean;
    nullCondition?: boolean;
};

/**
 * Low-level component for initializing a data view with fine-grained control over its state. Use together with {@link useDataView}.
 * Use with caution, prefer the {@link DataView} component for most use cases.
 */
export declare const ControlledDataView: NamedExoticComponent<ControlledDataViewProps>;

export declare interface ControlledDataViewProps {
    children: ReactNode;
    state: DataViewState;
    info: DataViewInfo;
    methods: DataViewMethods;
    onSelectHighlighted?: (entity: EntityAccessor) => void;
}

export declare const createBooleanFilter: (field: SugaredRelativeSingleField_2["field"]) => DataViewFilterHandler<BooleanFilterArtifacts>;

export declare const createDateFilter: (field: SugaredRelativeSingleField_2["field"]) => DataViewFilterHandler<DateRangeFilterArtifacts>;

export declare const createEnumFilter: (field: SugaredRelativeSingleField_2["field"]) => DataViewFilterHandler<EnumFilterArtifacts>;

export declare const createEnumListFilter: (field: SugaredRelativeSingleField_2["field"]) => DataViewFilterHandler<EnumListFilterArtifacts>;

/**
 * Simplifies the creation of a filter handler for a field filter.
 */
export declare const createFieldFilterHandler: <FA extends DataViewFilterArtifact = DataViewFilterArtifact>({ createCondition, isEmpty }: {
    createCondition: ((filterArtifact: FA, options: DataViewFilterHandlerOptions) => Input.Condition | undefined);
    isEmpty?: (filterArtifact: FA) => boolean;
}) => (field: SugaredRelativeSingleField["field"]) => DataViewFilterHandler<FA>;

export declare const createFilterHandler: <FA extends DataViewFilterArtifact = DataViewFilterArtifact>({ createFilter, isEmpty, identifier }: {
    createFilter: ((filterArtifact: FA, options: DataViewFilterHandlerOptions) => Filter | undefined);
    isEmpty?: (filterArtifact: FA) => boolean;
    identifier?: {
        id: Symbol;
        params: any;
    };
}) => DataViewFilterHandler<FA>;

export declare const createGenericTextCellFilterCondition: (filter: GenericTextCellFilterArtifacts) => Input.Condition<string>;

export declare const createHasManyFilter: (field: SugaredRelativeEntityList["field"]) => DataViewFilterHandler<RelationFilterArtifacts>;

export declare const createHasOneFilter: (field: SugaredRelativeSingleEntity["field"]) => DataViewFilterHandler<RelationFilterArtifacts>;

export declare const createIsDefinedFilter: (field: SugaredRelativeSingleField_2["field"]) => DataViewFilterHandler<IsDefinedFilterArtifacts>;

export declare const createNumberFilter: (field: SugaredRelativeSingleField_2["field"]) => DataViewFilterHandler<NumberFilterArtifacts>;

export declare const createNumberRangeFilter: (field: SugaredRelativeSingleField_2["field"]) => DataViewFilterHandler<NumberRangeFilterArtifacts>;

export declare const createTextFilter: (field: SugaredRelativeSingleField_2["field"]) => DataViewFilterHandler<TextFilterArtifacts>;

export declare const createUnionTextFilter: (fields: DataViewUnionFilterFields) => DataViewFilterHandler<TextFilterArtifacts>;

export declare class CsvExportFactory implements ExportFactory {
    create(args: ExportFormatterCreateOutputArgs): ExportResult;
    protected filterData(data: DataViewDataForExport): DataViewDataForExport;
    protected flattenData(data: any[], marker: EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker): DataViewDataForExport;
    protected formatValue(value: any): string;
    protected formatOutput(data: DataViewDataForExport): string;
    protected createHeader(data: DataViewDataForExport): string[];
    protected createData(data: DataViewDataForExport): string[][];
}

/**
 * The root component for DataView. It initializes the DataView state and provides the DataView context.
 *
 * #### Example
 * ```tsx
 * <DataView entities={'Post'}>
 *     // DataView content here
 * </DataView>
 * ```
 */
declare const DataView_2: NamedExoticComponent<DataViewProps>;
export { DataView_2 as DataView }

/**
 * Provides a boolean filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewBooleanFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewBooleanFilter field="published">
 *   //  Filter controls here
 * </DataViewBooleanFilter>
 * ```
 */
export declare const DataViewBooleanFilter: React_2.NamedExoticComponent<DataViewBooleanFilterProps>;

export declare type DataViewBooleanFilterCurrent = 'include' | 'none';

export declare interface DataViewBooleanFilterProps {
    /**
     * The field to apply the boolean filter to.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * The content or UI controls to render inside the filter.
     * Typically, this includes filter triggers or related components.
     */
    children: React_2.ReactNode;
}

/**
 *
 * A trigger component for managing boolean filters in a data view.
 *
 * ## Props
 * - name, value, action, children
 *
 * See {@link DataViewBooleanFilterTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the `value` matches the current filter state.
 * - **`data-current`**: Indicates the current filter state, which can be:
 *   - `'include'`: The filter is active for the specified `value`.
 *   - `'none'`: The filter is not active.
 *
 * #### Example
 * ```tsx
 * <DataViewBooleanFilterTrigger value={true} action="toggle">
 *     <button>Include True</button>
 * </DataViewBooleanFilterTrigger>
 * ```
 */
export declare const DataViewBooleanFilterTrigger: React_2.ForwardRefExoticComponent<DataViewBooleanFilterTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewBooleanFilterTriggerAttributes {
    ['data-active']?: '';
    ['data-current']: DataViewBooleanFilterCurrent;
}

export declare interface DataViewBooleanFilterTriggerProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * Specifies the boolean value this button represents (e.g., typically one button for `true` and one for `false`).
     */
    value: boolean;
    /**
     * Determines how the filter behaves when the button is clicked:
     *   - `'include'`: Sets the filter to include the value.
     *   - `'unset'`: Removes the filter.
     *   - `'toggle'`: Toggles the filter state.
     */
    action?: DataViewSetBooleanFilterAction;
    /**
     * The button element.
     */
    children: ReactElement;
}

/**
 * A trigger component for changing pages in a data view.
 * Automatically disables the trigger when navigation is not possible (e.g., no next page).
 *
 * ## Props
 * - page, children
 *
 * See {@link DataViewChangePageTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the trigger corresponds to the current page.
 * - **`data-current`**: Reflects the current page index (0-based).
 * #### Example
 * ```tsx
 * <DataViewChangePageTrigger page="next">
 *     <button>Next</button>
 * </DataViewChangePageTrigger>
 * <DataViewChangePageTrigger page={1}>
 *     <button>Go to Page 2</button>
 * </DataViewChangePageTrigger>
 * ```
 */
export declare const DataViewChangePageTrigger: ForwardRefExoticComponent<DataViewChangePageTriggerProps & RefAttributes<HTMLButtonElement>>;

export declare interface DataViewChangePageTriggerAttributes {
    ['data-active']?: '';
    ['data-current']?: string;
}

export declare interface DataViewChangePageTriggerProps {
    /**
     * The target page to navigate to:
     * - A specific page number (0-based).
     * - `'first'`: Navigates to the first page.
     * - `'last'`: Navigates to the last page.
     * - `'next'`: Navigates to the next page.
     * - `'previous'`: Navigates to the previous page.
     */
    page: number | 'first' | 'last' | 'next' | 'previous';
    /**
     * The button or element used as the trigger.
     */
    children: React.ReactNode;
}

/** @internal */
export declare const DataViewChildrenContext: React_2.Context<React_2.ReactNode>;

/** @internal */
export declare const DataViewCurrentKeyContext: React_2.Context<string>;

export declare type DataViewDataForExport = {
    markerPath: (EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker | FieldMarker)[];
    values: any[];
}[];

/**
 * Provides a date filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewDateFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewDateFilter field="createdAt">
 *   //  Filter controls here
 * </DataViewDateFilter>
 * ```
 */
export declare const DataViewDateFilter: React_2.NamedExoticComponent<DataViewDateFilterProps>;

/**
 * A component for rendering an input field to filter data view by date range.
 * Automatically binds the input to the date filter state in the data view.
 *
 * ## Props
 * - name, type, children
 *
 * See {@link DataViewDateFilterInputProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewDateFilterInput type="start">
 *     <input placeholder="Start Date" />
 * </DataViewDateFilterInput>
 * <DataViewDateFilterInput type="end">
 *     <input placeholder="End Date" />
 * </DataViewDateFilterInput>
 * ```
 */
export declare const DataViewDateFilterInput: React_2.ForwardRefExoticComponent<DataViewDateFilterInputProps & React_2.RefAttributes<HTMLInputElement>>;

export declare interface DataViewDateFilterInputProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * Specifies whether the input corresponds to the `start` or `end` of the date range.
     */
    type: 'start' | 'end';
    /**
     * The input element for the date filter.
     */
    children: ReactElement;
}

export declare interface DataViewDateFilterProps {
    /**
     * The field to apply the date filter to.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * The content or UI controls to render inside the filter.
     * Typically, this includes filter triggers or related components.
     */
    children: React_2.ReactNode;
}

/**
 * A trigger component for resetting parts of a date range filter in a data view.
 * The trigger is rendered only if there is a start or end date to reset.
 *
 * ## Props
 * - name, type, children
 *
 * See {@link DataViewDateFilterResetTriggerProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewDateFilterResetTrigger type="start">
 *     <button>Reset Start Date</button>
 * </DataViewDateFilterResetTrigger>
 * ```
 */
export declare const DataViewDateFilterResetTrigger: React_2.ForwardRefExoticComponent<DataViewDateFilterResetTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewDateFilterResetTriggerProps {
    /**
     * The name of the filter. If not provided, it will be inferred from the context
     */
    name?: string;
    /**
     * Specifies which part of the date range to reset:
     *  - `'start'`: Resets the start date.
     *  - `'end'`: Resets the end date.
     *  - `undefined`: Resets both start and end dates.
     */
    type?: 'start' | 'end';
    /**
     * The button element
     */
    children: ReactElement;
}

/** @internal */
export declare const DataViewDisplayedStateContext: React_2.Context<DataViewState | undefined>;

/**
 * Renders children for each row in the DataView.
 *
 * #### Example
 * ```tsx
 * <DataViewEachRow>
 *     <Field field="name" />
 * </DataViewEachRow>
 * ```
 */
export declare const DataViewEachRow: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

/**
 * Conditionally renders its children based on the current visibility state of a data view element.
 *
 *
 * ## Props
 * - name, fallback, children
 *
 * See {@link DataViewElementProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewElement name={'category'} label="Category">
 *     //  Category content here
 * </DataViewElement>
 * ```
 */
export declare const DataViewElement: NamedExoticComponent<DataViewElementProps>;

export declare type DataViewElementData = {
    name: string;
    label?: ReactNode;
    fallback?: boolean;
    children?: DataViewElementData[];
};

export declare interface DataViewElementProps {
    /**
     * The name of the data view element.
     */
    name: string;
    /**
     * Label of the element. Collected during static-render process and might be used e.g. for visibility toggle.
     */
    label?: ReactNode;
    /**
     * Determines whether to use the fallback value if the element visibility is not defined.
     */
    fallback?: boolean;
    /**
     * The content to render if the element is visible.
     */
    children: React.ReactNode;
}

/**
 * Renders children when the DataView is empty.
 *
 * #### Example
 * ```tsx
 * <DataViewEmpty>
 *     <p>No items found</p>
 * </DataViewEmpty>
 * ```
 */
export declare const DataViewEmpty: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

/** @internal */
export declare const DataViewEntityListAccessorContext: React_2.Context<EntityListAccessor | undefined>;

/** @internal */
export declare const DataViewEntityListPropsContext: React_2.Context<QualifiedEntityList>;

/**
 * Provides an enum filter within a data view, including context and a filter handler.
 *
 * This component sets up the necessary context for working with enum filters
 * and ensures that the specified field is valid for enum filtering.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewEnumFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewEnumFilter field="status">
 *   //  Filter controls here
 * </DataViewEnumFilter>
 * ```
 *
 * @throws Error if the provided field is not valid for enum filtering.
 */
export declare const DataViewEnumFilter: React_2.NamedExoticComponent<DataViewEnumFilterProps>;

/** @internal */
export declare const DataViewEnumFilterArgsContext: React_2.Context<{
    enumName: string;
}>;

export declare type DataViewEnumFilterCurrent = 'include' | 'exclude' | 'none';

export declare interface DataViewEnumFilterProps {
    /**
     * The field to apply the enum filter to.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * The content or UI controls to render inside the filter.
     * Typically, this includes filter triggers or related components.
     */
    children: React_2.ReactNode;
}

export declare const DataViewEnumFilterState: ({ name, children, state, value }: {
    name?: string;
    value: string;
    children: ReactNode;
    state?: DataViewEnumFilterCurrent | DataViewEnumFilterCurrent[];
}) => JSX_2.Element | null;

/**
 * A trigger component for managing enum filters in a data view.
 *
 * ## Props
 * - name, value, action, children
 *
 * See {@link DataViewEnumFilterTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the `value` matches the current filter state and action.
 * - **`data-current`**: Indicates the current filter state, which can be:
 *   - `'include'`: The filter includes the specified `value`.
 *   - `'exclude'`: The filter excludes the specified `value`.
 *   - `'none'`: The filter is not active.
 *
 * #### Example
 * ```tsx
 * <DataViewEnumFilterTrigger value="optionA" action="toggleInclude">
 *     <button>Include Option A</button>
 * </DataViewEnumFilterTrigger>
 * ```
 */
export declare const DataViewEnumFilterTrigger: React_2.ForwardRefExoticComponent<DataViewEnumFilterTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewEnumFilterTriggerAttributes {
    ['data-active']?: '';
    ['data-current']: DataViewEnumFilterCurrent;
}

export declare interface DataViewEnumFilterTriggerProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * Specifies the enum value this button represents.
     */
    value: string;
    /**
     * Determines how the filter behaves when the button is clicked:
     *  - `'include'`: Sets the filter to include the value.
     *  - `'exclude'`: Sets the filter to exclude the value.
     *  - `'unset'`: Removes the filter.
     *  - `'toggleInclude'`: Toggles the value in the inclusion filter.
     *  - `'toggleExclude'`: Toggles the value in the exclusion filter.
     */
    action?: DataViewSetEnumFilterAction;
    /**
     * The button element.
     */
    children: ReactElement;
}

/**
 * Provides an enum filter within a data view, including context and a filter handler.
 *
 * This component sets up the necessary context for working with enum filters
 * and ensures that the specified field is valid for enum filtering.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewEnumListFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewEnumListFilter field="status">
 *   //  Filter controls here
 * </DataViewEnumListFilter>
 * ```
 *
 * @throws Error if the provided field is not valid for enum filtering.
 */
export declare const DataViewEnumListFilter: React_2.NamedExoticComponent<DataViewEnumListFilterProps>;

export declare interface DataViewEnumListFilterProps {
    /**
     * The field to apply the enum filter to.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * The content or UI controls to render inside the filter.
     * Typically, this includes filter triggers or related components.
     */
    children: React_2.ReactNode;
}

/**
 * A trigger component to export data from a data view.
 *
 * ## Props
 * - fields, children, baseName, exportFactory
 *
 * See {@link DataViewExportTriggerProps} for details.
 *
 * ## Behavior
 * - Clicking the trigger exports data based on the provided fields and format.
 * - Automatically fetches all data before generating the export file.
 * - Downloads the exported file with the specified `baseName` and file extension.
 *
 * #### Example
 * ```tsx
 * <DataViewExportTrigger baseName="my-export">
 *     <button>Export Data</button>
 * </DataViewExportTrigger>
 * ```
 */
export declare const DataViewExportTrigger: React_2.ForwardRefExoticComponent<DataViewExportTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewExportTriggerProps {
    /**
     * The fields to include in the export. Defaults to the fields in the data view's global configuration.
     */
    fields?: ReactNode;
    /**
     * The button element for the export trigger.
     */
    children: ReactElement;
    /**
     * The base name for the exported file. Defaults to `<entityName>-<current-date>`.
     */
    baseName?: string;
    /**
     * A factory for generating the exported data. Defaults to a CSV export factory.
     */
    exportFactory?: ExportFactory;
}

/**
 * Registers a filter type with the given name and filter handler.
 *
 * ## Props
 * - name, filterHandler, children
 */
export declare const DataViewFilter: NamedExoticComponent<DataViewFilterProps>;

export declare type DataViewFilterArtifact = Serializable;

/**
 * Handler for a filter type.
 * Transforms a filter artifact to a GraphQL filter.
 *
 * You can register a filter handler using {@link DataViewFilteringProps.filterTypes} or using {@link DataViewFilter} component.
 *
 * You can use {@link createFieldFilterHandler} to simplify the creation of a filter handler for a field filter or {@link createFilterHandler} for a generic filter handler.
 *
 * Built-in filter handlers:
 * - {@link createBooleanFilter}
 * - {@link createDateFilter}
 * - {@link createEnumFilter}
 * - {@link createHasManyFilter}
 * - {@link createHasOneFilter}
 * - {@link createIsDefinedFilter}
 * - {@link createNumberFilter}
 * - {@link createNumberRangeFilter}
 * - {@link createTextFilter}
 * - {@link createUnionTextFilter}
 */
export declare type DataViewFilterHandler<FA extends DataViewFilterArtifact = DataViewFilterArtifact> = ((filterArtifact: FA, options: DataViewFilterHandlerOptions) => Filter | undefined) & {
    identifier?: {
        id: Symbol;
        params: any;
    };
    isEmpty?: (filterArtifact: FA) => boolean;
};

export declare interface DataViewFilterHandlerOptions {
    environment: Environment;
}

export declare type DataViewFilterHandlerRegistry = Record<string, DataViewFilterHandler<any>>;

/** @internal */
export declare const DataViewFilterHandlerRegistryContext: React_2.Context<DataViewFilterHandlerRegistry>;

export declare type DataViewFilteringArtifacts = Record<string, DataViewFilterArtifact>;

/**
 * Methods for filtering. Available using {@link useDataViewFilteringMethods}.
 */
export declare type DataViewFilteringMethods = {
    setFilter: DataViewSetFilter;
};

/** @internal */
export declare const DataViewFilteringMethodsContext: React_2.Context<DataViewFilteringMethods>;

export declare type DataViewFilteringProps = {
    /**
     * Provide filter types.
     */
    filterTypes?: DataViewFilterHandlerRegistry;
    /**
     * Initial filtering state if not available in storage.
     * Can be a function to transform the stored state.
     */
    initialFilters?: DataViewFilteringArtifacts | ((stored: DataViewFilteringArtifacts) => DataViewFilteringArtifacts);
    /**
     * Storage for filtering state.
     * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
     */
    filteringStateStorage?: StateStorageOrName;
};

/**
 * Current state of filtering.
 * Available using {@link useDataViewFilteringState}.
 */
export declare type DataViewFilteringState = {
    /**
     * Current state of filtering.
     */
    artifact: DataViewFilteringArtifacts;
    /**
     * Resolved filter, which can be passed to a query.
     */
    filter: Filter<never>;
    /**
     * Registered filter types.
     */
    filterTypes: DataViewFilterHandlerRegistry;
};

/** @internal */
export declare const DataViewFilteringStateContext: React_2.Context<DataViewFilteringState>;

/** @internal */
export declare const DataViewFilterNameContext: React_2.Context<string>;

export declare interface DataViewFilterProps {
    name: string;
    filterHandler: DataViewFilterHandler<any>;
    children?: React.ReactNode;
}

/**
 * Sets the name of the filter for all children.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewFilterScopeProps} for details.
 */
export declare const DataViewFilterScope: ({ name, children }: DataViewFilterScopeProps) => JSX_2.Element;

export declare interface DataViewFilterScopeProps {
    /**
     * The name of the filter.
     */
    name: string;
    children: React.ReactNode;
}

/** @internal */
export declare const DataViewGlobalKeyContext: React_2.Context<string>;

/**
 * Renders children only if a filter type with the given name is registered.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewHasFilterTypeProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewHasFilterType name="text">
 *     //  Filter controls here
 * </DataViewHasFilterType>
 * ```
 */
export declare const DataViewHasFilterType: ({ name, children }: DataViewHasFilterTypeProps) => JSX_2.Element | null;

export declare interface DataViewHasFilterTypeProps {
    /**
     * The name of the filter type to check for.
     */
    name: string;
    /**
     * The children to render if the filter type is registered.
     */
    children: React.ReactNode;
}

/**
 * Provides a has-many filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, options, children
 *
 * See {@link DataViewHasManyFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewHasManyFilter field="tags">
 *     //  Filter controls here
 * <DataViewFilterName>
 * ```
 */
export declare const DataViewHasManyFilter: React_2.NamedExoticComponent<DataViewHasManyFilterProps>;

export declare interface DataViewHasManyFilterProps {
    /**
     * The field to filter by.
     */
    field: SugaredRelativeEntityList['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * Optional list of entities to filter by.
     * If not provided, the filter will use the entity associated with the field.
     */
    options?: SugaredQualifiedEntityList['entities'];
    /**
     * The content or UI controls to render inside the filter.
     */
    children: React_2.ReactNode;
}

/**
 * Provides a has-one filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, options, children
 *
 * See {@link DataViewHasOneFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewHasOneFilter field="author">
 *     //  Filter controls here
 * <DataViewFilterName>
 * ```
 */
export declare const DataViewHasOneFilter: React_2.NamedExoticComponent<DataViewHasOneFilterProps>;

export declare interface DataViewHasOneFilterProps {
    /**
     * The field to filter by.
     */
    field: SugaredRelativeSingleEntity['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * Optional list of entities to filter by.
     * If not provided, the filter will use the entity associated with the field.
     */
    options?: SugaredQualifiedEntityList['entities'];
    /**
     * The content or UI controls to render inside the filter.
     */
    children: React_2.ReactNode;
}

export declare interface DataViewHighlightEvent {
    entity: EntityAccessor;
    element: HTMLElement;
}

/** @internal */
export declare const DataViewHighlightIndexContext: React_2.Context<number | null>;

/**
 * A component that highlights the current entity in a data view.
 */
export declare const DataViewHighlightRow: React_2.ForwardRefExoticComponent<DataViewHighlightRowProps & React_2.RefAttributes<HTMLElement>>;

export declare interface DataViewHighlightRowProps {
    children: ReactNode;
    onHighlight?: (event: DataViewHighlightEvent) => void;
}

/** @internal */
export declare const DataViewInfiniteLoadAccessorsContext: React_2.Context<EntityListAccessor[]>;

export declare const DataViewInfiniteLoadEachRow: React_2.NamedExoticComponent<{
    children: ReactNode;
}>;

export declare const DataViewInfiniteLoadProvider: React_2.NamedExoticComponent<{
    children: ReactNode;
}>;

export declare const DataViewInfiniteLoadScrollObserver: () => JSX_2.Element;

/**
 * A trigger component for infinite loading in a data view.
 * Automatically disables the trigger when no more data is available.
 * Note: Infinite load is not enabled by default. Use `DataViewInfiniteLoadProvider` to enable it.
 *
 * ## Props
 * - **`children`**: The button or element used as the trigger.
 *
 * #### Example
 * ```tsx
 * <DataViewInfiniteLoadTrigger>
 *     <button>Load More</button>
 * </DataViewInfiniteLoadTrigger>
 * ```
 */
export declare const DataViewInfiniteLoadTrigger: React_2.ForwardRefExoticComponent<{
    children: ReactElement;
} & React_2.RefAttributes<HTMLButtonElement>>;

/** @internal */
export declare const DataViewInfiniteLoadTriggerContext: React_2.Context<(() => void) | undefined>;

export declare type DataViewInfo = {
    paging: DataViewPagingInfo;
};

/**
 * Provides a filter within a data view to check whether a field is defined.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewIsDefinedFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewIsDefinedFilter field="profilePicture">
 *   //  Filter controls here
 * </DataViewIsDefinedFilter>
 * ```
 */
export declare const DataViewIsDefinedFilter: NamedExoticComponent<DataViewIsDefinedFilterProps>;

export declare interface DataViewIsDefinedFilterProps {
    /**
     * The field to apply the "is defined" filter to.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * The content or UI controls to render inside the filter.
     * Typically, this includes filter triggers or related components.
     */
    children: React.ReactNode;
}

/**
 * A component that listens for keyboard events and dispatches them to the data view.
 */
export declare const DataViewKeyboardEventHandler: React_2.ForwardRefExoticComponent<{
    children: ReactNode;
} & React_2.RefAttributes<HTMLElement>>;

/** @internal */
export declare const DataViewKeyboardEventHandlerContext: React_2.Context<React_2.KeyboardEventHandler<Element>>;

/**
 * The `DataViewKeyProvider` component is responsible for providing a global key for the DataView.
 * This global key is primarily used to distinguish between multiple DataViews, such as when storing or retrieving state in local storage.
 */
export declare const DataViewKeyProvider: ({ children, value }: {
    children: React.ReactNode;
    value: string;
}) => JSX_2.Element;

/**
 * Conditionally renders its children based on the current layout state of a data view.
 *
 * ## Props
 * - name, label, children
 *
 * See {@link DataViewLayoutProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewLayout name={'grid'} label="Grid">
 *     //  Grid layout content here
 * </DataViewLayout>
 * ```
 */
export declare const DataViewLayout: NamedExoticComponent<DataViewLayoutProps>;

export declare interface DataViewLayoutProps {
    /**
     * The name of the layout.
     */
    name: string;
    /**
     * Label of the layout. Collected during static-render process and might be used e.g. for layout switcher.
     */
    label?: ReactNode;
    /**
     * The content to render if the layout is active.
     */
    children: ReactNode;
}

/**
 * A trigger component for switching the layout of a data view (e.g., table vs. tiles).
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewLayoutTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current layout matches the trigger's layout name.
 * - **`data-current`**: Reflects the name of the currently active layout.
 *
 * #### Example
 * ```tsx
 * <DataViewLayoutTrigger name="table">
 *     <button>Table View</button>
 * </DataViewLayoutTrigger>
 * <DataViewLayoutTrigger name="tiles">
 *     <button>Tile View</button>
 * </DataViewLayoutTrigger>
 * ```
 */
export declare const DataViewLayoutTrigger: ForwardRefExoticComponent<DataViewLayoutTriggerProps & RefAttributes<HTMLButtonElement>>;

export declare interface DataViewLayoutTriggerAttributes {
    ['data-active']?: '';
    ['data-current']?: string;
}

export declare interface DataViewLayoutTriggerProps {
    /**
     * The name of the layout this trigger activates (e.g., "table" or "tiles").
     */
    name: string | undefined;
    /**
     * The button element for the layout trigger.
     */
    children: ReactElement;
}

/**
 * Renders children based on the DataView loading state.
 *
 * ## Props
 * - loaded, refreshing, initial, failed
 *
 * See {@link DataViewLoaderStateProps} for more details.
 *
 * #### Example
 * ```tsx
 * <DataViewLoaderState loaded>
 *     <p>Data loaded</p>
 * </DataViewLoaderState>
 * <DataViewLoaderState refreshing>
 *     <p>Refreshing data</p>
 * </DataViewLoaderState>
 * ```
 */
export declare const DataViewLoaderState: ({ children, ...props }: DataViewLoaderStateProps) => JSX_2.Element | null;

/** @internal */
export declare const DataViewLoaderStateContext: React_2.Context<"initial" | "failed" | "refreshing" | "loaded">;

export declare interface DataViewLoaderStateProps {
    children: ReactNode;
    /**
     * Render children when the DataView is loaded.
     */
    loaded?: boolean;
    /**
     * Render children when the DataView is refreshing.
     * This means that the DataView is currently loading new data, but the old data is still available.
     */
    refreshing?: boolean;
    /**
     * Render children when the DataView is initial.
     * This means that the DataView has not yet loaded any data.
     */
    initial?: boolean;
    /**
     * Render children when the DataView has failed to load.
     */
    failed?: boolean;
}

export declare type DataViewMethods = {
    paging: DataViewPagingMethods;
    sorting: DataViewSortingMethods;
    filtering: DataViewFilteringMethods;
    selection: DataViewSelectionMethods;
};

/**
 * Renders children when the DataView is not empty.
 */
export declare const DataViewNonEmpty: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

export declare type DataViewNullFilterState = 'include' | 'exclude' | 'none';

/**
 *
 * A trigger component for managing null filters in a data view.
 *
 * ## Props
 * - name, action, children
 *
 * See {@link DataViewNullFilterTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current filter state matches the action.
 * - **`data-current`**: Indicates the current filter state, which can be:
 *   - `'include'`: Null values are included in the filter.
 *   - `'exclude'`: Null values are excluded from the filter.
 *   - `'none'`: The filter is not active.
 *
 * #### Example
 * ```tsx
 * <DataViewNullFilterTrigger action="toggleInclude">
 *     <button>Include Nulls</button>
 * </DataViewNullFilterTrigger>
 * ```
 */
export declare const DataViewNullFilterTrigger: React_2.ForwardRefExoticComponent<DataViewNullFilterTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewNullFilterTriggerAttributes {
    ['data-active']?: '';
    ['data-current']: DataViewNullFilterState;
}

export declare interface DataViewNullFilterTriggerProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * - **`action`**: Determines how the filter behaves when the button is clicked:
     *   - `'include'`: Sets the filter to include null values.
     *   - `'exclude'`: Sets the filter to exclude null values.
     *   - `'unset'`: Removes the filter.
     *   - `'toggleInclude'`: Toggles the value in the inclusion filter.
     *   - `'toggleExclude'`: Toggles the value in the exclusion filter.
     */
    action: DataViewSetNullFilterAction;
    /**
     * The button element.
     */
    children: ReactElement;
}

/**
 * Provides a number range filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewNumberFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewNumberFilter field="price">
 *   //  Filter controls here
 * </DataViewNumberFilter>
 * ```
 */
export declare const DataViewNumberFilter: React_2.NamedExoticComponent<DataViewNumberFilterProps>;

/**
 * A component for rendering an input field to filter data view by numeric ranges.
 * Automatically binds the input to the number filter state in the data view.
 *
 * ## Props
 * - name, type, allowFloat, children
 *
 * See {@link DataViewNumberFilterInputProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewNumberFilterInput type="from" allowFloat>
 *     <input placeholder="Minimum Value" />
 * </DataViewNumberFilterInput>
 * <DataViewNumberFilterInput type="to">
 *     <input placeholder="Maximum Value" />
 * </DataViewNumberFilterInput>
 * ```
 */
export declare const DataViewNumberFilterInput: React_2.ForwardRefExoticComponent<DataViewNumberFilterInputProps & React_2.RefAttributes<HTMLInputElement>>;

export declare interface DataViewNumberFilterInputProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * Specifies whether the input corresponds to the `from` or `to` value of the numeric range.
     */
    type: 'from' | 'to';
    /**
     * Indicates whether floating-point numbers are allowed. Defaults to `false`.
     */
    allowFloat?: boolean;
    /**
     * The input element for the number filter.
     */
    children: ReactElement;
}

export declare interface DataViewNumberFilterProps {
    /**
     * The field to apply the number range filter to.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * The content or UI controls to render inside the filter.
     * Typically, this includes filter triggers or related components.
     */
    children: React_2.ReactNode;
}

/**
 * A trigger component to reset a number range filter in a data view.
 * - Resets the filter's `from` and `to` values to `undefined`.
 * - If the filter is already unset (both `from` and `to` are `undefined`), the trigger will not render.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewNumberFilterResetTriggerProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewNumberFilterResetTrigger>
 *     <button>Reset Filter</button>
 * </DataViewNumberFilterResetTrigger>
 * ```
 */
export declare const DataViewNumberFilterResetTrigger: React_2.ForwardRefExoticComponent<DataViewNumberFilterResetTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewNumberFilterResetTriggerProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * The button element.
     */
    children: ReactElement;
}

/**
 * Information about paging.
 */
export declare type DataViewPagingInfo = {
    /**
     * Total number of items.
     */
    totalCount: number | undefined;
    /**
     * Total number of pages.
     */
    pagesCount: number | undefined;
};

/** @internal */
export declare const DataViewPagingInfoContext: React_2.Context<DataViewPagingInfo>;

/**
 * Methods for paging. Available using {@link useDataViewPagingMethods}.
 */
export declare type DataViewPagingMethods = {
    /**
     * Refresh the total count of items.
     */
    refreshTotalCount: () => void;
    /**
     * Go to a specific page.
     * Can be 'first', 'next', 'previous', 'last' or a number (0-based).
     */
    goToPage: (page: number | 'first' | 'next' | 'previous' | 'last') => void;
    /**
     * Change the number of items per page.
     */
    setItemsPerPage: (newItemsPerPage: number | null) => void;
};

/** @internal */
export declare const DataViewPagingMethodsContext: React_2.Context<DataViewPagingMethods>;

export declare interface DataViewPagingProps {
    /**
     * Initial items per page if not available in storage.
     * @defaultValue 50
     */
    initialItemsPerPage?: number | null;
    /**
     * Storage for current page state.
     * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
     */
    currentPageStateStorage?: StateStorageOrName;
    /**
     * Storage for paging settings (items per page).
     * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
     */
    pagingSettingsStorage?: StateStorageOrName;
}

/**
 * Current state of paging. Available using {@link useDataViewPagingState}.
 */
export declare type DataViewPagingState = {
    /**
     * Current page index (0-based).
     */
    pageIndex: number;
    /**
     * Number of items per page.
     */
    itemsPerPage: number | null;
};

/** @internal */
export declare const DataViewPagingStateContext: React_2.Context<DataViewPagingState>;

/**
 * A component that invokes a render function with the current paging state and info.
 */
export declare const DataViewPagingStateView: ({ render }: DataViewPagingStateViewProps) => JSX_2.Element;

export declare interface DataViewPagingStateViewProps {
    /**
     * The render function. Receives the current paging state and info.
     */
    render: (props: DataViewPagingState & DataViewPagingInfo) => ReactNode;
}

export declare type DataViewProps = {
    children: ReactNode;
    onSelectHighlighted?: (entity: EntityAccessor) => void;
    queryField?: DataViewUnionFilterFields;
} & UseDataViewArgs;

export declare const DataViewQueryFilterName = "_query";

/** @internal */
export declare const DataViewRelationFilterArgsContext: React_2.Context<{
    options: SugaredQualifiedEntityList["entities"];
}>;

export declare type DataViewRelationFilterCurrent = 'include' | 'exclude' | 'none';

/**
 * Renders a list of active entities in a relation filter.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewRelationFilterListProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewRelationFilterList>
 *     <Field field="name" />
 * </DataViewRelationFilterList>
 * ```
 */
export declare const DataViewRelationFilterList: React_2.NamedExoticComponent<DataViewRelationFilterListProps>;

export declare interface DataViewRelationFilterListProps {
    /**
     * The name of the relation filter.
     */
    name?: string;
    /**
     * The content to render for each entity.
     */
    children: ReactNode;
}

/**
 * Initializes a data view for selecting relation filter options.
 */
export declare const DataViewRelationFilterOptions: ({ children, name, ...props }: {
    name?: string;
    children: React_2.ReactNode;
} & Omit<DataViewProps, "entities">) => JSX_2.Element;

/**
 * Conditionally renders its children based on the current relation filter state.
 * If children is a valid React element, it will be wrapped in a Slot component with the current state as a `data-current` attribute.
 */
export declare const DataViewRelationFilterState: ({ name, children, state }: {
    name?: string;
    children: ReactNode;
    state?: DataViewRelationFilterCurrent | DataViewRelationFilterCurrent[];
}) => JSX_2.Element | null;

/**
 * A trigger component for managing relation filters in a data view.
 *
 * ## Props
 * - name, action, children
 *
 * See {@link DataViewRelationFilterTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current filter state matches the toggled action.
 * - **`data-current`**: Indicates the current filter state, which can be:
 *   - `'include'`: The relation is included in the filter.
 *   - `'exclude'`: The relation is excluded from the filter.
 *   - `'none'`: The relation is not active in the filter.
 *
 * #### Example
 * ```tsx
 * <DataViewRelationFilterTrigger action="toggleInclude">
 *     <button>Include Relation</button>
 * </DataViewRelationFilterTrigger>
 * ```
 */
export declare const DataViewRelationFilterTrigger: React_2.ForwardRefExoticComponent<DataViewRelationFilterTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewRelationFilterTriggerAttributes {
    ['data-active']?: '';
    ['data-current']: DataViewRelationFilterCurrent;
}

export declare interface DataViewRelationFilterTriggerProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * Determines how the filter behaves when the button is clicked:
     * - `'include'`: Sets the filter to include the relation.
     * - `'exclude'`: Sets the filter to exclude the relation.
     * - `'unset'`: Removes the filter.
     * - `'toggleInclude'`: Toggles the relation in the inclusion filter.
     * - `'toggleExclude'`: Toggles the relation in the exclusion filter.
     */
    action?: DataViewSetRelationFilterAction;
    /**
     * The button element for the filter trigger.
     */
    children: ReactElement;
}

/** @internal */
export declare const DataViewReloadContext: React_2.Context<() => void>;

/**
 * A trigger component to reload a data view.
 *
 * ## Props
 * - **`children`**: The button element for the reload trigger.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-state`**: Reflects the current state of the data view loader (e.g., `'loading'`, `'loaded'`, `'failed'`, `'refreshing'`, `'initial'`).
 *
 * #### Example
 * ```tsx
 * <DataViewReloadTrigger>
 *     <button>Reload</button>
 * </DataViewReloadTrigger>
 * ```
 */
export declare const DataViewReloadTrigger: React_2.ForwardRefExoticComponent<DataViewReloadTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewReloadTriggerAttributes {
    ['data-state']: EntityListSubTreeLoaderState;
}

export declare interface DataViewReloadTriggerProps {
    /**
     * The button element for the reload trigger.
     */
    children: ReactElement;
}

export declare const dataViewSelectionEnvironmentExtension: Environment.Extension<DataViewSelectionValues, DataViewSelectionValues>;

export declare type DataViewSelectionLayout = {
    name: string;
    label?: ReactNode;
};

export declare type DataViewSelectionMethods = {
    /**
     * Change the layout.
     */
    setLayout: (layout: SetStateAction<string | undefined>) => void;
    /**
     * Change the visibility of a column.
     */
    setVisibility: (key: string, visible: SetStateAction<boolean | undefined>) => void;
};

/** @internal */
export declare const DataViewSelectionMethodsContext: React_2.Context<DataViewSelectionMethods>;

export declare type DataViewSelectionProps = {
    /**
     * Initial selection state if not available in storage.
     */
    initialSelection?: DataViewSelectionValues | ((stored: DataViewSelectionValues) => DataViewSelectionValues);
    /**
     * Storage for selection state.
     * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
     */
    selectionStateStorage?: StateStorageOrName;
    /**
     * List of available layouts.
     * Can also be defined using {@link DataViewLayout} component.
     */
    layouts?: DataViewSelectionLayout[];
};

/**
 * Contains the current selection state of the DataView. This includes the current layout and visibility of columns.
 * Available using {@link useDataViewSelectionState}.
 */
export declare type DataViewSelectionState = {
    /**
     * Actual selection values.
     */
    values: DataViewSelectionValues;
    /**
     * Available layouts.
     */
    layouts: DataViewSelectionLayout[];
};

/** @internal */
export declare const DataViewSelectionStateContext: React_2.Context<DataViewSelectionState>;

export declare type DataViewSelectionValues = {
    /**
     * Current layout.
     */
    layout?: string;
    /**
     * Visibility of columns.
     */
    visibility?: {
        [key: string]: boolean | undefined;
    };
};

export declare type DataViewSetBooleanFilterAction = 'include' | 'unset' | 'toggle';

export declare type DataViewSetColumnSorting = (key: string, columnOrderBy: DataViewSortingDirectionAction, append?: boolean) => void;

export declare type DataViewSetEnumFilterAction = 'include' | 'exclude' | 'unset' | 'toggleInclude' | 'toggleExclude';

export declare type DataViewSetFilter = <FA extends DataViewFilterArtifact = DataViewFilterArtifact>(key: string, filter: SetStateAction<FA | undefined>) => void;

/**
 * A trigger component for setting the number of items per page in a data view.
 *
 * ## Props
 * - **`value`**: The number of items per page to set when the trigger is clicked.
 * - **`children`**: The button element for the items-per-page trigger.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current items-per-page value matches the trigger's `value`.
 *
 * #### Example
 * ```tsx
 * <DataViewSetItemsPerPageTrigger value={10}>
 *     <button>Show 10 Items</button>
 * </DataViewSetItemsPerPageTrigger>
 * <DataViewSetItemsPerPageTrigger value={20}>
 *     <button>Show 20 Items</button>
 * </DataViewSetItemsPerPageTrigger>
 * ```
 */
export declare const DataViewSetItemsPerPageTrigger: ForwardRefExoticComponent<DataViewSetItemsPerPageTriggerProps & RefAttributes<HTMLButtonElement>>;

export declare interface DataViewSetItemsPerPageTriggerAttributes {
    ['data-active']?: '';
}

export declare interface DataViewSetItemsPerPageTriggerProps {
    children: ReactNode;
    value: number;
}

export declare type DataViewSetNullFilterAction = 'include' | 'exclude' | 'unset' | 'toggleInclude' | 'toggleExclude';

export declare type DataViewSetRelationFilterAction = 'include' | 'exclude' | 'unset' | 'toggleInclude' | 'toggleExclude';

export declare type DataViewSortingDirection = 'asc' | 'desc' | null;

export declare type DataViewSortingDirectionAction = DataViewSortingDirection | 'next' | 'toggleAsc' | 'toggleDesc' | 'clear';

export declare type DataViewSortingDirections = Record<string, Exclude<DataViewSortingDirection, null>>;

/**
 * Methods for sorting. Available using {@link useDataViewSortingMethods}.
 */
export declare type DataViewSortingMethods = {
    setOrderBy: DataViewSetColumnSorting;
};

/** @internal */
export declare const DataViewSortingMethodsContext: React_2.Context<DataViewSortingMethods>;

export declare type DataViewSortingProps = {
    /**
     * Initial sorting state if not available in storage.
     */
    initialSorting?: DataViewSortingDirections;
    /**
     * Storage for sorting state.
     * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
     */
    sortingStateStorage?: StateStorageOrName;
};

/**
 * Current state of sorting.
 * Available using {@link useDataViewSortingState}.
 */
export declare type DataViewSortingState = {
    /**
     * Current state of sorting.
     */
    directions: DataViewSortingDirections;
    /**
     * Resolved order by expression, which can be passed to a query.
     */
    orderBy: OrderBy;
};

/** @internal */
export declare const DataViewSortingStateContext: React_2.Context<DataViewSortingState>;

export declare const DataViewSortingSwitch: ({ field, ...props }: DataViewSortingSwitchProps) => string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null;

export declare interface DataViewSortingSwitchProps {
    field: string;
    asc?: ReactNode;
    desc?: ReactNode;
    none?: ReactNode;
}

/**
 * A trigger component for managing sorting in a data view.
 * - Clicking the trigger updates the sorting state for the specified field.
 * - Supports multi-sorting if `ctrl` or `meta` key is held during the click.
 * - The trigger updates `data-active` and `data-current` attributes based on the current state.
 *
 * ## Props
 * - **`action`**: Defines how the sorting direction should be updated:
 *   - `'asc'`: Sets sorting direction to ascending.
 *   - `'desc'`: Sets sorting direction to descending.
 *   - `'toggleAsc'`: Toggles the ascending direction (activates if not active, deactivates if already active).
 *   - `'toggleDesc'`: Toggles the descending direction.
 *   - `'next'`: Cycles to the next sorting state (e.g., `asc` → `desc` → `clear`).
 *   - `'clear'`: Removes sorting for the field.
 * - **`field`**: The name of the field being sorted.
 * - **`children`**: The button element for the sorting trigger.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current sorting state matches the specified action.
 * - **`data-current`**: Reflects the current sorting state for the field:
 *   - `'asc'`: Sorted in ascending order.
 *   - `'desc'`: Sorted in descending order.
 *   - `'none'`: No sorting applied.
 *
 * #### Example
 * ```tsx
 * <DataViewSortingTrigger field="name" action="next">
 *     <button>Sort by Name</button>
 * </DataViewSortingTrigger>
 * ```
 */
export declare const DataViewSortingTrigger: ForwardRefExoticComponent<DataViewSortingTriggerProps & RefAttributes<HTMLButtonElement>>;

export declare interface DataViewSortingTriggerAttributes {
    ['data-active']?: '';
    ['data-current']: DataViewSortingDirection | 'none';
}

export declare interface DataViewSortingTriggerProps {
    action?: DataViewSortingDirectionAction;
    field: string;
    children: ReactElement;
}

export declare type DataViewState = {
    entities: QualifiedEntityList;
    key: string;
    paging: DataViewPagingState;
    sorting: DataViewSortingState;
    filtering: DataViewFilteringState;
    selection: DataViewSelectionState;
};

/**
 * Provides a text filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewTextFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewTextFilter field="name">
 *   //  Filter controls here
 * </DataViewTextFilter>
 * ```
 */
export declare const DataViewTextFilter: React_2.NamedExoticComponent<DataViewTextFilterProps>;

/**
 * A component for rendering an input field to filter data view by text.
 * Automatically binds the input to the text filter state in the data view and supports debouncing.
 *
 * ## Props
 * - name, debounceMs, children
 *
 * See {@link DataViewTextFilterInputProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewTextFilterInput debounceMs={300}>
 *     <input placeholder="Search..." />
 * </DataViewTextFilterInput>
 * ```
 */
export declare const DataViewTextFilterInput: React_2.ForwardRefExoticComponent<DataViewTextFilterInputProps & React_2.RefAttributes<HTMLInputElement>>;

export declare interface DataViewTextFilterInputProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * The debounce time in milliseconds for the input value. Default is 500ms.
     */
    debounceMs?: number;
    /**
     * The input element for the text filter.
     */
    children: ReactElement;
}

/**
 * A label component for displaying the current match mode of a text filter in a data view.
 *
 * ## Props
 * - name, render
 *
 * See {@link DataViewTextFilterMatchModeLabelProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewTextFilterMatchModeLabel render={mode => <span>{mode}</span>} />
 * ```
 */
export declare const DataViewTextFilterMatchModeLabel: ({ name, render }: DataViewTextFilterMatchModeLabelProps) => JSX_2.Element;

export declare interface DataViewTextFilterMatchModeLabelProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * The content or UI controls to render inside the label.
     * - If a function, it receives the current match mode and should return a React node.
     * - If an object, it should be a mapping of match modes to React nodes.
     */
    render: ((mode: TextFilterArtifactsMatchMode) => ReactNode) | Record<TextFilterArtifactsMatchMode, ReactNode>;
}

/**
 * A trigger component for managing text filter match modes in a data view.
 *
 * ## Props
 * - name, mode, children
 *
 * See {@link DataViewTextFilterMatchModeTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the trigger's match mode is currently active.
 *
 * #### Example
 * ```tsx
 * <DataViewTextFilterMatchModeTrigger mode="contains">
 *     <button>Contains</button>
 * </DataViewTextFilterMatchModeTrigger>
 * ```
 */
export declare const DataViewTextFilterMatchModeTrigger: React_2.ForwardRefExoticComponent<DataViewTextFilterMatchModeTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewTextFilterMatchModeTriggerProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * Specifies the match mode for the text filter (matches, matchesExactly, startsWith, endsWith, 'doesNotMatch)
     */
    mode: TextFilterArtifactsMatchMode;
    /**
     * The button element that triggers the match mode change.
     */
    children: ReactElement;
}

export declare interface DataViewTextFilterProps {
    /**
     * The field to apply the text filter to.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * An optional custom name for the filter.
     * Defaults to the field name if not provided.
     */
    name?: string;
    /**
     * The content or UI controls to render inside the filter.
     * Typically, this includes filter triggers or related components.
     */
    children: React_2.ReactNode;
}

/**
 * A trigger component to reset a text filter in a data view. If the filter is already unset (`query` is empty), the trigger will not render.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewTextFilterResetTriggerProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewTextFilterResetTrigger>
 *     <button>Reset Filter</button>
 * </DataViewTextFilterResetTrigger>
 * ```
 */
export declare const DataViewTextFilterResetTrigger: React_2.ForwardRefExoticComponent<DataViewTextFilterResetTriggerProps & React_2.RefAttributes<HTMLButtonElement>>;

export declare interface DataViewTextFilterResetTriggerProps {
    /**
     * The name of the filter. If not provided, the component will attempt to infer it from the context.
     */
    name?: string;
    /**
     * The button element that triggers the reset action.
     */
    children: ReactElement;
}

export declare type DataViewUnionFilterFields = SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][];

/**
 * Provides a union text filter within a data view, enabling filtering across multiple fields.
 *
 * This component supports filtering by combining multiple fields using a union operation.
 * It provides context for children and handles filter creation automatically.
 *
 * ## Props
 * - fields, name, children
 *
 * See {@link DataViewUnionTextFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewUnionTextFilter name="search" fields={['title', 'description']}>
 *   //  Filter controls here
 * </DataViewUnionTextFilter>
 * ```
 */
export declare const DataViewUnionTextFilter: React_2.NamedExoticComponent<DataViewUnionTextFilterProps>;

export declare interface DataViewUnionTextFilterProps {
    /**
     * The field or fields to apply the union text filter to.
     * Can be a single field or an array of fields.
     */
    fields: SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][];
    /**
     * The name of the filter.
     * This is required and should be unique for each filter instance.
     */
    name: string;
    /**
     * The content or UI controls to render inside the filter.
     * Typically, this includes filter triggers or related components.
     */
    children: React_2.ReactNode;
}

/**
 * A trigger component to toggle visibility of an element (e.g., a column in a table or a part of a tile).
 *
 * ## Props
 * - **`name`**: The name of the element whose visibility is being controlled.
 * - **`value`**: The visibility state to set when the trigger is clicked (e.g., `true` or `false`).
 * - **`fallbackValue`**: The default visibility state if no explicit state is available (defaults to `true`).
 * - **`children`**: The button element for the visibility trigger.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the visibility state matches the trigger's `value`.
 * - **`data-current`**: Present if visible.
 *
 * #### Example
 * ```tsx
 * <DataViewVisibilityTrigger name="column1" value={true}>
 *     <button>Show Column 1</button>
 * </DataViewVisibilityTrigger>
 * <DataViewVisibilityTrigger name="column1" value={false}>
 *     <button>Hide Column 1</button>
 * </DataViewVisibilityTrigger>
 * <DataViewVisibilityTrigger name="column1" value={it => !it}>
 *     <button>Toggle Column 1</button>
 * </DataViewVisibilityTrigger>
 * ```
 */
export declare const DataViewVisibilityTrigger: ForwardRefExoticComponent<DataViewVisibilityTriggerProps & RefAttributes<HTMLButtonElement>>;

export declare interface DataViewVisibilityTriggerAttributes {
    ['data-active']?: '';
    ['data-current']?: '';
}

export declare interface DataViewVisibilityTriggerProps {
    name: string;
    value: SetStateAction<boolean | undefined>;
    fallbackValue?: boolean;
    children: ReactElement;
}

export declare type DateRangeFilterArtifacts = {
    start?: string;
    end?: string;
    nullCondition?: boolean;
};

export declare type EnumFilterArtifacts = {
    values?: string[];
    notValues?: string[];
    nullCondition?: boolean;
};

export declare type EnumListFilterArtifacts = {
    values?: string[];
    notValues?: string[];
    nullCondition?: boolean;
};

export declare interface ExportFactory {
    create(args: ExportFormatterCreateOutputArgs): ExportResult;
}

export declare interface ExportFormatterCreateOutputArgs {
    data: any[];
    marker: EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker;
}

export declare interface ExportResult {
    blob: Blob;
    extension: string;
}

export declare type GenericTextCellFilterArtifacts = {
    mode?: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch';
    query?: string;
};

export declare type IsDefinedFilterArtifacts = {
    nullCondition?: boolean;
};

export declare type NumberFilterArtifacts = {
    mode: 'eq' | 'gte' | 'lte';
    query: number | null;
    nullCondition: boolean;
};

export declare type NumberRangeFilterArtifacts = {
    from?: number;
    to?: number;
    nullCondition?: boolean;
};

export declare type RelationFilterArtifacts = {
    id?: EntityId[];
    notId?: EntityId[];
    nullCondition?: boolean;
};

export declare type TextFilterArtifacts = {
    mode?: TextFilterArtifactsMatchMode;
    query?: string;
    nullCondition?: boolean;
};

export declare type TextFilterArtifactsMatchMode = 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch';

/**
 * Low-level hook for initializing a data view with fine-grained control over its state. Use together with {@link ControlledDataView}.
 * Use with caution, prefer the {@link DataView} component for most use cases.
 */
export declare const useDataView: (args: UseDataViewArgs) => UseDataViewResult;

export declare type UseDataViewArgs = {
    /**
     * Data view key. If not provided, it will be generated from the entities and global key.
     */
    dataViewKey?: string;
    /**
     * List of entities to display in the data view.
     */
    entities: SugaredQualifiedEntityList['entities'];
} & DataViewFilteringProps & DataViewSortingProps & DataViewPagingProps & DataViewSelectionProps;

export declare type UseDataViewBooleanFilter = [
current: DataViewBooleanFilterCurrent,
set: (value: DataViewSetBooleanFilterAction) => void
];

export declare const useDataViewBooleanFilter: (name: string, value: boolean) => UseDataViewBooleanFilter;

export declare const useDataViewBooleanFilterFactory: (name: string) => (value: boolean) => UseDataViewBooleanFilter;

/**
 * Provides the children of the data view.
 */
export declare const useDataViewChildren: () => React_2.ReactNode;

export declare const useDataViewCurrentKey: () => string;

export declare const useDataViewDateFilterInput: ({ name, type }: UseDataViewDateFilterInputProps) => UseDataViewDateFilterInputResult;

export declare type UseDataViewDateFilterInputProps = {
    name: string;
    type: 'start' | 'end';
};

export declare interface UseDataViewDateFilterInputResult {
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Provides the displayed state of the data view. This is the state that matches the displayed data, not desired state.
 */
export declare const useDataViewDisplayedState: <T extends DataViewState>() => T | undefined;

/**
 * Hook for getting all DataView elements from the children.
 * Used for visibility toggling.
 */
export declare const useDataViewElements: ({ selection }?: {
    selection?: DataViewSelectionValues;
}) => DataViewElementData[];

/**
 * Provides the current entity list accessor for the data view.
 */
export declare const useDataViewEntityListAccessor: () => EntityListAccessor | undefined;

/**
 * Provides currently displayed entity list props.
 */
export declare const useDataViewEntityListProps: () => QualifiedEntityList;

export declare type UseDataViewEnumFilter = [
current: DataViewEnumFilterCurrent,
set: (value: DataViewSetEnumFilterAction) => void
];

export declare const useDataViewEnumFilter: (name: string, value: string) => UseDataViewEnumFilter;

/**
 * Provides information about the enum filter in current context.
 */
export declare const useDataViewEnumFilterArgs: () => {
    enumName: string;
};

export declare const useDataViewEnumFilterFactory: (name: string) => (value: string) => UseDataViewEnumFilter;

/**
 * Hook for fetching all data matching the current filter. Used for exporting data.
 */
export declare const useDataViewFetchAllData: ({ children }: {
    children: ReactNode;
}) => () => Promise<{
    marker: EntityListSubTreeMarker;
    data: ReceivedEntityData[];
}>;

/**
 * Hook for accessing state and methods for a specific data view filter.
 */
export declare const useDataViewFilter: <T extends DataViewFilterArtifact>(key: string) => UseDataViewFilterResult<T>;

export declare const useDataViewFilterHandlerRegistry: () => DataViewFilterHandlerRegistry;

/**
 * Provides methods to change the filtering state. See {@link DataViewFilteringMethods}.
 */
export declare const useDataViewFilteringMethods: () => DataViewFilteringMethods;

/**
 * Provides the desired filtering state. See {@link DataViewFilteringState}.
 */
export declare const useDataViewFilteringState: () => DataViewFilteringState;

/**
 * Provides the name of the filter in current context.
 */
export declare const useDataViewFilterName: () => string;

export declare type UseDataViewFilterResult<T extends DataViewFilterArtifact> = [
state: T | undefined,
action: (filter: SetStateAction<T | undefined>) => void,
meta: {
    isEmpty?: boolean;
}
];

export declare const useDataViewGlobalKey: () => string;

/**
 * Provides the index of the highlighted row.
 */
export declare const useDataViewHighlightIndex: () => number | null;

export declare const useDataViewInfiniteLoadAccessors: () => EntityListAccessor[];

export declare const useDataViewInfiniteLoadTrigger: () => (() => void) | undefined;

export declare const useDataViewKeyboardEventHandler: () => React_2.KeyboardEventHandler<Element>;

/**
 * Lower-level state of the data view loader.
 */
export declare const useDataViewLoaderState: () => "initial" | "failed" | "refreshing" | "loaded";

export declare const useDataViewNullFilter: (name: string) => UseDataViewNullFilterResult;

export declare type UseDataViewNullFilterResult = [
state: DataViewNullFilterState,
set: (action: DataViewSetNullFilterAction) => void
];

export declare const useDataViewNumberFilterInput: ({ name, type, allowFloat }: UseDataViewNumberFilterInputProps) => UseDataViewNumberFilterInputResult;

export declare type UseDataViewNumberFilterInputProps = {
    name: string;
    type: 'from' | 'to';
    allowFloat?: boolean;
};

export declare interface UseDataViewNumberFilterInputResult {
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Provides the paging info (total rows count and page count). See {@link DataViewPagingInfo}.
 */
export declare const useDataViewPagingInfo: () => DataViewPagingInfo;

/**
 * Provides methods to change the paging state (page and items per page). See {@link DataViewPagingMethods}.
 */
export declare const useDataViewPagingMethods: () => DataViewPagingMethods;

/**
 * Provides the desired paging state. See {@link DataViewPagingState}.
 */
export declare const useDataViewPagingState: () => DataViewPagingState;

export declare const useDataViewRelationFilter: (name: string, entityId: EntityId) => UseDataViewRelationFilterResult;

export declare const useDataViewRelationFilterArgs: () => {
    options: SugaredQualifiedEntityList["entities"];
};

export declare const useDataViewRelationFilterData: ({ name, children, options }: {
    name: string;
    options: SugaredQualifiedEntityList["entities"];
    children: ReactNode;
}) => [UseEntityListSubTreeLoaderState<unknown>, UseEntityListSubTreeLoaderStateMethods];

export declare const useDataViewRelationFilterFactory: (name: string) => (id: EntityId) => UseDataViewRelationFilterResult;

export declare type UseDataViewRelationFilterResult = [
current: DataViewRelationFilterCurrent,
set: (value: DataViewSetRelationFilterAction) => void
];

/**
 * Provides a function to reload the data view.
 */
export declare const useDataViewReload: () => () => void;

export declare type UseDataViewResult = {
    state: DataViewState;
    info: DataViewInfo;
    methods: DataViewMethods;
};

/**
 * Provides methods to change the selection state (layout and visibility).
 */
export declare const useDataViewSelectionMethods: () => DataViewSelectionMethods;

/**
 * Provides the desired selection state.
 */
export declare const useDataViewSelectionState: () => DataViewSelectionState;

/**
 * Provides methods to change the sorting state. See {@link DataViewSortingMethods}.
 */
export declare const useDataViewSortingMethods: () => DataViewSortingMethods;

/**
 * Provides the desired sorting state. See {@link DataViewSortingState}.
 */
export declare const useDataViewSortingState: () => DataViewSortingState;

/**
 * Utility hook for getting schema of a field.
 */
export declare const useDataViewTargetFieldSchema: (field: SugaredRelativeSingleField["field"]) => {
    field: SchemaColumn;
    entity: SchemaEntity;
};

/**
 * Utility hook for getting schema of a has-many relation field.
 */
export declare const useDataViewTargetHasManySchema: (field: SugaredRelativeEntityList["field"]) => {
    field: SchemaRelation;
    entity: SchemaEntity;
};

/**
 * Utility hook for getting schema of a has-one relation field.
 */
export declare const useDataViewTargetHasOneSchema: (field: SugaredRelativeSingleEntity["field"]) => {
    field: SchemaRelation;
    entity: SchemaEntity;
};

export declare const useDataViewTextFilterInput: ({ name, debounceMs }: {
    name: string;
    debounceMs?: number;
}) => UseDataViewTextFilterInputResult;

export declare interface UseDataViewTextFilterInputResult {
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export declare const useDataViewTextFilterMatchMode: (name: string, mode: TextFilterArtifactsMatchMode) => UseDataViewTextFilterMatchModeResult;

export declare type UseDataViewTextFilterMatchModeResult = [isCurrent: boolean, set: () => void];

export { }
