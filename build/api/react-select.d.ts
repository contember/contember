import { Context } from 'react';
import { DataViewProps } from '@contember/react-dataview';
import { EntityAccessor } from '@contember/react-binding';
import { EntityName } from '@contember/react-binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { default as React_2 } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { SugarableHasOneRelation } from '@contember/react-binding';
import { SugaredFilter } from '@contember/react-binding';
import { SugaredQualifiedEntityList } from '@contember/react-binding';
import { SugaredRelativeEntityList } from '@contember/react-binding';
import { SugaredRelativeSingleEntity } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

export declare const MultiSelect: React_2.NamedExoticComponent<{
    children: ReactNode;
    field: SugaredRelativeEntityList["field"];
    options?: SugaredQualifiedEntityList["entities"];
} & SelectEvents>;

export declare type MultiSelectProps = {
    children: ReactNode;
    field: SugaredRelativeEntityList['field'];
    options?: SugaredQualifiedEntityList['entities'];
} & SelectEvents;

export declare const Select: React_2.NamedExoticComponent<{
    children: ReactNode;
    field: SugaredRelativeSingleEntity["field"];
    options?: SugaredQualifiedEntityList["entities"];
    isNonbearing?: boolean;
} & SelectEvents>;

/** @internal */
export declare const SelectCurrentEntitiesContext: Context<EntityAccessor[]>;

export declare const SelectDataView: (props: SelectDataViewProps) => JSX_2.Element;

export declare type SelectDataViewProps = Omit<DataViewProps, 'entities'> & {
    children: ReactNode;
};

export declare const SelectEachValue: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element[];

export declare interface SelectEvents {
    onSelect?: (entity: EntityAccessor) => void;
    onUnselect?: (entity: EntityAccessor) => void;
}

export declare type SelectHandler = (entity: EntityAccessor, action?: 'select' | 'unselect' | 'toggle') => void;

/** @internal */
export declare const SelectHandleSelectContext: Context<SelectHandler>;

/** @internal */
export declare const SelectIsSelectedContext: Context<(entity: EntityAccessor) => boolean>;

export declare const SelectItemTrigger: React_2.ForwardRefExoticComponent<SelectItemTriggerProps & React_2.RefAttributes<HTMLElement>>;

export declare type SelectItemTriggerProps = {
    children: ReactElement;
    action?: 'select' | 'unselect' | 'toggle';
    onClick?: (event: React_2.MouseEvent<HTMLElement>) => void;
};

export declare const SelectNewItem: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

export declare const SelectOption: React_2.ForwardRefExoticComponent<SelectOptionProps & React_2.RefAttributes<HTMLElement>>;

export declare type SelectOptionProps = {
    children: ReactNode;
    action?: 'select' | 'unselect' | 'toggle';
};

/** @internal */
export declare const SelectOptionsContext: Context<string | {
filter?: SugaredFilter;
hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
entityName: EntityName;
}>;

export declare const SelectPlaceholder: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

export declare type SelectProps = {
    children: ReactNode;
    field: SugaredRelativeSingleEntity['field'];
    options?: SugaredQualifiedEntityList['entities'];
    isNonbearing?: boolean;
} & SelectEvents;

export declare const SortableMultiSelect: React_2.NamedExoticComponent<{
    children: ReactNode;
    field: SugaredRelativeEntityList["field"];
    options?: SugaredQualifiedEntityList["entities"];
    sortableBy: SugaredRelativeSingleField["field"];
    connectAt: SugaredRelativeSingleEntity["field"];
} & SelectEvents>;

export declare type SortableMultiSelectProps = {
    children: ReactNode;
    field: SugaredRelativeEntityList['field'];
    options?: SugaredQualifiedEntityList['entities'];
    sortableBy: SugaredRelativeSingleField['field'];
    connectAt: SugaredRelativeSingleEntity['field'];
} & SelectEvents;

export declare const useSelectCurrentEntities: () => EntityAccessor[];

export declare const useSelectHandleSelect: () => SelectHandler;

export declare const useSelectIsSelected: () => (entity: EntityAccessor) => boolean;

export declare const useSelectOptions: () => string | {
    filter?: SugaredFilter;
    hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
    entityName: EntityName;
};

export { }
