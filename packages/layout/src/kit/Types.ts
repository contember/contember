import { ComponentClassNameProps, NestedClassName, PolymorphicComponentPropsWithRef } from '@contember/utilities'
import { ElementType, ReactElement, ReactNode } from 'react'
import { GetLayoutPanelsStateContextType, PanelState } from '../primitives'

export type OwnFrameProps =
	& ComponentClassNameProps
	& {
		footer?: ReactNode;
		footerIsFixed?: boolean;
		footerClassName?: NestedClassName;
		header?: ReactNode;
		headerIsFixed?: boolean;
		headerClassName?: NestedClassName;
		minimumFooterHeight?: number;
		minimumHeaderHeight?: number;
	}

export type FrameProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnFrameProps>

export type FrameComponentType =
	& (<C extends ElementType = 'div'>(props: FrameProps<C>) => React.ReactElement | null)
	& { displayName?: string | undefined }

export type OwnContentPanelProps =
	& Omit<ComponentClassNameProps, 'children'>
	& {
		basis?: number;
		body?: ReactNode | ((state: PanelState) => ReactNode);
		children?: never;
		footer?: ReactNode | ((state: PanelState) => ReactNode);
		header?: ReactNode | ((state: PanelState) => ReactNode);
		maxWidth?: number | false | null | undefined;
		minWidth?: number | null | undefined;
	}

export type ContentPanelProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnContentPanelProps>

export type ContentPanelComponentType =
	& (<C extends ElementType = 'section'>(props: ContentPanelProps<C>) => ReturnType<React.FC<ContentPanelProps<C>>>)
	& {
		BASIS: number;
		MAX_WIDTH: number;
		MIN_WIDTH: number;
		NAME: string;
		displayName?: string | undefined;
	}

export type OwnBarStartProps =
	| {
		start: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
		startAfter?: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
		startBefore?: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
	}
	| {
		start?: never;
		startAfter?: never;
		startBefore?: never;
	}

export type OwnBarCenterProps =
	| {
		center: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
		centerAfter?: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
		centerBefore?: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
	}
	| {
		center?: never;
		centerAfter?: never;
		centerBefore?: never;
	}

export type OwnBarEndProps =
	| {
		end: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
		endAfter?: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
		endBefore?: ReactNode | ((state: GetLayoutPanelsStateContextType) => ReactNode);
	}
	| {
		end?: never;
		endAfter?: never;
		endBefore?: never;
	}

export type OwnBarProps = Omit<ComponentClassNameProps, 'children'>
	& { children?: never }
	& OwnBarStartProps
	& OwnBarCenterProps
	& OwnBarEndProps

export type BarProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnBarProps>

export type BarComponentType =
	& (<C extends ElementType = 'div'>(props: BarProps<C>) => ReturnType<React.FC<BarProps<C>>>)
	& {
		displayName?: string | undefined;
	}

export type OwnSidebarProps =
	& Omit<ComponentClassNameProps, 'children'>
	& {
		basis?: number;
		body?: ReactNode | ((state: PanelState) => ReactNode);
		children?: never;
		footer?: ReactNode | ((state: PanelState) => ReactNode);
		header?: ReactNode | ((state: PanelState) => ReactNode);
		keepVisible?: boolean | null | undefined;
		maxWidth?: number | false | null | undefined;
		minWidth?: number | null | undefined;
		priority?: number | null | undefined;
		trapFocusInModal?: boolean | null | undefined;
	}

export type SidebarProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnSidebarProps>

export type SidebarComponentType =
	& (<C extends ElementType = 'aside'>(props: SidebarProps<C>) => ReactElement | null)
	& {
		BASIS: number;
		MAX_WIDTH: number;
		MIN_WIDTH: number;
		NAME: string;
		displayName?: string | undefined;
	}

export type ToggleMenuButtonProps =
	& Omit<ComponentClassNameProps, 'children'>
	& {
		children?: never;
		labelWhenClosed?: string;
		labelWhenOpen?: string;
		panelName: string;
	}

export type ToggleSidebarButtonProps =
	& Omit<ComponentClassNameProps, 'children'>
	& {
		children?: never;
		labelWhenClosed?: string;
		labelWhenOpen?: string;
		panelName: string;
		position: 'left' | 'right';
	}
