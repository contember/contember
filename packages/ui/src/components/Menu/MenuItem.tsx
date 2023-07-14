import { useClassNameFactory, useSessionStorageState } from '@contember/react-utils'
import { stateDataAttributes } from '@contember/utilities'
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

	const { isActive: active, href, navigate } = useNavigationLink(props.to, props.href)

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

		if (active) {
			expandParent()
		}

		parentExpandedOnce.current = true
	}, [active, href, expandParent])

	const expandable = !!children
	const activeMenuItem = useActiveMenuItemContext()

	const tabIndex = (depth >= 0 && expandable) || href
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
		if (!expandable) {
			return
		}

		if (listItemRef.current !== document.activeElement) {
			listItemRef.current?.focus()
		}

		setExpanded(nextExpanded)
	}, [expandable, setExpanded])

	const onLabelClick = useCallback((event: SyntheticEvent) => {
		if (event.defaultPrevented) {
			return
		}

		if (expandable && !expanded) {
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
	}, [expanded, changeExpand, expandable, navigate, preventMenuClose])

	const onNeverFocusableClick = useCallback((event: SyntheticEvent) => {
		event.preventDefault()
		changeExpand(!expanded)
	}, [changeExpand, expanded])

	const onKeyPress = useKeyNavigation({ changeExpand, expanded, depth, isInteractive: expandable, listItemRef, onClick: onLabelClick })

	const submenuClassName = className('list', [
		expandable && (expanded ? 'is-expanded' : 'is-collapsed'),
	])

	const submenu = useMemo(
		() => {
			const ul = children && (
				<ul
					id={expandable ? id.current : undefined}
					className={submenuClassName}
				>
					{children}
				</ul>
			)
			return expandable ? <Collapsible expanded={expanded}>{ul}</Collapsible> : ul
		},
		[children, expanded, expandable, submenuClassName],
	)

	const warnAboutA11YIssues = import.meta.env.DEV && depth !== 0

	if (warnAboutA11YIssues && !label) {
		console.warn('Accessibility issue: All submenu items should provide a title.')
	}

	const interactiveProps = useMemo(() => expandable ? {
		'id': menuItemId,
		'aria-haspopup': true,
		'aria-controls': id.current,
		'aria-expanded': expanded,
	} : undefined, [expanded, expandable, menuItemId])

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
					{...stateDataAttributes({
						active,
						expandable,
						focusable: tabIndex !== TAB_INDEX_NEVER_FOCUSABLE,
					})}
					aria-label={label}
					className={className()}
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
								isActive={active}
								onClick={onLabelClick}
								suppressTo={expanded}
							>
								<Label className={className('title-label')}>{props.title}</Label>
							</MenuLink>
							: <span
								className={className('title-content')}
								onMouseDown={onNeverFocusableClick}
							>
								<Label className={className('label')}>{props.title}</Label>
							</span>
						}

						{expandable && (
							<MenuExpandToggle
								checked={expanded}
								controls={id.current}
								// TODO: Needs translation
								label={`More ${label}`}
								disabled={!expandable}
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
