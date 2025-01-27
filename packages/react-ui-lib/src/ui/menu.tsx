import {
	Link,
	type RoleCondition,
	type RoutingLinkTarget,
	useCurrentRequest,
	useProjectUserRoles,
} from '@contember/interface'
import { createContext } from '@contember/react-utils'
import { VariantProps } from 'class-variance-authority'
import { ChevronRight } from 'lucide-react'
import { Children, isValidElement, ReactNode, useMemo } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { SidebarMenu, SidebarMenuButton, sidebarMenuButtonVariants, SidebarMenuItem, SidebarMenuSub } from './sidebar'

export type MenuItemProps = {
	icon?: ReactNode
	label: ReactNode
	to?: RoutingLinkTarget
	children?: ReactNode
	role?: RoleCondition
	expandedByDefault?: boolean
} & VariantProps<typeof sidebarMenuButtonVariants>

interface MenuContextValue {
	level: number
}

const [MenuContext, useMenuContext] = createContext<MenuContextValue>('MenuContext', { level: 0 })

const useIsActiveMenuItem = (to?: RoutingLinkTarget): boolean => {
	const pageName = useCurrentRequest()?.pageName

	if (!to || !pageName) {
		return false
	}

	return typeof to === 'string'
		? pageName === to
		: 'pageName' in to && pageName === to.pageName
}

const useHasActiveChild = (children: ReactNode) => {
	const currentRequest = useCurrentRequest()
	const pageName = currentRequest?.pageName

	return useMemo(() => {
		if (!pageName || !children) return false

		const isMatchingPage = (to: string | { pageName: string }): boolean => {
			return typeof to === 'string'
				? pageName === to
				: 'pageName' in to && pageName === to.pageName
		}

		const checkChild = (child: ReactNode): boolean => {
			if (!isValidElement(child)) return false

			const { to, children: grandChildren } = child.props

			if (to && isMatchingPage(to)) return true

			if (!grandChildren) return false

			return Children.toArray(grandChildren).some(checkChild)
		}

		return Children.toArray(children).some(checkChild)
	}, [children, pageName])
}

export const Menu = ({ children }: { children: ReactNode }) => {
	return (
		<MenuContext.Provider value={{ level: 0 }}>
			<SidebarMenu>
				{children}
			</SidebarMenu>
		</MenuContext.Provider>
	)
}

export const MenuItem = ({ icon, label, to, children, role, expandedByDefault, ...menuButtonProps }: MenuItemProps) => {
	const isActive = useIsActiveMenuItem(to)
	const hasActiveChild = useHasActiveChild(children)
	const projectRoles = useProjectUserRoles()
	const { level } = useMenuContext()

	if (role && !(typeof role === 'string' ? projectRoles.has(role) : role(projectRoles))) {
		return null
	}

	const hasChildren = Boolean(children)

	if (!hasChildren && to) {
		return (
			<SidebarMenuItem>
				<Link to={to}>
					<SidebarMenuButton isActive={isActive} tooltip={label} {...menuButtonProps}>
						{icon}
						<span>{label}</span>
					</SidebarMenuButton>
				</Link>
			</SidebarMenuItem>
		)
	}

	return (
		<Collapsible defaultOpen={expandedByDefault || hasActiveChild} className="[&[data-state=open]>li>button>.menu-icon]:rotate-90">
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton isActive={isActive} tooltip={label} {...menuButtonProps}>
						{icon}
						<span>{label}</span>
						{hasChildren && (
							<ChevronRight className="ml-auto transition-transform duration-200" />
						)}
					</SidebarMenuButton>
				</CollapsibleTrigger>
				{hasChildren && (
					<CollapsibleContent className="collapsible-animate">
						<SidebarMenuSub>
							<MenuContext.Provider value={{ level: level + 1 }}>
								{children}
							</MenuContext.Provider>
						</SidebarMenuSub>
					</CollapsibleContent>
				)}
			</SidebarMenuItem>
		</Collapsible>
	)
}
