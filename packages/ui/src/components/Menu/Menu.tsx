import { useClassNameFactory } from '@contember/utilities'
import { memo, MemoExoticComponent, PropsWithChildren, useCallback, useMemo, useRef } from 'react'
import { MouseMoveProvider } from '../../auxiliary'
import { toViewClass } from '../../utils'
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
	label,
	className: classNameProp,
	componentClassName = 'menu',
	...props
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

	const menuId = props.id ?? 'unknown'

	return (
		<DepthContext.Provider value={0}>
			<MenuIdProvider menuId={menuId}>
				<MouseMoveProvider elementRef={menuRef}>
					<ActiveMenuItemProvider menuRef={menuRef}>
						<nav aria-label={label} className={className(null, [
							toViewClass('showCaret', props.showCaret ?? true),
							classNameProp,
						])}>
							<ul ref={menuRef} className={className('list', 'is-expanded')}>
								<FocusableContext.Provider value={useMemo(() => ({
									nextFocusable,
									previousFocusable,
								}), [nextFocusable, previousFocusable])}>
									{props.children}
								</FocusableContext.Provider>
							</ul>
						</nav>
					</ActiveMenuItemProvider>
				</MouseMoveProvider>
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
