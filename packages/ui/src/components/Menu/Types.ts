import { Key, ReactElement, ReactNode } from 'react'

export const TAB_INDEX_FOCUSABLE = 0
export const TAB_INDEX_TEMPORARY_UNFOCUSABLE = -1
export const TAB_INDEX_NEVER_FOCUSABLE = -2
export interface MenuProps<T extends any = any> {
  /**
   * Unique identifier to identify menu
   *
   * Menus are being persisted within the same tab across
   * all pages after refresh until the tab is permanently closed.
   *
   * Use this prop when the structure of the menu changes
   * and you wish to persist menu state across across
   * different pages.
   *
   * If ommited, hash of the menu tree structure is being used.
   *
   */
  id?: string
  children?: MenuItemElement<T>[]
  showCaret?: boolean
  focusMenuItemLabel?: string
}

export interface MenuItemProps<T extends any = any> {
	children?: MenuItemElement<T> | MenuItemElement<T>[] | null
	title?: string | ReactNode
	to?: T
	href?: string
	external?: boolean
	expandedByDefault?: boolean
}

export type MenuTreeNode<T extends any = any> = Omit<MenuItemProps<T>, 'children'> & {
  children?: MenuTreeNode<T>[] | undefined
}

export type MenuItemComponent = <T extends any = any>(props: MenuItemProps<T>) => ReactElement<any, any> | null

export interface MenuItemElement<T extends any = any>{
  type: (props: MenuItemProps<T>) => MenuItemElement<T> | MenuItemElement<T>[] | null
  props: MenuItemProps<T>
  key: Key | null
}
