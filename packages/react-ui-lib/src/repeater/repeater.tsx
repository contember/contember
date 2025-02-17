import { Component, RecursionTerminator } from '@contember/interface'
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
import { uic } from '../utils'
import { DropIndicator } from '../ui/sortable'
import { dict } from '../dict'
import { ReactNode } from 'react'

const RepeaterWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-2 relative bg-white mb-4',
})
const RepeaterItemUI = uic('div', {
	baseClass: 'rounded border bg-gray-50 border-gray-200 p-4 relative group/repeater-item',
})
const RepeaterDragOverlayUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative bg-opacity-60 bg-gray-100 backdrop-blur-sm',
})
const RepeaterHandleUI = uic('button', {
	baseClass: 'absolute top-1/2 -left-7 h-6 w-6 flex justify-end align-center opacity-10 group-hover/repeater-item:opacity-30 hover:!opacity-100 transition-opacity -translate-y-1/2',
	beforeChildren: <GripVerticalIcon size={16} />,
})
const RepeaterEmptyUI = uic('div', {
	baseClass: 'italic text-sm text-gray-600',
})

export const RepeaterDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={'relative'}>
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'top' : 'bottom'} />
		</RepeaterSortableDropIndicator>
	</div>
)

export const RepeaterAddItemButton = ({ children, index }: { children?: React.ReactNode; index?: RepeaterAddItemIndex }) => (
	<RepeaterAddItemTrigger index={index}>
		<div>
			<Button variant={'link'} size={'sm'} className={'gap-1 px-0'}>
				{children || <>
					<PlusCircleIcon size={16} />
					<span>{dict.repeater.addItem}</span>
				</>}
			</Button>
		</div>
	</RepeaterAddItemTrigger>
)

/**
 * A button that removes the item from the repeater.
 */
export const RepeaterRemoveItemButton = ({ children }: { children?: React.ReactNode }) => (
	<RepeaterRemoveItemTrigger>
		<Button variant={'link'} size={'sm'} className={'gap-1 px-0 group/button'}>
			{children || <>
				<Trash2Icon className={'group-hover/button:text-red-600'} size={16} />
			</>}
		</Button>
	</RepeaterRemoveItemTrigger>
)

/**
 * A container for actions that can be performed on a repeater item. Placed in the top right corner of the item.
 */
export const RepeaterItemActions = uic('div', {
	baseClass: 'absolute top-1 right-2 flex gap-2',
})

export type DefaultRepeaterProps =
	& {
		title?: ReactNode
		/**
		 * Position of the add button.
		 */
		addButtonPosition?: 'none' | 'after' | 'before' | 'around'
		addButtonLabel?: ReactNode
	}
	& RepeaterProps

/**
 * DefaultRepeater is a wrapper around Repeater that provides a default UI for a list of items.
 *
 * ## Props {@link DefaultRepeaterProps}
 * - field or entities, sortableBy or orderBy, addButtonPosition, title
 *
 * ## Example
 * ```tsx
 * <DefaultRepeater entities="RepeaterItem" sortableBy="order" title="Foo items" addButtonPosition="around">
 * 	<InputField field="title" />
 * 	<RepeaterItemActions>
 * 		<RepeaterRemoveItemButton />
 * 	</RepeaterItemActions>
 * </DefaultRepeater>
 * ```
 */
export const DefaultRepeater = Component<DefaultRepeaterProps>(props => {
	if ('field' in props) {
		return (
			<RecursionTerminator field={{ field: props.field, kind: 'hasMany' }}>
				<DefaultRepeaterInner {...props} />
			</RecursionTerminator>
		)
	}
	return <DefaultRepeaterInner {...props} />
})

const DefaultRepeaterInner = Component<DefaultRepeaterProps>(({ title, children, addButtonPosition = 'after', addButtonLabel, ...props }) => {
	const isSortable = props.sortableBy !== undefined

	if (!isSortable) {
		return (
			<Repeater {...props}>
				<RepeaterWrapperUI>
					{title && <h3 className={'font-medium'}>{title}</h3>}
					{(addButtonPosition === 'before' || addButtonPosition === 'around') && <RepeaterAddItemButton index="first">{addButtonLabel}</RepeaterAddItemButton>}
					<RepeaterEmpty>
						<RepeaterEmptyUI>
							{dict.repeater.empty}
						</RepeaterEmptyUI>
					</RepeaterEmpty>
					<RepeaterEachItem>
						<RepeaterItemUI>
							{children}
						</RepeaterItemUI>
					</RepeaterEachItem>
					{(addButtonPosition === 'after' || addButtonPosition === 'around') && <RepeaterAddItemButton>{addButtonLabel}</RepeaterAddItemButton>}
				</RepeaterWrapperUI>
			</Repeater>
		)
	}
	return (
		<Repeater {...props}>
			<RepeaterWrapperUI>
				{title && <h3 className={'font-medium'}>{title}</h3>}
				{(addButtonPosition === 'before' || addButtonPosition === 'around') && <RepeaterAddItemButton index="first">{addButtonLabel}</RepeaterAddItemButton>}
				<RepeaterSortable>
					<RepeaterEmpty>
						<RepeaterEmptyUI>
							{dict.repeater.empty}
						</RepeaterEmptyUI>
					</RepeaterEmpty>
					<RepeaterSortableEachItem>
						<div>
							<RepeaterDropIndicator position={'before'} />
							<RepeaterSortableItemNode>
								<RepeaterItemUI>
									<RepeaterSortableItemActivator>
										<RepeaterHandleUI />
									</RepeaterSortableItemActivator>
									{children}
								</RepeaterItemUI>
							</RepeaterSortableItemNode>
							<RepeaterDropIndicator position={'after'} />
						</div>
					</RepeaterSortableEachItem>
					<RepeaterSortableDragOverlay>
						<RepeaterDragOverlayUI>
							{children}
						</RepeaterDragOverlayUI>
					</RepeaterSortableDragOverlay>
				</RepeaterSortable>

				{(addButtonPosition === 'after' || addButtonPosition === 'around') && <RepeaterAddItemButton>{addButtonLabel}</RepeaterAddItemButton>}
			</RepeaterWrapperUI>
		</Repeater>
	)
}, props => {
	return <Repeater {...props} />
})
