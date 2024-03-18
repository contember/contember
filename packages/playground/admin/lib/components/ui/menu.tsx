import { Link, RoutingLinkTarget } from '@contember/react-routing'
import { ReactNode } from 'react'
import { uic } from '../../../lib/utils/uic'
import { RoleCondition, useProjectUserRoles } from '@contember/interface'

export type MenuItem = {
	icon?: ReactNode
	label: ReactNode
	to?: RoutingLinkTarget
	subItems?: MenuItem[]
	lvl?: number
	role?: RoleCondition
}

export interface MenuProps {
	items: MenuItem[]
	lvl?: number
}

export const MenuList = ({ items, lvl = 0 }: MenuProps) => {
	return (
		<div className={'flex flex-col'}>
			{items.map((item, index) => (
				<MenuItem key={index} {...item} lvl={lvl} />
			))}
		</div>
	)
}

export const MenuItem = ({ icon, label, to, subItems, lvl = 0, role }: MenuItem) => {
	const projectRoles = useProjectUserRoles()
	if (role && !(typeof role === 'string' ? projectRoles.has(role) : role(projectRoles))) {
		return null
	}

	return (
		<div>
			{to ? (
				<Link to={to}>
					<MenuLink className={'hover:bg-gray-100 cursor-pointer gap-2'}>
						<span className={'w-4 text-gray-400 inline-flex items-center justify-center'}>{icon}</span>
						<span className={lvl === 0 ? 'font-medium' : ''}>{label}</span>
						<span className={'ml-auto'}></span>
					</MenuLink>
				</Link>
			) : (
				<MenuLink className={'gap-2'}>
					<span className={'w-4 text-gray-400 items-center justify-center'}>{icon}</span>
					<span className={lvl === 0 ? 'font-medium' : ''}>{label}</span>
					<span className={'ml-auto'}></span>
				</MenuLink>
			)}
			{subItems && (
				<div className={'ml-2'}>
					<MenuList items={subItems} lvl={lvl + 1}/>
				</div>
			)}
		</div>
	)
}

export const MenuLink = uic('a', {
	baseClass: 'flex justify-start py-2.5 px-2.5 w-full gap-1 rounded text-sm items-center transition-all duration-200',
})
