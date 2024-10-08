## API Report File for "@contember/react-board"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { Context } from 'react';
import { EntityAccessor } from '@contember/react-binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';
import { SugaredQualifiedEntityList } from '@contember/react-binding';
import { SugaredRelativeEntityList } from '@contember/react-binding';
import { SugaredRelativeSingleEntity } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

// @public (undocumented)
export const Board: NamedExoticComponent<BoardProps>;

// @public (undocumented)
export type BoardAddColumnMethod = (index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;

// @public (undocumented)
export type BoardAddItemMethod<ColumnValue extends BoardColumnValue> = (column: ColumnValue | null, index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;

// @public (undocumented)
export const BoardColumn: ({}: {
    children: ReactNode;
}) => null;

// @public (undocumented)
export const BoardColumnLabel: () => JSX_2.Element | null;

// @public (undocumented)
export type BoardColumnNode<ColumnValue extends BoardColumnValue = BoardColumnValue> = {
    id: string | number;
    index: number;
    value: ColumnValue | null;
    items: BoardItemNode[];
};

// @internal (undocumented)
export const BoardColumnsContext: Context<BoardColumnNode[]>;

// @public (undocumented)
export type BoardColumnValue = BoardStaticColumnValue | EntityAccessor;

// @public (undocumented)
export type BoardCommonProps = {
    children: ReactNode;
    sortableBy?: string | SugaredRelativeSingleField;
    sortScope?: 'column' | 'board';
};

// @internal (undocumented)
export const BoardCurrentColumnContext: Context<BoardColumnNode>;

// @internal (undocumented)
export const BoardCurrentItemContext: Context<BoardItemNode & {
column: BoardColumnNode;
}>;

// @public (undocumented)
export type BoardDynamicColumnsBindingProps = {
    columns: SugaredQualifiedEntityList['entities'];
    columnsSortableBy?: string | SugaredRelativeSingleField;
    discriminationField: string | SugaredRelativeSingleEntity;
};

// @public (undocumented)
export const BoardEachColumn: {
    ({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
    staticRender({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
};

// @public (undocumented)
export const BoardEachItem: {
    ({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
    staticRender({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
};

// @public (undocumented)
export const BoardItem: {
    ({}: {
        children: ReactNode;
    }): null;
    staticRender(): null;
};

// @public (undocumented)
export type BoardItemNode = {
    id: string | number;
    index: number;
    value: EntityAccessor;
};

// @public (undocumented)
export type BoardMethods<ColumnValue extends BoardColumnValue = BoardColumnValue> = {
    moveColumn?: BoardMoveColumnMethod;
    addColumn?: BoardAddColumnMethod;
    removeColumn?: BoardRemoveColumnMethod;
    moveItem?: BoardMoveItemMethod<ColumnValue>;
    addItem?: BoardAddItemMethod<ColumnValue>;
    removeItem?: BoardRemoveItemMethod;
};

// @internal (undocumented)
export const BoardMethodsContext: Context<BoardMethods<any>>;

// @public (undocumented)
export type BoardMoveColumnMethod = (entity: EntityAccessor, index: number) => void;

// @public (undocumented)
export type BoardMoveItemMethod<ColumnValue extends BoardColumnValue> = (entity: EntityAccessor, column: ColumnValue | null, index: number) => void;

// @public (undocumented)
export const BoardNullColumn: ({ children, hideEmpty }: BoardNullColumnProps) => JSX_2.Element | null;

// @public (undocumented)
export const BoardNullColumnPlaceholder = "__null_column";

// @public (undocumented)
export type BoardNullColumnProps = {
    children: ReactNode;
    hideEmpty?: boolean;
};

// @public (undocumented)
export type BoardProps = BoardQualifiedDynamicProps | BoardRelativeDynamicProps | BoardQualifiedStaticProps | BoardRelativeStaticProps;

// @public (undocumented)
export type BoardQualifiedDynamicProps = BoardCommonProps & BoardDynamicColumnsBindingProps & BoardQualifiedItemsProps;

// @public (undocumented)
export type BoardQualifiedItemsProps = Pick<SugaredQualifiedEntityList, 'entities' | 'orderBy' | 'limit' | 'offset'>;

// @public (undocumented)
export type BoardQualifiedStaticProps = BoardCommonProps & BoardStaticColumnsBindingProps & BoardQualifiedItemsProps;

// @public (undocumented)
export type BoardRelativeDynamicProps = BoardCommonProps & BoardDynamicColumnsBindingProps & BoardRelativeItemsProps;

// @public (undocumented)
export type BoardRelativeItemsProps = Pick<SugaredRelativeEntityList, 'field' | 'orderBy' | 'limit' | 'offset'>;

// @public (undocumented)
export type BoardRelativeStaticProps = BoardCommonProps & BoardStaticColumnsBindingProps & BoardRelativeItemsProps;

// @public (undocumented)
export type BoardRemoveColumnMethod = (entity: EntityAccessor) => void;

// @public (undocumented)
export type BoardRemoveItemMethod = (entity: EntityAccessor) => void;

// @public (undocumented)
export type BoardStaticColumnsBindingProps = {
    columns: {
        value: string;
        label: ReactNode;
    }[];
    discriminationField: string | SugaredRelativeSingleField;
};

// @public (undocumented)
export type BoardStaticColumnValue = {
    value: string;
    label?: ReactNode;
};

// @public (undocumented)
export const useBoardColumns: <T extends BoardColumnValue = BoardColumnValue>() => BoardColumnNode<T>[];

// @public (undocumented)
export const useBoardCurrentColumn: () => BoardColumnNode;

// @public (undocumented)
export const useBoardCurrentItem: () => BoardItemNode & {
    column: BoardColumnNode;
};

// @public (undocumented)
export const useBoardMethods: <T extends BoardColumnValue = BoardColumnValue>() => BoardMethods<T>;

// (No @packageDocumentation comment for this package)

```
