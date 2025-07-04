import { ButtonHTMLAttributes } from 'react';
import { ClassAttributes } from 'react';
import { DataViewSortingDirections } from '@contember/react-dataview';
import { DataViewUnionFilterFields } from '@contember/react-dataview';
import { ForwardRefExoticComponent } from 'react';
import { HTMLAttributes } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { MemoExoticComponent } from 'react';
import { NamedExoticComponent } from 'react';
import { PopoverContentProps } from '@radix-ui/react-popover';
import { ReactNode } from 'react';
import { RefAttributes } from 'react';
import { SugaredQualifiedEntityList } from '@contember/interface';
import { SugaredRelativeEntityList } from '@contember/interface';
import { SugaredRelativeSingleEntity } from '@contember/interface';
import { SugaredRelativeSingleField } from '@contember/interface';

/**
 * Props {@link DefaultSelectDataViewProps}
 *
 * `DefaultSelectDataView` provides a wrapper around `SelectDataView` with a default renderer. It simplifies setting up a data view selection with initial sorting and query field options.
 *
 * Must be used inside a context where `SelectDataView` is valid.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DefaultSelectDataView queryField="status" initialSorting="asc">
 *   <ItemRenderer />
 * </DefaultSelectDataView>
 * ```
 */
export declare const DefaultSelectDataView: NamedExoticComponent<DefaultSelectDataViewProps>;

/**
 * Props for {@link DefaultSelectDataView}.
 */
export declare interface DefaultSelectDataViewProps {
    /**
     * Optional field used for querying the data view.
     */
    queryField?: DataViewUnionFilterFields;
    /**
     * Optional initial sorting direction for the data view.
     */
    initialSorting?: DataViewSortingDirections;
    /**
     * Children elements to be rendered inside the default data view renderer.
     */
    children: ReactNode;
}

/**
 * MultiSelectInput is a component for selecting multiple values from a list of options,
 * with support for inline entity creation, filtering, and sorting.
 *
 * #### Example: Basic usage with inline entity creation
 * ```tsx
 * <MultiSelectInput
 *   field="tags"
 *   placeholder="Select tags"
 *   options={[
 *     { field: 'id', operator: 'eq', value: '1', label: 'Tag 1' },
 *     { field: 'id', operator: 'eq', value: '2', label: 'Tag 2' },
 *   ]}
 *   createNewForm={<div>Form to create a new tag</div>}
 *   initialSorting="ASC"
 * >
 *   <Field field="name" />
 * </MultiSelectInput>
 * ```
 *
 * #### Sub-components
 * - {@link SelectInputWrapperUI}
 * - {@link SelectInputUI}
 * - {@link SelectDefaultPlaceholderUI}
 * - {@link MultiSelectItemWrapperUI}
 * - {@link SelectEachValue}
 * - {@link MultiSelectItemUI}
 * - {@link MultiSelectItemContentUI}
 * - {@link SelectItemTrigger}
 * - {@link MultiSelectItemRemoveButtonUI}
 * - {@link SelectInputActionsUI}
 * - {@link SelectPopoverContent}
 * - {@link Popover}
 * - {@link PopoverTrigger}
 *
 */
export declare const MultiSelectInput: NamedExoticComponent<    {
/** Specifies the field to bind the selection to. */
field: SugaredRelativeEntityList["field"];
/** An array of entities to populate the selection list. */
options?: SugaredQualifiedEntityList["entities"];
/** React nodes for rendering the content of each selected item. */
children: ReactNode;
/** Custom placeholder text when no items are selected. */
placeholder?: ReactNode;
/** Content for creating a new entity. */
createNewForm?: ReactNode;
/** Field used for querying and filtering options. */
queryField?: DataViewUnionFilterFields;
/** Defines the initial sorting order for the options. */
initialSorting?: DataViewSortingDirections;
}>;

export declare type MultiSelectInputProps = {
    /** Specifies the field to bind the selection to. */
    field: SugaredRelativeEntityList['field'];
    /** An array of entities to populate the selection list. */
    options?: SugaredQualifiedEntityList['entities'];
    /** React nodes for rendering the content of each selected item. */
    children: ReactNode;
    /** Custom placeholder text when no items are selected. */
    placeholder?: ReactNode;
    /** Content for creating a new entity. */
    createNewForm?: ReactNode;
    /** Field used for querying and filtering options. */
    queryField?: DataViewUnionFilterFields;
    /** Defines the initial sorting order for the options. */
    initialSorting?: DataViewSortingDirections;
};

/**
 * `MultiSelectItemContentUI` is the UI for the multi-select item content.
 *
 * See more {@link MultiSelectInput}
 *
 * @group MultiSelectInput
 */
export declare const MultiSelectItemContentUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLSpanElement> & HTMLAttributes<HTMLSpanElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLSpanElement>>;

/**
 * `MultiSelectItemDragOverlayUI` is the UI for the multi-select item drag overlay.
 *
 * See more {@link MultiSelectInput}
 *
 * @group MultiSelectInput
 */
export declare const MultiSelectItemDragOverlayUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLSpanElement> & HTMLAttributes<HTMLSpanElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLSpanElement>>;

/**
 * `MultiSelectItemRemoveButtonUI` is the UI for the multi-select item remove button.
 *
 * See more {@link MultiSelectInput}
 *
 * @group MultiSelectInput
 */
export declare const MultiSelectItemRemoveButtonUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLSpanElement> & HTMLAttributes<HTMLSpanElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLSpanElement>>;

/**
 * `MultiSelectItemUI` is the UI for the multi-select item.
 *
 * See more {@link MultiSelectInput}
 *
 * @group MultiSelectInput
 */
export declare const MultiSelectItemUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLSpanElement> & HTMLAttributes<HTMLSpanElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLSpanElement>>;

/**
 * `MultiSelectItemWrapperUI` is the UI for the multi-select item wrapper.
 *
 * See more {@link MultiSelectInput}
 *
 * @group MultiSelectInput
 */
export declare const MultiSelectItemWrapperUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

/**
 * `MultiSelectSortableItemContentUI` is the UI for the multi-select sortable item content.
 *
 * See more {@link MultiSelectInput}
 *
 * @group MultiSelectInput
 */
export declare const MultiSelectSortableItemContentUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLSpanElement> & HTMLAttributes<HTMLSpanElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLSpanElement>>;

/**
 * `SelectCreateNewTrigger` is the UI for the select create new trigger.
 *
 * See more {@link SelectInput}
 *
 * @group SelectInput
 */
export declare const SelectCreateNewTrigger: ForwardRefExoticComponent<RefAttributes<HTMLButtonElement>>;

/**
 * `SelectDefaultFilter` is component for filtering data in a `SelectDataView`.
 * It checks if a specific filter type exists and, if so, renders a text input for filtering.
 *
 * @group SelectInput
 */
export declare const SelectDefaultFilter: MemoExoticComponent<() => JSX_2.Element>;

/**
 * `SelectDefaultPlaceholderUI` is the UI for the select default placeholder.
 *
 * See more {@link SelectInput}
 *
 * @group SelectInput
 * @group MultiSelectInput
 */
export declare const SelectDefaultPlaceholderUI: () => JSX_2.Element;

/**
 * `SelectInput` is a versatile component for rendering a selectable input field with advanced functionality.
 * It supports optional entity creation, validation, and sorting within the context of Contember's interface.
 *
 * #### Example: Basic usage with entity creation
 * ```tsx
 * <SelectInput
 *   field="category"
 *   placeholder="Select a category"
 *   options={[
 *     { field: 'id', operator: 'eq', value: '1', label: 'Option 1' },
 *     { field: 'id', operator: 'eq', value: '2', label: 'Option 2' }
 *   ]}
 *   createNewForm={<div>Form for creating a new category</div>}
 *   required
 * >
 *   <Field field="label" />
 * </SelectInput>
 * ```
 *
 * #### Sub-components
 * - {@link SelectInputWrapperUI}
 * - {@link SelectInputUI}
 * - {@link SelectDefaultPlaceholderUI}
 * - {@link SelectPlaceholder}
 * - {@link SelectInputActionsUI}
 * - {@link SelectListItemUI}
 * - {@link SelectEachValue}
 * - {@link SelectItemTrigger}
 * - {@link SelectPopoverContent}
 * - {@link DefaultSelectDataView}
 * - {@link Popover}
 * - {@link PopoverTrigger}
 */
export declare const SelectInput: NamedExoticComponent<    {
/** The field to bind the selection to (`SugaredRelativeSingleEntity['field']`) */
field: SugaredRelativeSingleEntity["field"];
/** React nodes for rendering each value or additional content inside the selection UI. */
children: ReactNode;
/** Defines the entity options to be displayed. */
options?: SugaredQualifiedEntityList["entities"];
/** Custom placeholder content when no value is selected. */
placeholder?: ReactNode;
/** Content for creating a new entity, displayed within a `CreateEntityDialog`. */
createNewForm?: ReactNode;
/** Specifies the field to query for filtering or sorting. */
queryField?: DataViewUnionFilterFields;
/** Defines the initial sorting order of the options. */
initialSorting?: DataViewSortingDirections;
/** Boolean flag to enforce validation for the selection input. */
required?: boolean;
}>;

/**
 * `SelectInputActionsUI` is the UI for the select action.
 *
 * See more {@link SelectInput}
 *
 * @group SelectInput
 * @group MultiSelectInput
 */
export declare const SelectInputActionsUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLSpanElement> & HTMLAttributes<HTMLSpanElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLSpanElement>>;

export declare type SelectInputProps = {
    /** The field to bind the selection to (`SugaredRelativeSingleEntity['field']`) */
    field: SugaredRelativeSingleEntity['field'];
    /** React nodes for rendering each value or additional content inside the selection UI. */
    children: ReactNode;
    /** Defines the entity options to be displayed. */
    options?: SugaredQualifiedEntityList['entities'];
    /** Custom placeholder content when no value is selected. */
    placeholder?: ReactNode;
    /** Content for creating a new entity, displayed within a `CreateEntityDialog`. */
    createNewForm?: ReactNode;
    /** Specifies the field to query for filtering or sorting. */
    queryField?: DataViewUnionFilterFields;
    /** Defines the initial sorting order of the options. */
    initialSorting?: DataViewSortingDirections;
    /** Boolean flag to enforce validation for the selection input. */
    required?: boolean;
};

/**
 * `SelectInputUI` is the UI input wrapper for the select component.
 *
 * See more {@link SelectInput}
 *
 * @group SelectInput
 */
export declare const SelectInputUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLButtonElement> & ButtonHTMLAttributes<HTMLButtonElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLButtonElement>>;

/**
 * `SelectInputWrapperUI` is the UI input wrapper for the select component.
 *
 * See more {@link SelectInput}
 *
 * @group SelectInput
 */
export declare const SelectInputWrapperUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const SelectListInner: NamedExoticComponent<    {
children: ReactNode;
filterToolbar?: ReactNode;
}>;

/**
 * `SelectListItemUI` is the UI for the select items list.
 *
 * See more {@link SelectInput}
 *
 * @group SelectInput
 */
export declare const SelectListItemUI: ForwardRefExoticComponent<Omit<Omit<ClassAttributes<HTMLButtonElement> & ButtonHTMLAttributes<HTMLButtonElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
} & {
variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
size?: "default" | "icon" | "sm" | "lg" | "xs" | null | undefined;
}, "ref"> & RefAttributes<HTMLButtonElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLButtonElement>>;

export declare type SelectListProps = {
    children: ReactNode;
    filterToolbar?: ReactNode;
};

/**
 * `SelectPopoverContent` is the UI for the select popover content.
 *
 * See more {@link SelectInput}
 *
 * @group SelectInput
 */
export declare const SelectPopoverContent: ForwardRefExoticComponent<Omit<Omit<PopoverContentProps & RefAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

/**
 * `SortableMultiSelectInput` is the UI for the sortable multi select input.
 *
 * See more {@link MultiSelectInput}
 *
 * @group SortableMultiSelectField
 */
export declare const SortableMultiSelectInput: NamedExoticComponent<    {
field: SugaredRelativeEntityList["field"];
/** Field name used to store sort order */
sortableBy: SugaredRelativeSingleField["field"];
/** Field name used to connect the selected entity */
connectAt: SugaredRelativeSingleEntity["field"];
children: ReactNode;
options?: SugaredQualifiedEntityList["entities"];
placeholder?: ReactNode;
createNewForm?: ReactNode;
queryField?: DataViewUnionFilterFields;
initialSorting?: DataViewSortingDirections;
}>;

export declare type SortableMultiSelectInputProps = {
    field: SugaredRelativeEntityList['field'];
    /** Field name used to store sort order */
    sortableBy: SugaredRelativeSingleField['field'];
    /** Field name used to connect the selected entity */
    connectAt: SugaredRelativeSingleEntity['field'];
    children: ReactNode;
    options?: SugaredQualifiedEntityList['entities'];
    placeholder?: ReactNode;
    createNewForm?: ReactNode;
    queryField?: DataViewUnionFilterFields;
    initialSorting?: DataViewSortingDirections;
};

export { }
