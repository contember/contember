import { ComponentClassNameProps, NestedClassName, PolymorphicComponent } from '@contember/utilities'
import { ComponentProps, ReactNode } from 'react'
import { GetLayoutPanelsStateContextType, OwnPanelProps, PanelState } from '../primitives'

export type OwnFrameProps = ComponentClassNameProps & {
	/**
	 * Content of frame body footer.
	 */
	bodyFooter?: ReactNode;
	/**
	 * Content of frame body header.
	 */
	bodyHeader?: ReactNode;
	/**
	 * Content of frame footer.
	 */
	footer?: ReactNode;
	/**
	 * Sets whether the frame footer should be of fixed position.
	 */
	footerIsFixed?: boolean;
	/**
	 * Frame footer class name.
	 */
	footerClassName?: NestedClassName;
	/**
	 * Content of frame header.
	 */
	header?: ReactNode;
	/**
	 * Sets whether the frame header should be of fixed position.
	 */
	headerIsFixed?: boolean;
	/**
	 * Sets whether the frame header should be of fixed position.
	 */
	headerClassName?: NestedClassName;
	/**
	 * Sets the minimum height of the frame footer.
	 */
	minimumFooterHeight?: number;
	/**
	 * Sets the minimum height of the frame header.
	 */
	minimumHeaderHeight?: number;
}

export type FrameProps = ComponentProps<FrameComponentType>

export type FrameComponentType = PolymorphicComponent<'div', OwnFrameProps>

export type CommonPanelProps = {
	/**
	 * Content of the panel. If you need to access the state of the panel, you can pass a function instead. The function will be called with the state of the panel and the state of all panels.
	 */
	body?: ReactNode | ((state: PanelState, panelsState: GetLayoutPanelsStateContextType) => ReactNode);
	/**
	 * You can pass ReactNode to header, body and footer props.
	 */
	children?: never;
	/**
	 * Content of the panel footer. If you need to access the state of the panel, you can pass a function instead. The function will be called with the state of the panel and the state of all panels.
	 */
	footer?: ReactNode | ((state: PanelState, panelsState: GetLayoutPanelsStateContextType) => ReactNode);
	/**
	 * Content of the panel header. If you need to access the state of the panel, you can pass a function instead. The function will be called with the state of the panel and the state of all panels.
	 */
	header?: ReactNode | ((state: PanelState, panelsState: GetLayoutPanelsStateContextType) => ReactNode);
}

export type OwnContentPanelProps = ComponentClassNameProps & CommonPanelProps & Pick<OwnPanelProps, 'basis' | 'maxWidth' | 'minWidth' | 'priority'>

export type ContentPanelProps = ComponentProps<ContentPanelComponentType>

export type ContentComponentAttributes = {
	BASIS: number;
	MAX_WIDTH: number;
	MIN_WIDTH: number;
	NAME: string;
	displayName?: string | undefined;
}

export type ContentPanelComponentType = PolymorphicComponent<'section', OwnContentPanelProps>

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

export type OwnBarProps =
	& ComponentClassNameProps
	& { children?: never }
	& OwnBarStartProps
	& OwnBarCenterProps
	& OwnBarEndProps

export type BarProps = ComponentProps<BarComponentType>

export type BarComponentType = PolymorphicComponent<'div', OwnBarProps>

export type OwnSidebarProps =
	& ComponentClassNameProps
	& CommonPanelProps
	& Pick<OwnPanelProps, 'basis' | 'maxWidth' | 'minWidth' | 'onBehaviorChange' | 'onKeyPress' | 'onVisibilityChange' | 'priority' | 'trapFocusInModal'>
	& {
		/**
		 * Use `header`, `body` and `footer` props instead.
		 */
		children?: never;
		/**
		 * When set true, the sidebar will become visible when possible automatically.
		 */
		keepVisible?: boolean | null | undefined;
	}

export type SidebarProps = ComponentProps<SidebarComponentType>

export type SidebarComponentType = PolymorphicComponent<'aside', OwnSidebarProps>

export type SidebarComponentAttributes = {
	/**
	 * The basis of the sidebar.
	 */
	BASIS: number;
	/**
	 * The max width of the sidebar.
	 */
	MAX_WIDTH: number;
	/**
	 * The min width of the sidebar.
	 */
	MIN_WIDTH: number;
	/**
	 * The name of the sidebar.
	 */
	NAME: string;
	/**
	 * Display name of the sidebar component displayed in React DevTools.
	 */
	displayName?: string | undefined;
}

export type ToggleMenuButtonProps = ComponentClassNameProps & {
	/**
	 * Button has no children.
	 */
	children?: never;
	/**
	 * Label of the button when the menu is closed.
	 */
	labelWhenClosed?: string;
	/**
	 * Label of the button when the menu is open.
	 */
	labelWhenOpen?: string;
	/**
	 * Name of the panel to toggle.
	 */
	panelName: string;
}

export type ToggleSidebarButtonProps = ComponentClassNameProps & {
	/**
	 * Button has no children.
	 */
	children?: never;
	/**
	 * Label of the button when the menu is closed.
	 */
	labelWhenClosed?: string;
	/**
	 * Label of the button when the menu is open.
	 */
	labelWhenOpen?: string;
	/**
	 * Name of the sidebar panel to toggle.
	 */
	panelName: string;
	/**
	 * Position of the sidebar panel to toggle. Depending on the position, the button will have different icon.
	 */
	position: 'left' | 'right';
}
