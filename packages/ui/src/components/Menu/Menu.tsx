import classNames from 'classnames'
import { memo, MemoExoticComponent, PropsWithChildren, useCallback, useMemo, useRef } from 'react'
import { MouseMoveProvider, useComponentClassName } from '../../auxiliary'
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

const MenuInternal = memo((props: PropsWithChildren<MenuProps>) => {
	const menuRef = useRef<HTMLUListElement>(null)
	const componentClassName = useComponentClassName('menu')

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

	return <DepthContext.Provider value={0}>
		<MenuIdProvider menuId={menuId}>
			<MouseMoveProvider elementRef={menuRef}>
				<ActiveMenuItemProvider menuRef={menuRef}>
					<section className={classNames(
						componentClassName,
						toViewClass('showCaret', props.showCaret ?? true),
					)}>
						<ul ref={menuRef} className={classNames(
							`${componentClassName}-list`,
							'is-expanded',
						)}>
							<FocusableContext.Provider value={useMemo(() => ({
								nextFocusable,
								previousFocusable,
							}), [nextFocusable, previousFocusable])}>
								{props.children}
							</FocusableContext.Provider>
						</ul>
					</section>
				</ActiveMenuItemProvider>
			</MouseMoveProvider>
		</MenuIdProvider>
	</DepthContext.Provider>
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
