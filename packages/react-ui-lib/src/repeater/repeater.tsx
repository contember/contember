import { Component } from '@contember/interface'
import {
	Repeater,
	RepeaterAddItemIndex,
	RepeaterAddItemTrigger,
	RepeaterEachItem,
	RepeaterEmpty,
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
import { Button } from '../ui/button'
import { uic } from '../utils/uic'
import { DropIndicator } from '../ui/sortable'
import { dict } from '../dict'
import { ReactNode } from 'react'

export const RepeaterWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-2 p-4 pr-8 relative shadow-sm bg-white rounded border border-gray-300',
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

export const RepeaterAddItemButton = ({ children, index }: { children?: React.ReactNode; index?: RepeaterAddItemIndex }) => (
	<RepeaterAddItemTrigger index={index}>
		<div>
			<Button variant={'link'} size={'sm'} className={'gap-1 px-0'}>
				{children || <>
					<PlusCircleIcon size={16}/>
					<span>{dict.repeater.addItem}</span>
				</>}
			</Button>
		</div>
	</RepeaterAddItemTrigger>
)

export const RepeaterRemoveItemButton = ({ children }: { children?: React.ReactNode }) => (
	<RepeaterRemoveItemTrigger>
		<Button variant={'link'} size={'sm'} className={'gap-1 px-0 group/button'}>
			{children || <>
				<Trash2Icon className={'group-hover/button:text-red-600'} size={16}/>
			</>}
		</Button>
	</RepeaterRemoveItemTrigger>
)

export const RepeaterItemActions = uic('div', {
	baseClass: 'absolute top-1 right-2 flex gap-2',
})

export type DefaultRepeaterProps =
	& {
		title?: ReactNode
		addButtonPosition?: 'none' | 'after' | 'before' | 'around'
	}
	& RepeaterProps

export const DefaultRepeater = Component<DefaultRepeaterProps>(({ title, children, addButtonPosition = 'after', ...props }) => {
	const isSortable = props.sortableBy !== undefined

	if (!isSortable) {
		return (
			<div>
				<Repeater {...props}>
					{title && <h3 className={'font-medium'}>{title}</h3>}

					{(addButtonPosition === 'before' || addButtonPosition === 'around') && <RepeaterAddItemButton index="first" />}
					<RepeaterWrapperUI>
						<RepeaterEmpty>
							<div className="italic text-sm text-gray-600">
								{dict.repeater.empty}
							</div>
						</RepeaterEmpty>
						<RepeaterEachItem>
							<RepeaterItemUI>
								{children}
							</RepeaterItemUI>
						</RepeaterEachItem>
					</RepeaterWrapperUI>

					{(addButtonPosition === 'after' || addButtonPosition === 'around') && <RepeaterAddItemButton />}
				</Repeater>
			</div>
		)
	}
	return (
		<div>
			<Repeater {...props}>
				<RepeaterWrapperUI>
					{title && <h3 className={'font-medium'}>{title}</h3>}
					{(addButtonPosition === 'before' || addButtonPosition === 'around') && <RepeaterAddItemButton index="first" />}
					<RepeaterSortable>
						<RepeaterEmpty>
							<div className="italic text-sm text-gray-600">
								{dict.repeater.empty}
							</div>
						</RepeaterEmpty>
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

					{(addButtonPosition === 'after' || addButtonPosition === 'around') && <RepeaterAddItemButton />}
				</RepeaterWrapperUI>
			</Repeater>
		</div>
	)
}, props => {
	return <Repeater {...props}/>
})
