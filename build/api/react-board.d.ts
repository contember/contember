import { Context } from 'react';
import { EntityAccessor } from '@contember/react-binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';
import { SugaredQualifiedEntityList } from '@contember/react-binding';
import { SugaredRelativeEntityList } from '@contember/react-binding';
import { SugaredRelativeSingleEntity } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

export declare const Board: NamedExoticComponent<BoardProps>;

export declare type BoardAddColumnMethod = (index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;

export declare type BoardAddItemMethod<ColumnValue extends BoardColumnValue> = (column: ColumnValue | null, index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;

export declare const BoardColumn: ({}: {
    children: ReactNode;
}) => null;

export declare const BoardColumnLabel: () => JSX_2.Element | null;

export declare type BoardColumnNode<ColumnValue extends BoardColumnValue = BoardColumnValue> = {
    id: string | number;
    index: number;
    value: ColumnValue | null;
    items: BoardItemNode[];
};

/** @internal */
export declare const BoardColumnsContext: Context<BoardColumnNode[]>;

export declare type BoardColumnValue = BoardStaticColumnValue | EntityAccessor;

export declare type BoardCommonProps = {
    children: ReactNode;
    sortableBy?: string | SugaredRelativeSingleField;
    sortScope?: 'column' | 'board';
};

/** @internal*/
export declare const BoardCurrentColumnContext: Context<BoardColumnNode>;

/** @internal*/
export declare const BoardCurrentItemContext: Context<BoardItemNode & {
column: BoardColumnNode;
}>;

export declare type BoardDynamicColumnsBindingProps = {
    columns: SugaredQualifiedEntityList['entities'];
    columnsSortableBy?: string | SugaredRelativeSingleField;
    discriminationField: string | SugaredRelativeSingleEntity;
};

export declare const BoardEachColumn: {
    ({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
    staticRender({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
};

export declare const BoardEachItem: {
    ({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
    staticRender({ children }: {
        children: ReactNode;
    }): JSX_2.Element;
};

export declare const BoardItem: {
    ({}: {
        children: ReactNode;
    }): null;
    staticRender(): null;
};

export declare type BoardItemNode = {
    id: string | number;
    index: number;
    value: EntityAccessor;
};

export declare type BoardMethods<ColumnValue extends BoardColumnValue = BoardColumnValue> = {
    moveColumn?: BoardMoveColumnMethod;
    addColumn?: BoardAddColumnMethod;
    removeColumn?: BoardRemoveColumnMethod;
    moveItem?: BoardMoveItemMethod<ColumnValue>;
    addItem?: BoardAddItemMethod<ColumnValue>;
    removeItem?: BoardRemoveItemMethod;
};

/** @internal */
export declare const BoardMethodsContext: Context<BoardMethods<any>>;

export declare type BoardMoveColumnMethod = (entity: EntityAccessor, index: number) => void;

export declare type BoardMoveItemMethod<ColumnValue extends BoardColumnValue> = (entity: EntityAccessor, column: ColumnValue | null, index: number) => void;

export declare const BoardNullColumn: ({ children, hideEmpty }: BoardNullColumnProps) => JSX_2.Element | null;

export declare const BoardNullColumnPlaceholder = "__null_column";

export declare type BoardNullColumnProps = {
    children: ReactNode;
    hideEmpty?: boolean;
};

export declare type BoardProps = BoardQualifiedDynamicProps | BoardRelativeDynamicProps | BoardQualifiedStaticProps | BoardRelativeStaticProps;

export declare type BoardQualifiedDynamicProps = BoardCommonProps & BoardDynamicColumnsBindingProps & BoardQualifiedItemsProps;

export declare type BoardQualifiedItemsProps = Pick<SugaredQualifiedEntityList, 'entities' | 'orderBy' | 'limit' | 'offset'>;

export declare type BoardQualifiedStaticProps = BoardCommonProps & BoardStaticColumnsBindingProps & BoardQualifiedItemsProps;

export declare type BoardRelativeDynamicProps = BoardCommonProps & BoardDynamicColumnsBindingProps & BoardRelativeItemsProps;

export declare type BoardRelativeItemsProps = Pick<SugaredRelativeEntityList, 'field' | 'orderBy' | 'limit' | 'offset'>;

export declare type BoardRelativeStaticProps = BoardCommonProps & BoardStaticColumnsBindingProps & BoardRelativeItemsProps;

export declare type BoardRemoveColumnMethod = (entity: EntityAccessor) => void;

export declare type BoardRemoveItemMethod = (entity: EntityAccessor) => void;

export declare type BoardStaticColumnsBindingProps = {
    columns: {
        value: string;
        label: ReactNode;
    }[];
    discriminationField: string | SugaredRelativeSingleField;
};

export declare type BoardStaticColumnValue = {
    value: string;
    label?: ReactNode;
};

export declare const useBoardColumns: <T extends BoardColumnValue = BoardColumnValue>() => BoardColumnNode<T>[];

export declare const useBoardCurrentColumn: () => BoardColumnNode;

export declare const useBoardCurrentItem: () => BoardItemNode & {
    column: BoardColumnNode;
};

export declare const useBoardMethods: <T extends BoardColumnValue = BoardColumnValue>() => BoardMethods<T>;

export { }
