import { Component } from '@contember/interface'
import {
	Repeater,
	RepeaterAddItemTrigger,
	RepeaterEachItem,
	RepeaterProps,
	RepeaterRemoveItemTrigger,
} from '@contember/react-repeater'
import {
	RepeaterSortable,
	RepeaterSortableDragOverlay,
	RepeaterSortableDropIndicator,
	RepeaterSortableEachItem,
	RepeaterSortableItemActivator,
	RepeaterSortableItemNode,
} from '@contember/react-repeater-dnd-kit'
import { GripVerticalIcon, PlusCircleIcon, Trash2Icon } from 'lucide-react'
import { Button } from './ui/button'
import { uic } from '../utils/uic'
import { DropIndicator } from './ui/sortable'

export const RepeaterWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-2',
})
export const RepeaterItemsWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-2 p-4 pr-8 relative shadow-sm bg-white rounded border border-gray-300 max-w-md',
})
export const RepeaterItemUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative',
})
export const RepeaterDragOverlayUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative bg-opacity-60 bg-gray-100 backdrop-blur-sm',
})
export const RepeaterHandleUI = uic('button', {
	baseClass: 'absolute top-1/2 -left-6 h-6 w-6 flex justify-end align-center opacity-10 hover:opacity-100 transition-opacity -translate-y-1/2',
	beforeChildren: <GripVerticalIcon size={16}/>,
})

export const RepeaterDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={'relative'}>
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'top' : 'bottom'}/>
		</RepeaterSortableDropIndicator>
	</div>
)

export const RepeaterAddItemButton = ({ children }: { children?: React.ReactNode }) => (
	<RepeaterAddItemTrigger index={'last'}>
		<div>
			<Button variant={'link'} size={'sm'} className={'gap-1 px-0'}>
				{children || <>
					<PlusCircleIcon size={16}/>
					<span>Add item</span>
				</>}
			</Button>
		</div>
	</RepeaterAddItemTrigger>
)

export const RepeaterRemoveItemButton = ({ children }: { children?: React.ReactNode }) => (
	<RepeaterRemoveItemTrigger>
		<div className={'absolute top-1 right-2 flex'}>
			<Button variant={'link'} size={'sm'} className={'gap-1 px-0 group'}>
				{children || <>
					<Trash2Icon className={'group-hover:text-red-600'} size={16}/>
				</>}
			</Button>
		</div>
	</RepeaterRemoveItemTrigger>
)

export type DefaultRepeaterProps = { title?: string }
	& RepeaterProps

export const DefaultRepeater = Component<DefaultRepeaterProps>(({ title, children, ...props }) => {
	const isSortable = props.sortableBy !== undefined

	if (!isSortable) {
		return (
			<div>
				<Repeater {...props}>
					{title && <h3 className={'font-medium'}>{title}</h3>}

					<RepeaterWrapperUI>
						<RepeaterEachItem>
							<RepeaterItemsWrapperUI>
								<RepeaterRemoveItemButton/>
								{children}
							</RepeaterItemsWrapperUI>
						</RepeaterEachItem>
					</RepeaterWrapperUI>

					<RepeaterAddItemButton/>
				</Repeater>
			</div>
		)
	}
	return (
		<div>
			<Repeater {...props}>
				<RepeaterItemsWrapperUI>
					{title && <h3 className={'font-medium'}>{title}</h3>}
					<RepeaterSortable>
						<RepeaterSortableEachItem>
							<div>
								<RepeaterDropIndicator position={'before'}/>
								<RepeaterSortableItemNode>
									<RepeaterItemUI>
										<RepeaterSortableItemActivator>
											<RepeaterHandleUI/>
										</RepeaterSortableItemActivator>
										{children}
									</RepeaterItemUI>
								</RepeaterSortableItemNode>
								<RepeaterDropIndicator position={'after'}/>
							</div>
						</RepeaterSortableEachItem>
						<RepeaterSortableDragOverlay>
							<RepeaterDragOverlayUI>
								{children}
							</RepeaterDragOverlayUI>
						</RepeaterSortableDragOverlay>
					</RepeaterSortable>

					<RepeaterAddItemButton/>
				</RepeaterItemsWrapperUI>
			</Repeater>
		</div>
	)
}, props => {
	return <Repeater {...props}/>
})
