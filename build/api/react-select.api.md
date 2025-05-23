## API Report File for "@contember/react-select"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

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

// @public (undocumented)
export const MultiSelect: React_2.NamedExoticComponent<{
    children: ReactNode;
    field: SugaredRelativeEntityList["field"];
    options?: SugaredQualifiedEntityList["entities"];
} & SelectEvents>;

// @public (undocumented)
export type MultiSelectProps = {
    children: ReactNode;
    field: SugaredRelativeEntityList['field'];
    options?: SugaredQualifiedEntityList['entities'];
} & SelectEvents;

// @public (undocumented)
export const Select: React_2.NamedExoticComponent<{
    children: ReactNode;
    field: SugaredRelativeSingleEntity["field"];
    options?: SugaredQualifiedEntityList["entities"];
    isNonbearing?: boolean;
} & SelectEvents>;

// @internal (undocumented)
export const SelectCurrentEntitiesContext: Context<EntityAccessor[]>;

// @public (undocumented)
export const SelectDataView: (props: SelectDataViewProps) => JSX_2.Element;

// @public (undocumented)
export type SelectDataViewProps = Omit<DataViewProps, 'entities'> & {
    children: ReactNode;
};

// @public (undocumented)
export const SelectEachValue: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element[];

// @public (undocumented)
export interface SelectEvents {
    // (undocumented)
    onSelect?: (entity: EntityAccessor) => void;
    // (undocumented)
    onUnselect?: (entity: EntityAccessor) => void;
}

// @public (undocumented)
export type SelectHandler = (entity: EntityAccessor, action?: 'select' | 'unselect' | 'toggle') => void;

// @internal (undocumented)
export const SelectHandleSelectContext: Context<SelectHandler>;

// @internal (undocumented)
export const SelectIsSelectedContext: Context<(entity: EntityAccessor) => boolean>;

// @public (undocumented)
export const SelectItemTrigger: React_2.ForwardRefExoticComponent<SelectItemTriggerProps & React_2.RefAttributes<HTMLElement>>;

// @public (undocumented)
export type SelectItemTriggerProps = {
    children: ReactElement;
    action?: 'select' | 'unselect' | 'toggle';
    onClick?: (event: React_2.MouseEvent<HTMLElement>) => void;
};

// @public (undocumented)
export const SelectNewItem: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

// @public (undocumented)
export const SelectOption: React_2.ForwardRefExoticComponent<SelectOptionProps & React_2.RefAttributes<HTMLElement>>;

// @public (undocumented)
export type SelectOptionProps = {
    children: ReactNode;
    action?: 'select' | 'unselect' | 'toggle';
};

// @internal (undocumented)
export const SelectOptionsContext: Context<string | {
filter?: SugaredFilter;
hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
entityName: EntityName;
}>;

// @public (undocumented)
export const SelectPlaceholder: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element | null;

// @public (undocumented)
export type SelectProps = {
    children: ReactNode;
    field: SugaredRelativeSingleEntity['field'];
    options?: SugaredQualifiedEntityList['entities'];
    isNonbearing?: boolean;
} & SelectEvents;

// @public (undocumented)
export const SortableMultiSelect: React_2.NamedExoticComponent<{
    children: ReactNode;
    field: SugaredRelativeEntityList["field"];
    options?: SugaredQualifiedEntityList["entities"];
    sortableBy: SugaredRelativeSingleField["field"];
    connectAt: SugaredRelativeSingleEntity["field"];
} & SelectEvents>;

// @public (undocumented)
export type SortableMultiSelectProps = {
    children: ReactNode;
    field: SugaredRelativeEntityList['field'];
    options?: SugaredQualifiedEntityList['entities'];
    sortableBy: SugaredRelativeSingleField['field'];
    connectAt: SugaredRelativeSingleEntity['field'];
} & SelectEvents;

// @public (undocumented)
export const useSelectCurrentEntities: () => EntityAccessor[];

// @public (undocumented)
export const useSelectHandleSelect: () => SelectHandler;

// @public (undocumented)
export const useSelectIsSelected: () => (entity: EntityAccessor) => boolean;

// @public (undocumented)
export const useSelectOptions: () => string | {
    filter?: SugaredFilter;
    hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
    entityName: EntityName;
};

// (No @packageDocumentation comment for this package)

```
