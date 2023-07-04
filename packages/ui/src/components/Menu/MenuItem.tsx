import { useSessionStorageState } from '@contember/react-utils'
import { useClassNameFactory } from '@contember/utilities'
import { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useNavigationLink } from '../../Navigation'
import { randomId } from '../../auxiliary'
import { toStateClass, useChildrenAsLabel } from '../../utils'
import { Collapsible } from '../Collapsible'
import { usePreventCloseContext } from '../PreventCloseContext'
import { Label } from '../Typography'
import { DepthContext, ExpandParentContext, useExpandParentContext } from './Contexts'
import { MenuExpandToggle } from './ExpandToggle'
import { MenuLink } from './MenuLink'
import { MenuItemProps, TAB_INDEX_FOCUSABLE, TAB_INDEX_NEVER_FOCUSABLE, TAB_INDEX_TEMPORARY_UNFOCUSABLE } from './Types'
import { useActiveMenuItemContext } from './useActiveMenuItem'
import { useKeyNavigation } from './useKeyNavigation'
import { useMenuId } from './useMenuId'

/**
 * @group UI
 */
export function MenuItem<T = unknown>({ children, componentClassName = 'menu', ...props }: MenuItemProps<T>) {
	const depth = useContext(DepthContext)

	const { isActive, href, navigate } = useNavigationLink(props.to, props.href)

	const id = useRef(`cui-menu-id-${randomId()}`)
	const label = useChildrenAsLabel(props.title)

	const menuItemId = `cui-menu-item-${depth}-${href ?? label}`
	const className = useClassNameFactory(depth === 0 ? `${componentClassName}-section` : `${componentClassName}-group`)

	const listItemRef = useRef<HTMLLIElement>(null)
	const listItemTitleRef = useRef<HTMLDivElement>(null)

	const parentExpandedOnce = useRef<boolean>(false)

	const { expandParent, parentIsExpanded } = useExpandParentContext()

	useEffect(() => {
		if (parentExpandedOnce.current) {
			return
		}

		if (isActive) {
			expandParent()
		}

		parentExpandedOnce.current = true
	}, [isActive, href, expandParent])

	const hasSubItems = !!children
	const isInteractive = hasSubItems //&& depth > 0

	const activeMenuItem = useActiveMenuItemContext()

	const tabIndex = (depth >= 0 && hasSubItems) || href
		? parentIsExpanded
			? !activeMenuItem || activeMenuItem === listItemRef.current ? TAB_INDEX_FOCUSABLE : TAB_INDEX_TEMPORARY_UNFOCUSABLE
			: TAB_INDEX_NEVER_FOCUSABLE
		: TAB_INDEX_NEVER_FOCUSABLE

	const menuId = useMenuId()
	const [expanded, setExpanded] = useSessionStorageState<boolean>(
		`menu-${menuId}-${menuItemId}`,
		val => val ?? (props.expandedByDefault || depth === 0 || !label),
	)

	const preventMenuClose = usePreventCloseContext()

	const changeExpand = useCallback((nextExpanded: boolean) => {
		if (!isInteractive) {
			return
		}

		if (listItemRef.current !== document.activeElement) {
			listItemRef.current?.focus()
		}

		setExpanded(nextExpanded)
	}, [isInteractive, setExpanded])

	const onLabelClick = useCallback((event: SyntheticEvent) => {
		if (event.defaultPrevented) {
			return
		}

		if (isInteractive && !expanded) {
			preventMenuClose()
		}

		if (navigate) {
			navigate(event)
			changeExpand(true)
		} else {
			changeExpand(!expanded)
		}

		listItemRef.current?.focus()

		event.preventDefault()
	}, [expanded, changeExpand, isInteractive, navigate, preventMenuClose])

	const onKeyPress = useKeyNavigation({ changeExpand, expanded, depth, isInteractive, listItemRef, onClick: onLabelClick })

	const submenuClassName = className('list', [
		hasSubItems && (expanded ? 'is-expanded' : 'is-collapsed'),
	])

	const submenu = useMemo(
		() => {
			const ul = children && (
				<ul
					id={isInteractive ? id.current : undefined}
					className={submenuClassName}
				>
					{children}
				</ul>
			)
			return isInteractive ? <Collapsible expanded={expanded}>{ul}</Collapsible> : ul
		},
		[children, expanded, isInteractive, submenuClassName],
	)

	const warnAboutA11YIssues = import.meta.env.DEV && depth !== 0

	if (warnAboutA11YIssues && !label) {
		console.warn('Accessibility issue: All submenu items should provide a title.')
	}

	const interactiveProps = isInteractive ? {
		'id': menuItemId,
		'aria-haspopup': true,
		'aria-controls': id.current,
		'aria-expanded': expanded,
	} : undefined

	return (
		<DepthContext.Provider value={depth + 1}>
			<ExpandParentContext.Provider value={{
				expandParent: useCallback(() => {
					changeExpand(true)
					expandParent()
				}, [changeExpand, expandParent]),
				parentIsExpanded: parentIsExpanded && expanded,
			}}>
				<li
					ref={listItemRef}
					{...interactiveProps}
					aria-label={label}
					className={className(null, [
						hasSubItems && (expanded ? 'is-expanded' : 'is-collapsed'),
						toStateClass('interactive', isInteractive),
						toStateClass('active', isActive),
					])}
					onKeyDown={onKeyPress}
					tabIndex={tabIndex}
					aria-disabled={tabIndex === TAB_INDEX_NEVER_FOCUSABLE}
				>
					<div ref={listItemTitleRef} className={className('title')}>
						{href
							? <MenuLink
								className={className('title-content')}
								external={props.external}
								href={href}
								isActive={isActive}
								onClick={onLabelClick}
								suppressTo={expanded}
							>
								<Label className={className('title-label')}>{props.title}</Label>
							</MenuLink>
							: <span
								className={className('title-content')}
								onClick={onLabelClick}
							>
								<Label className={className('label')}>{props.title}</Label>
							</span>
						}

						{isInteractive && (
							<MenuExpandToggle
								checked={expanded}
								controls={id.current}
								// TODO: Needs translation
								label={`More ${label}`}
								disabled={!isInteractive}
								onChange={changeExpand}
							/>
						)}
					</div>
					{submenu}
				</li>
			</ExpandParentContext.Provider>
		</DepthContext.Provider>
	)
}
