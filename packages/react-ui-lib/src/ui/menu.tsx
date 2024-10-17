import type { ReactNode } from 'react'
import { uic } from '../utils'
import { type RoleCondition, useProjectUserRoles, Link, type RoutingLinkTarget } from '@contember/interface'
import { createContext } from '@contember/react-utils'

export const MenuItemUI = uic('a', {
	baseClass: 'flex justify-start py-2.5 px-2.5 w-full gap-2 rounded text-sm items-center transition-all duration-200',
})

export const MenuItemIconUI = uic('span', {
	baseClass: 'w-4 text-gray-400 inline-flex items-center justify-center',
})

export const MenuSubMenuUI = uic('div', {
	baseClass: 'ml-2',
})

export type MenuItem = {
	icon?: ReactNode
	label: ReactNode
	to?: RoutingLinkTarget
	/** @deprecated use children instead */
	subItems?: MenuItem[]
	lvl?: number
	role?: RoleCondition
	children?: ReactNode
}

interface MenuContextValue {
	level: number
}

const [MenuContext, useMenuContext] = createContext<MenuContextValue | null>('MenuContext', null)
export const Menu = ({ children }: {
	children?: ReactNode
}) => {
	return (
		<MenuContext.Provider value={{ level: 0 }}>
			<div className={'flex flex-col'}>
				{children}
			</div>
		</MenuContext.Provider>
	)
}

export interface MenuListProps {
	items: MenuItem[]
	lvl?: number
}

/**
 * @deprecated use Menu instead
 */
export const MenuList = ({ items, lvl = 0 }: MenuListProps) => {
	return (
		<div className={'flex flex-col'}>
			{items.map((item, index) => (
				<MenuItem key={index} {...item} lvl={lvl} />
			))}
		</div>
	)
}

export const MenuItem = ({ icon, label, to, subItems, lvl, role, children }: MenuItem) => {
	const projectRoles = useProjectUserRoles()
	const menu = useMenuContext()
	lvl ??= menu?.level ?? 0
	if (role && !(typeof role === 'string' ? projectRoles.has(role) : role(projectRoles))) {
		return null
	}

	return (
		<div>
			{to ? (
				<Link to={to}>
					<MenuItemUI className={'hover:bg-gray-100 cursor-pointer'}>
						<MenuItemIconUI>{icon}</MenuItemIconUI>
						<span className={lvl === 0 ? 'font-medium' : ''}>{label}</span>
					</MenuItemUI>
				</Link>
			) : (
				<MenuItemUI>
					<MenuItemIconUI>{icon}</MenuItemIconUI>
					<span className={lvl === 0 ? 'font-medium' : ''}>{label}</span>
				</MenuItemUI>
			)}
			{subItems && (
				<MenuSubMenuUI>
					<MenuList items={subItems} lvl={lvl + 1}/>
				</MenuSubMenuUI>
			)}

			{children && (
				<MenuSubMenuUI>
					<MenuContext.Provider value={{ level: lvl + 1 }}>
						{children}
					</MenuContext.Provider>
				</MenuSubMenuUI>
			)}
		</div>
	)
}
