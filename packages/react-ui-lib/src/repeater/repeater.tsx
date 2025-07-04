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
	baseClass: 'flex flex-col gap-2 relative bg-background mb-4',
})
const RepeaterItemUI = uic('div', {
	baseClass: 'rounded-sm border border-gray-200 bg-gray-50 p-4 relative group/repeater-item',
})
const RepeaterDragOverlayUI = uic('div', {
	baseClass: 'rounded-sm border border-gray-300 p-4 relative bg-gray-100/60 backdrop-blur-xs',
})
const RepeaterHandleUI = uic('button', {
	baseClass: 'absolute top-1/2 -left-7 h-6 w-6 flex justify-end align-center opacity-10 group-hover/repeater-item:opacity-30 hover:!opacity-100 transition-opacity -translate-y-1/2',
	beforeChildren: <GripVerticalIcon size={16} />,
})
const RepeaterEmptyUI = uic('div', {
	baseClass: 'italic text-sm text-gray-600',
})

/**
 * Props for the {@link RepeaterDropIndicator} component.
 */
export type RepeaterDropIndicatorProps = {
	/**
	* The position of drop indicator
	*/
	position: 'before' | 'after'
}

/**
 * Props {@link RepeaterDropIndicatorProps}
 *
 * `RepeaterDropIndicator` is a visual indicator for sortable repeater items,
 * showing where an item will be dropped. It adapts its placement based on the `position` prop.
 */
export const RepeaterDropIndicator = ({ position }: RepeaterDropIndicatorProps) => (
	<div className="relative">
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'top' : 'bottom'} />
		</RepeaterSortableDropIndicator>
	</div>
)

/**
 * Props for the {@link RepeaterAddItemButton} component.
 */
export type RepeaterAddItemButtonProps = {
	/**
	 * The children to be rendered inside the button.
	 */
	children?: React.ReactNode
	/**
	 * The index of the item to be added.
	 */
	index?: RepeaterAddItemIndex
}

/**
 * Props {@link RepeaterAddItemButtonProps}
 *
 * `RepeaterAddItemButton` is a button that adds a new item to a repeater at a specified index.
 * It wraps the `RepeaterAddItemTrigger` and displays customizable content.
 * By default, it shows a plus icon alongside a localized label.
 */
export const RepeaterAddItemButton = ({ children, index }: RepeaterAddItemButtonProps) => (
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
 * `RepeaterRemoveItemButtonProps` is a type that defines the props for the `RepeaterRemoveItemButton` component.
 * It includes an optional `children` prop that can be used to customize the content of the button.
 */
export type RepeaterRemoveItemButtonProps = {
	children?: ReactNode
}

/**
 * Props see {@link RepeaterRemoveItemButtonProps}
 *
 * `RepeaterRemoveItemButton` is a button that removes an item from a repeater.
 * It wraps the {@link RepeaterRemoveItemTrigger} and displays a customizable child element.
 * By default, it shows a trash icon that turns red on hover.
 */
export const RepeaterRemoveItemButton = ({ children }: RepeaterRemoveItemButtonProps) => (
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

/**
 * Props for the {@link DefaultRepeater} component.
 */
export type DefaultRepeaterProps =
	& {
		/**
		 * Optional repeater title.
		 */
		title?: ReactNode
		/**
		 * Optional position of the add button.
		 */
		addButtonPosition?: 'none' | 'after' | 'before' | 'around'
		/**
		 * Optional label of the add button.
		 */
		addButtonLabel?: ReactNode
	}
	& RepeaterProps

/**
 * Props {@link DefaultRepeaterProps}.
 *
 * DefaultRepeater is a wrapper around Repeater that provides a default UI for a list of items.
 *
 * #### Example
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
