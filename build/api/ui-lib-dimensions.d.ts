import { DataViewSortingDirections } from '@contember/react-dataview';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';
import { SugaredQualifiedEntityList } from '@contember/interface';
import { SugaredRelativeSingleEntity } from '@contember/interface';
import { SugaredRelativeSingleField } from '@contember/interface';

/**
 * Props {@link DimensionsSwitcherProps}.
 *
 * `DimensionsSwitcher` is a UI component for switching between different dimensions of data.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DimensionsSwitcher
 *   dimension="locale"
 *   slugField="code"
 *   options="DimensionsLocale"
 * >
 *   <Field field="label" />
 * </DimensionsSwitcher>
 * ```
 *
 * #### Example: With initial sorting and multi-selection
 * ```tsx
 * <DimensionsSwitcher
 *   dimension="locale"
 *   slugField="code"
 *   options="DimensionsLocale"
 *   orderBy={{ label: 'desc' }}
 *   isMulti
 * >
 *   <Field field="label" />
 * </DimensionsSwitcher>
 * ```
 */
export declare const DimensionsSwitcher: NamedExoticComponent<DimensionsSwitcherProps>;

/**
 * Props for the {@link DimensionsSwitcher} component.
 */
export declare interface DimensionsSwitcherProps {
    /**
     * Entity list for dimension options
     * */
    options: SugaredQualifiedEntityList['entities'];
    /**
     * Specifies initial sorting of the options (e.g., `{ label: 'desc' }`).
     * */
    orderBy?: DataViewSortingDirections;
    /**
     * The name of the dimension to switch.
     * */
    dimension: string;
    /**
     * Child components or fields to render within the dimension selector.
     * */
    children: ReactNode;
    /**
     * Field containing unique dimension identifiers
     * */
    slugField: SugaredRelativeSingleField['field'];
    /**
     * Enables multi-selection mode.
     * */
    isMulti?: boolean;
}

/**
 * Props {@link SideDimensionsProps}.
 *
 * `SideDimensions` is a layout component that renders a dimension within a flexible side panel.
 * It wraps its content inside a `DimensionRenderer` and `HasOne` field relationship.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <SideDimensions
 *   dimension="locale"
 *   as="currentLocale"
 *   field="locales(locale.code = $currentLocale)"
 * >
 *   <InputField field="title" />
 * </SideDimensions>
 * ```
 */
export declare const SideDimensions: NamedExoticComponent<SideDimensionsProps>;

/**
 * Props for the {@link SideDimensions} component.
 */
export declare interface SideDimensionsProps {
    /**
     * The name of the dimension to render.
     */
    dimension: string;
    /**
     * The name of the dimension to use in the context.
     */
    as: string;
    /**
     * The field to filter by.
     */
    field: SugaredRelativeSingleEntity['field'];
    /**
     * Child components or fields to render within the dimension selector.
     */
    children: ReactNode;
}

export { }
