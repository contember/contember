import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { PropsWithChildren } from 'react';
import { ReactNode } from 'react';
import { SlotSourceComponent } from '@contember/react-slots';
import { SlotTargetComponent } from '@contember/react-slots';

export declare const LayoutBoxedComponent: {
    ({ children, ...rest }: PropsWithChildren<{}>): JSX_2.Element;
    displayName: string;
};

export declare const LayoutComponent: ({ children }: PropsWithChildren) => JSX_2.Element;

export declare const Slots: Readonly<{
    readonly Back: SlotSourceComponent<"Back">;
    readonly Sidebar: SlotSourceComponent<"Sidebar">;
    readonly Title: SlotSourceComponent<"Title">;
    readonly Logo: SlotSourceComponent<"Logo">;
    readonly Navigation: SlotSourceComponent<"Navigation">;
    readonly Footer: SlotSourceComponent<"Footer">;
    readonly Content: SlotSourceComponent<"Content">;
    readonly ContentHeader: SlotSourceComponent<"ContentHeader">;
    readonly Actions: SlotSourceComponent<"Actions">;
    readonly UserNavigation: SlotSourceComponent<"UserNavigation">;
}>;

export declare const SlotTargets: Readonly<{
    readonly Back: SlotTargetComponent<"Back">;
    readonly Sidebar: SlotTargetComponent<"Sidebar">;
    readonly Title: SlotTargetComponent<"Title">;
    readonly Logo: SlotTargetComponent<"Logo">;
    readonly Navigation: SlotTargetComponent<"Navigation">;
    readonly Footer: SlotTargetComponent<"Footer">;
    readonly Content: SlotTargetComponent<"Content">;
    readonly ContentHeader: SlotTargetComponent<"ContentHeader">;
    readonly Actions: SlotTargetComponent<"Actions">;
    readonly UserNavigation: SlotTargetComponent<"UserNavigation">;
}>;

export declare const Title: NamedExoticComponent<    {
children: ReactNode;
}>;

export { }
