## API Report File for "@contember/react-ui-lib"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { ButtonHTMLAttributes } from 'react';
import { ClassAttributes } from 'react';
import { ForwardRefExoticComponent } from 'react';
import { HTMLAttributes } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';
import { RefAttributes } from 'react';
import { RepeaterAddItemIndex } from '@contember/react-repeater';
import { RepeaterProps } from '@contember/react-repeater';

// @public (undocumented)
export const DefaultRepeater: NamedExoticComponent<DefaultRepeaterProps>;

// @public (undocumented)
export const DefaultRepeaterInner: NamedExoticComponent<DefaultRepeaterProps>;

// @public (undocumented)
export type DefaultRepeaterProps = {
    title?: ReactNode;
    addButtonPosition?: 'none' | 'after' | 'before' | 'around';
} & RepeaterProps;

// @public (undocumented)
export const RepeaterAddItemButton: ({ children, index }: {
    children?: React.ReactNode;
    index?: RepeaterAddItemIndex;
}) => JSX_2.Element;

// @public (undocumented)
export const RepeaterDragOverlayUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: React.ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

// @public (undocumented)
export const RepeaterDropIndicator: ({ position }: {
    position: "before" | "after";
}) => JSX_2.Element;

// @public (undocumented)
export const RepeaterHandleUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLButtonElement> & ButtonHTMLAttributes<HTMLButtonElement> & {
asChild?: boolean;
children?: React.ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLButtonElement>>;

// @public (undocumented)
export const RepeaterItemActions: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: React.ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

// @public (undocumented)
export const RepeaterItemUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: React.ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

// @public (undocumented)
export const RepeaterRemoveItemButton: ({ children }: {
    children?: React.ReactNode;
}) => JSX_2.Element;

// @public (undocumented)
export const RepeaterWrapperUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: React.ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

// (No @packageDocumentation comment for this package)

```