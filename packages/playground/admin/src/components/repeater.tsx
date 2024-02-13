import { uic } from '../utils/uic'
import { GripVerticalIcon } from 'lucide-react'
import { Component } from '@contember/interface'
import { Repeater, RepeaterEachItem, RepeaterProps } from '@contember/react-repeater'
import { DropIndicator } from './ui/sortable'
import * as React from 'react'
import {
	RepeaterSortable,
	RepeaterSortableDragOverlay,
	RepeaterSortableDropIndicator,
	RepeaterSortableEachItem,
	RepeaterSortableItemActivator,
	RepeaterSortableItemNode,
} from '@contember/react-repeater-dnd-kit'

export const RepeaterItemsWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-2 p-2',
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

export type DefaultRepeaterProps =
	& RepeaterProps

export const DefaultRepeater = Component<DefaultRepeaterProps>(({ children, ...props }) => {
	const isSortable = props.sortableBy !== undefined

	if (!isSortable) {
		return (
			<Repeater {...props}>
				<RepeaterEachItem>
					<RepeaterItemsWrapperUI>
						{children}
					</RepeaterItemsWrapperUI>
				</RepeaterEachItem>
			</Repeater>
		)
	}
	return (
		<Repeater {...props}>
			<RepeaterItemsWrapperUI>
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

			</RepeaterItemsWrapperUI>
		</Repeater>
	)
}, props => {
	return <Repeater {...props} />
})
