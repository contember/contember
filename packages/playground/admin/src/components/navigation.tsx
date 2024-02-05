import { Link, RoutingLinkTarget } from '@contember/react-routing'
import { ReactNode } from 'react'
import { BrushIcon, ChevronRight, DotIcon, GripVertical, HomeIcon, KanbanIcon, TableIcon } from 'lucide-react'
import { uic } from '../utils/uic'

export type NavigationItem = {
	icon?: ReactNode
	label: ReactNode
	to?: RoutingLinkTarget
	subItems?: NavigationItem[]
	lvl?: number
}

export interface NavigationProps {
	items: NavigationItem[]
	lvl?: number
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
								icon: <span className={'h-full w-[1px] bg-gray-200'}>&nbsp;</span>,
								label: 'Buttons',
								to: 'ui/button',
							},
							{
								icon: <span className={'h-full w-[1px] bg-gray-200'}>&nbsp;</span>,
								label: 'Toasts',
								to: 'ui/toast',
							},
						],
					},
					{
						icon: <KanbanIcon size={16} />,
						label: 'Kanban',
						subItems: [
							{
								icon: <span className={'h-full w-[1px] bg-gray-200'}>&nbsp;</span>,
								label: 'Dynamic columns',
								to: 'board/assignee',
							},
							{
								icon: <span className={'h-full w-[1px] bg-gray-200'}>&nbsp;</span>,
								label: 'Static columns',
								to: 'board/status',
							},
						],
					},
					{
						icon: <GripVertical size={16} />,
						label: 'Repeater',
						to: 'repeater',
					},
					{
						icon: <TableIcon size={16} />,
						label: 'Grid',
						to: 'grid',
					},
				]}
			/>
		</div>
	)
}

export const NavigationList = ({ items, lvl = 0 }: NavigationProps) => {
	return (
		<div className={'flex flex-col'}>
			{items.map((item, index) => (
				<NavigationItem key={index} {...item} lvl={lvl}/>
			))}
		</div>
	)
}

export const NavigationItem = ({ icon, label, to, subItems, lvl = 0 }: NavigationItem) => {
	return (
		<div>
			{to ? (
				<Link to={to}>
					<NavigationLink className={'hover:bg-gray-100 cursor-pointer '}>
						<span className={'w-4 text-gray-400 inline-flex items-center justify-center'}>{icon}</span>
						<span className={lvl === 0 ? 'font-semibold' : ''}>{label}</span>
						<span className={'ml-auto'}></span>
					</NavigationLink>
				</Link>
			) : (
				<NavigationLink>
					<span className={'w-4 text-gray-400 items-center justify-center'}>{icon}</span>
					<span className={lvl === 0 ? 'font-semibold' : ''}>{label}</span>
					<span className={'ml-auto'}></span>
				</NavigationLink>
			)}
			{subItems && (
				<div className={'ml-2'}>
					<NavigationList items={subItems} lvl={lvl + 1} />
				</div>
			)}
		</div>
	)
}

export const NavigationLink = uic('a', {
	baseClass: 'flex justify-start py-2.5 px-2.5 w-full gap-1 rounded text-sm items-center transition-all duration-200',
})
