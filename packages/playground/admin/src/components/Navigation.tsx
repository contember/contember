import { Link, RoutingLinkTarget } from '@contember/react-routing'
import { ReactNode } from 'react'
import { BrushIcon, HomeIcon } from 'lucide-react'
import { uic } from '../utils/uic'

export type NavigationItem = {
	icon?: ReactNode
	label: ReactNode
	to?: RoutingLinkTarget
	subItems?: NavigationItem[]
}

export interface NavigationProps {
	items: NavigationItem[]
}

export const Navigation = () => {
	return (
		<div>
			<NavigationList
				items={[
					{
						icon: <HomeIcon size={16}/>,
						label: 'Home',
						to: 'index',
					},
					{
						icon: <BrushIcon size={16}/>,
						label: 'UI',
						subItems: [
							{
								// icon: <ListIcon size={16}/>,
								label: 'Buttons',
								to: 'ui/button',
							},
							{
								// icon: <ListIcon size={16}/>,
								label: 'Page 2',
								to: 'index',
							},
						],
					},
				]}
			/>
		</div>
	)
}

export const NavigationList = ({ items }: NavigationProps) => {
	return (
		<div className={'flex flex-col'}>
			{items.map((item, index) => (
				<NavigationItem key={index} {...item} />
			))}
		</div>
	)
}

export const NavigationItem = ({ icon, label, to, subItems }: NavigationItem) => {
	return (
		<div>
			{to ? (
				<Link to={to}>
					<NavigationLink>
						<span className={'w-4'}>{icon}</span>
						<span>{label}</span>
						<span className={'ml-auto'}></span>
					</NavigationLink>
				</Link>
			) : (
				<NavigationLink>
					<span className={'w-4'}>{icon}</span>
					<span>{label}</span>
					<span className={'ml-auto'}></span>
				</NavigationLink>
			)}
			{subItems && (
				<div className={'ml-2'}>
					<NavigationList items={subItems} />
				</div>
			)}
		</div>
	)
}

export const NavigationLink = uic('a', {
	baseClass: 'flex justify-start py-1 px-2 w-full gap-1 rounded hover:bg-gray-100 cursor-pointer text-sm items-center',
})
