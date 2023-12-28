import { useChildrenAsLabel, useClassNameFactory, useId, useSessionStorageState } from '@contember/react-utils'
import { stateDataAttributes } from '@contember/utilities'
import { Fragment, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useNavigationLink } from '../../Navigation'
import { Collapsible } from '../Collapsible'
import { usePreventCloseContext } from '../PreventCloseContext'
import { DepthContext, ExpandParentContext, useExpandParentContext } from './Contexts'
import { MenuExpandToggle } from './MenuExpandToggle'
import { MenuLink } from './MenuLink'
import { MenuItemProps, TAB_INDEX_FOCUSABLE, TAB_INDEX_NEVER_FOCUSABLE, TAB_INDEX_TEMPORARY_UNFOCUSABLE } from './Types'
import { useActiveMenuItemContext } from './useActiveMenuItem'
import { useKeyNavigation } from './useKeyNavigation'
import { useMenuId } from './useMenuId'

/**
 * @group UI
 */
export function MenuItem<T = unknown>({ children, componentClassName = 'menu-item', icon, ...props }: MenuItemProps<T>) {
	const { isActive: active, href, navigate } = useNavigationLink(props.to, props.href)
	const depth = useContext(DepthContext)
	const id = useRef(`cui-menu-id-${useId()}`)
	const label = useChildrenAsLabel(props.title)

	const menuItemId = `${componentClassName}-${depth}-${href ?? label}`
	const menuId = useMenuId()
	const [expanded, setExpanded] = useSessionStorageState<boolean>(
		`menu-${menuId}-${menuItemId}`,
		val => val ?? props.expandedByDefault ?? (depth === 0 || !label),
	)

	const className = useClassNameFactory(componentClassName)

	const listItemRef = useRef<HTMLLIElement>(null)
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

	const focusable = tabIndex !== TAB_INDEX_NEVER_FOCUSABLE
	const disabled = tabIndex === TAB_INDEX_NEVER_FOCUSABLE

	const preventMenuClose = usePreventCloseContext()

	const changeExpand = useCallback((nextExpanded: boolean) => {
		if (!expandable) {
			return
		}

		if (href && listItemRef.current !== document.activeElement) {
			listItemRef.current?.focus()
		}

		setExpanded(nextExpanded)
	}, [expandable, href, setExpanded])

	const onLabelClick = useCallback((event: SyntheticEvent) => {
		if (event.defaultPrevented) {
			return
		}

		event.preventDefault()

		if (expandable && !expanded) {
			preventMenuClose()
		}

		if (navigate) {
			navigate(event)
			changeExpand(true)
		} else {
			changeExpand(!expanded)
		}

		if (href && listItemRef.current !== document.activeElement) {
			listItemRef.current?.focus()
		}
	}, [expandable, expanded, navigate, href, preventMenuClose, changeExpand])

	const onKeyPress = useKeyNavigation({ changeExpand, expanded, depth, isInteractive: expandable, listItemRef, onClick: onLabelClick })

	const interactiveProps = useMemo(() => expandable ? {
		'id': menuItemId,
		'aria-haspopup': true,
		'aria-controls': id.current,
		'aria-expanded': expanded,
	} : undefined, [expanded, expandable, menuItemId])

	const MaybeCollapsible = expandable ? Collapsible : Fragment

	const stateAttributes = stateDataAttributes({
		active,
		depth,
		expandable,
		focusable,
	})

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
					{...stateAttributes}
					aria-label={label}
					className={className()}
					onKeyDown={onKeyPress}
					tabIndex={tabIndex}
					aria-disabled={disabled}
				>
					<div className={className('trigger')}>
						<MenuLink
							active={active}
							className={className('link')}
							external={props.external}
							href={href}
							icon={icon}
							onClick={onLabelClick}
							disabled={disabled}
						>
							{props.title}
						</MenuLink>

						{expandable && (
							<MenuExpandToggle
								checked={expanded}
								controls={id.current}
								label={`More ${label}`}
								disabled={!expandable}
								onChange={changeExpand}
							/>
						)}
					</div>
					{children && (
						<MaybeCollapsible expanded={expanded}>
							<ul
								id={expandable ? id.current : undefined}
								className={className('list')}
								{...stateAttributes}
							>
								{children}
							</ul>
						</MaybeCollapsible>
					)}
				</li>
			</ExpandParentContext.Provider>
		</DepthContext.Provider>
	)
}
