import { useClassNameFactory } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { MemoExoticComponent, PropsWithChildren, memo, useCallback, useMemo, useRef } from 'react'
import { DepthContext, FocusableContext } from './Contexts'
import { MenuItem } from './MenuItem'
import type { MenuItemProps, MenuProps } from './Types'
import { ActiveMenuItemProvider } from './useActiveMenuItem'
import { MenuIdProvider } from './useMenuId'

function getFocusableItems<E extends HTMLElement = HTMLElement>(parent: E): HTMLLIElement[] {
	return Array.from(parent.querySelectorAll('li')).filter(node => node.tabIndex >= -1)
}

function getClosestFocusable<E extends HTMLElement = HTMLElement>(parent: E, offset: number) {
	if (!document.activeElement) {
		return null
	}

	if (!(document.activeElement instanceof HTMLLIElement)) {
		return null
	}

	const list = getFocusableItems(parent)
	const currentlyFocusedIndex = list.indexOf(document.activeElement)

	return list[currentlyFocusedIndex + offset] ?? null
}

const MenuInternal = memo(({
	id = 'unknown',
	label,
	caret = true,
	className: classNameProp,
	componentClassName = 'menu',
	children,
	...rest
}: PropsWithChildren<MenuProps>) => {
	const menuRef = useRef<HTMLUListElement>(null)
	const className = useClassNameFactory(componentClassName)

	const nextFocusable = useCallback((): HTMLLIElement | null => {
		if (!menuRef.current) {
			return null
		}

		return getClosestFocusable(menuRef.current, 1)
	}, [])

	const previousFocusable = useCallback((): HTMLLIElement | null => {
		if (!menuRef.current) {
			return null
		}

		return getClosestFocusable(menuRef.current, -1)
	}, [])

	return (
		<DepthContext.Provider value={0}>
			<MenuIdProvider menuId={id}>
				<ActiveMenuItemProvider menuRef={menuRef}>
					<nav aria-label={label} data-caret={dataAttribute(caret)} className={className(null, classNameProp)} {...rest}>
						<ul ref={menuRef} className={className('list')}>
							<FocusableContext.Provider value={useMemo(() => ({
								nextFocusable,
								previousFocusable,
							}), [nextFocusable, previousFocusable])}>
								{children}
							</FocusableContext.Provider>
						</ul>
					</nav>
				</ActiveMenuItemProvider>
			</MenuIdProvider>
		</DepthContext.Provider>
	)
})

/**
 * @example
 * ```
 * <Menu>
 *   <Menu.Item title="Articles" to="articleList"/>
 * </Menu>
 * ```
 *
 * @group UI
 */
export const Menu: MemoExoticComponent<(props: PropsWithChildren<MenuProps>) => JSX.Element> & {
	Item: <T>(props: MenuItemProps<T>) => JSX.Element
} = MenuInternal as any

Menu.Item = MenuItem
