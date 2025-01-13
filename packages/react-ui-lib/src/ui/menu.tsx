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
import { cn } from '../utils'
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

// Explicitly defined classes for each level of collapsible
const rotateClasses = [
	'group-data-[state=open]/collapsible-0:rotate-90',
	'group-data-[state=open]/collapsible-1:rotate-90',
	'group-data-[state=open]/collapsible-2:rotate-90',
	'group-data-[state=open]/collapsible-3:rotate-90',
	'group-data-[state=open]/collapsible-4:rotate-90',
	'group-data-[state=open]/collapsible-5:rotate-90',
]

export const MenuItem = ({ icon, label, to, children, role, expandedByDefault, ...menuButtonProps }: MenuItemProps) => {
	const isActive = useIsActiveMenuItem(to)
	const hasActiveChild = useHasActiveChild(children)
	const projectRoles = useProjectUserRoles()
	const { level } = useMenuContext()

	if (level >= 5) {
		console.error('Menu nesting level exceeded 5. Chevron icon will not work properly. Please adjust rotateClasses in menu.tsx')
	}

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
		<Collapsible defaultOpen={expandedByDefault || hasActiveChild} className={`group/collapsible-${level}`}>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton isActive={isActive} tooltip={label} {...menuButtonProps}>
						{icon}
						<span>{label}</span>
						{hasChildren && (
							<ChevronRight className={cn(`ml-auto transition-transform duration-200`, rotateClasses[level])} />
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
