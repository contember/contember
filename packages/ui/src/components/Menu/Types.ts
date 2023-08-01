import { NestedClassName } from '@contember/utilities'
import { ReactNode } from 'react'
import { HTMLDivElementProps } from '../../types'

export const TAB_INDEX_FOCUSABLE = 0
export const TAB_INDEX_TEMPORARY_UNFOCUSABLE = -1
export const TAB_INDEX_NEVER_FOCUSABLE = -2
export type MenuProps =
	& HTMLDivElementProps
	& {
	className?: NestedClassName;
		caret?: ReactNode;
	componentClassName?: string;
		/** @deprecated No alternative */
	focusMenuItemLabel?: string;
	/**
	 * Unique identifier to identify menu. Mandatory if you have multiple menus on a single page.
	 *
	 * Menus are being persisted in session storage.
	 */
	id?: string;
	label?: string;
		/** @deprecated Use `caret` instead */
	showCaret?: boolean;
}

export interface MenuItemPropsTitleRequired<T> {
	title: ReactNode;
	to: T;
}

export interface MenuItemPropsTitleOptional {
	title?: ReactNode;
	to?: never;
}

export type MenuItemProps<T = unknown> =
	& (MenuItemPropsTitleRequired<T> | MenuItemPropsTitleOptional)
	& {
		children?: ReactNode;
		componentClassName?: string;
		expandedByDefault?: boolean;
		external?: boolean;
		href?: string;
		icon?: ReactNode;
	}
