import { cn } from '../../utils/cn'
import { DropIndicator } from '../ui/sortable'
import * as React from 'react'
import { ReactNode, useMemo } from 'react'
import { MultiSelectItemDragOverlayUI, MultiSelectItemRemoveButtonUI, MultiSelectItemUI, MultiSelectSortableItemContentUI, SelectDefaultPlaceholderUI, SelectInputActionsUI, SelectInputUI, SelectListItemUI, SelectPopoverContent } from './ui'
import { createDefaultSelectFilter } from './filter'
import { Popover, PopoverTrigger } from '../ui/popover'
import { ChevronDownIcon } from 'lucide-react'
import { SelectList } from './list'
import { Repeater, RepeaterEmpty, RepeaterSortable, RepeaterSortableDragOverlay, RepeaterSortableDropIndicator, RepeaterSortableEachItem, RepeaterSortableItemActivator, RepeaterSortableItemNode } from '@contember/react-repeater-dnd-kit'
import { Component, EntityAccessor, HasOne, SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField, useEntity, useEntityList } from '@contember/interface'
import { useReferentiallyStableCallback } from '@contember/react-utils'

const MultiSortableSelectDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={cn('relative', position === 'before' ? '-translate-x-0.5' : 'translate-x-1.5')}>
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'left' : 'right'}/>
		</RepeaterSortableDropIndicator>
	</div>
)

export interface SortableMultiSelectInputProps {
	field: SugaredRelativeEntityList['field']
	sortableBy: SugaredRelativeSingleField['field']
	connectAt: SugaredRelativeSingleEntity['field']
	children: ReactNode
	options: SugaredQualifiedEntityList['entities']
	filterField?: string
	placeholder?: ReactNode
}

export const SortableMultiSelectInput = Component<SortableMultiSelectInputProps>(({ field, filterField, options, children, sortableBy, connectAt, placeholder }) => {
	placeholder ??= <SelectDefaultPlaceholderUI/>

	const filter = filterField ? createDefaultSelectFilter(filterField) : {
		filterTypes: undefined,
		filterToolbar: undefined,
	}
	const list = useEntityList({ field })
	const [open, setOpen] = React.useState(false)
	const selectedIds = useMemo(() => Array.from(list).map(it => it.getEntity({ field: connectAt }).id), [connectAt, list])

	const handleSelect = useReferentiallyStableCallback((selected: EntityAccessor) => {
		if (selectedIds.includes(selected.id)) {
			Array.from(list).find(it => it.getEntity({ field: connectAt }).id === selected.id)?.deleteEntity()
		} else {
			list.createNewEntity(getEntity => {
				getEntity().connectEntityAtField({ field: connectAt }, selected)
			})
		}
		// setOpen(false)
	})
	const RemoveButton = () => {
		const itemEntity = useEntity()
		return (
			<MultiSelectItemRemoveButtonUI onClick={e => {
				itemEntity.deleteEntity()
				e.stopPropagation()
			}}/>
		)
	}
	const isSelected = (entity: EntityAccessor) => selectedIds.includes(entity.id)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<SelectInputUI>
					<Repeater field={field} sortableBy={sortableBy} initialEntityCount={0}>
						<RepeaterSortable>
							<RepeaterEmpty>
								{placeholder}
							</RepeaterEmpty>
							<RepeaterSortableEachItem>
								<div className={'flex'}>
									<MultiSortableSelectDropIndicator position={'before'}/>
									<RepeaterSortableItemNode>
										<MultiSelectItemUI>
											<RepeaterSortableItemActivator>
												<MultiSelectSortableItemContentUI>
													<HasOne field={connectAt}>
														{children}
													</HasOne>
												</MultiSelectSortableItemContentUI>
											</RepeaterSortableItemActivator>
											<RemoveButton/>
										</MultiSelectItemUI>
									</RepeaterSortableItemNode>
									<MultiSortableSelectDropIndicator position={'after'}/>
								</div>
							</RepeaterSortableEachItem>
							<RepeaterSortableDragOverlay>
								<MultiSelectItemDragOverlayUI>
									<HasOne field={connectAt}>
										{children}
									</HasOne>
								</MultiSelectItemDragOverlayUI>
							</RepeaterSortableDragOverlay>
						</RepeaterSortable>
					</Repeater>
					<SelectInputActionsUI>
						<ChevronDownIcon className={'w-4 h-4'}/>
					</SelectInputActionsUI>
				</SelectInputUI>
			</PopoverTrigger>
			<SelectPopoverContent>
				<SelectList filterToolbar={filter?.filterToolbar} filterTypes={filter?.filterTypes} entities={options} onSelect={handleSelect} isSelected={isSelected}>
					<SelectListItemUI>
						{children}
					</SelectListItemUI>
				</SelectList>
			</SelectPopoverContent>
		</Popover>
	)
}, ({ children, field, sortableBy, connectAt }) => {
	return (
		<Repeater field={field} sortableBy={sortableBy} initialEntityCount={0}>
			<HasOne field={connectAt}>
				{children}
			</HasOne>
		</Repeater>
	)
})
