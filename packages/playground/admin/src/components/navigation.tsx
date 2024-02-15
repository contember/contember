import { Link, RoutingLinkTarget } from '@contember/react-routing'
import { ReactNode } from 'react'
import {
	BrushIcon,
	ChevronRight,
	DotIcon,
	FormInputIcon,
	GripVertical,
	HomeIcon,
	KanbanIcon,
	TableIcon,
	ArchiveIcon,
} from 'lucide-react'
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
	const line = <span className={'h-full w-[1px] bg-gray-200'}>&nbsp;</span>
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
								icon: line,
								label: 'Buttons',
								to: 'ui/button',
							},
							{
								icon: line,
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
								icon: line,
								label: 'Dynamic columns',
								to: 'board/assignee',
							},
							{
								icon: line,
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
					{
						icon: <FormInputIcon size={16}/>,
						label: 'Inputs',
						subItems: [
							{
								icon: line,
								label: 'Basic inputs',
								to: 'input/basic',
							},
							{
								icon: line,
								label: 'Textarea',
								to: 'input/textarea',
							},
							{
								icon: line,
								label: 'Client validation',
								to: 'input/clientValidation',
							},
							{
								icon: line,
								label: 'Checkbox',
								to: 'input/checkbox',
							},
							{
								icon: line,
								label: 'Radio',
								to: 'input/enumRadio',
							},
						],
					},
					{
						icon: <ArchiveIcon size={16}/>,
						label: 'Select',
						subItems: [
							{
								icon: line,
								label: 'Has one select',
								to: 'select/hasOne',
							},
							{
								icon: line,
								label: 'Has many select',
								to: 'select/hasMany',
							},
							{
								icon: line,
								label: 'Has many sortable select',
								to: 'select/hasManySortable',
							},
						],
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
