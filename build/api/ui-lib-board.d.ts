import { BoardProps } from '@contember/react-board';
import { ButtonHTMLAttributes } from 'react';
import { ClassAttributes } from 'react';
import { ForwardRefExoticComponent } from 'react';
import { HTMLAttributes } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';
import { RefAttributes } from 'react';

export declare const BoardCardUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const BoardColumnHandleUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLButtonElement> & ButtonHTMLAttributes<HTMLButtonElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLButtonElement>>;

export declare const BoardColumnHeaderUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const BoardColumnUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const BoardDragOverlayUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const BoardItemHandleUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLButtonElement> & ButtonHTMLAttributes<HTMLButtonElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLButtonElement>>;

export declare const BoardItemsWrapperUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const BoardNonSortableColumn: NamedExoticComponent<    {
children: ReactNode;
columnHeader: ReactNode;
columnFooter?: ReactNode;
nullColumnHeader?: ReactNode;
}>;

export declare const BoardNonSortableItems: NamedExoticComponent<    {
children: ReactNode;
}>;

export declare const BoardSortableColumn: NamedExoticComponent<    {
children: ReactNode;
columnHeader: ReactNode;
columnFooter?: ReactNode;
nullColumnHeader?: ReactNode;
sortable: boolean;
}>;

export declare const BoardSortableItems: NamedExoticComponent<    {
children: ReactNode;
}>;

export declare const BoardWrapperUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

export declare const ColumnDropIndicator: ({ position }: {
    position: "before" | "after";
}) => JSX_2.Element;

export declare const DefaultBoard: NamedExoticComponent<DefaultBoardProps>;

export declare type DefaultBoardProps = {
    columnHeader: ReactNode;
    nullColumnHeader?: ReactNode;
    columnFooter?: ReactNode;
    children: ReactNode;
} & BoardProps;

export declare const ItemDropIndicator: ({ position }: {
    position: "before" | "after";
}) => JSX_2.Element;

export { }
