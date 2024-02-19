import { cn } from '../../../lib/utils/cn'
import { DropIndicator } from '../ui/sortable'
import * as React from 'react'
import { ReactNode } from 'react'
import {
	MultiSelectItemDragOverlayUI,
	MultiSelectItemRemoveButtonUI,
	MultiSelectItemUI,
	MultiSelectSortableItemContentUI,
	SelectCreateNewTrigger,
	SelectDefaultPlaceholderUI,
	SelectInputActionsUI,
	SelectInputUI,
	SelectListItemUI,
	SelectPopoverContent,
} from './ui'
import { createDefaultSelectFilter } from './filter'
import { Popover, PopoverTrigger } from '../ui/popover'
import { ChevronDownIcon, PlusIcon } from 'lucide-react'
import { SelectListInner } from './list'
import { RepeaterSortable, RepeaterSortableDragOverlay, RepeaterSortableDropIndicator, RepeaterSortableEachItem, RepeaterSortableItemActivator, RepeaterSortableItemNode } from '@contember/react-repeater-dnd-kit'
import { Component, HasOne, SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/interface'
import { SelectDataView, SelectItemTrigger, SelectOption, SelectPlaceholder, SortableMultiSelect } from '@contember/react-select'
import { CreateEntityDialog } from './create-new'
import { Button } from '../ui/button'

const MultiSortableSelectDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={cn('relative', position === 'before' ? '-translate-x-0.5' : 'translate-x-1.5')}>
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'left' : 'right'} />
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
	createNewForm?: ReactNode
}

export const SortableMultiSelectInput = Component<SortableMultiSelectInputProps>(({ field, filterField, options, children, sortableBy, connectAt, placeholder, createNewForm }) => {
	const filter = createDefaultSelectFilter(filterField)
	return (
		<SortableMultiSelect field={field} sortableBy={sortableBy} connectAt={connectAt} options={options}>
			<div className="flex gap-1 items-center">
				<Popover>
					<PopoverTrigger asChild>
						<SelectInputUI>
							<SelectPlaceholder>
								{placeholder ?? <SelectDefaultPlaceholderUI />}
							</SelectPlaceholder>

							<RepeaterSortable>
								<RepeaterSortableEachItem>
									<div className={'flex'}>
										<MultiSortableSelectDropIndicator position={'before'} />
										<RepeaterSortableItemNode>
											<MultiSelectItemUI>
												<HasOne field={connectAt}>
													<RepeaterSortableItemActivator>
														<MultiSelectSortableItemContentUI>
															{children}
														</MultiSelectSortableItemContentUI>
													</RepeaterSortableItemActivator>

													<SelectItemTrigger>
														<MultiSelectItemRemoveButtonUI onClick={e => e.stopPropagation()} />
													</SelectItemTrigger>
												</HasOne>
											</MultiSelectItemUI>
										</RepeaterSortableItemNode>
										<MultiSortableSelectDropIndicator position={'after'} />
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

							<SelectInputActionsUI>
								<ChevronDownIcon className={'w-4 h-4'} />
							</SelectInputActionsUI>
						</SelectInputUI>
					</PopoverTrigger>

					<SelectPopoverContent>
						<SelectDataView filterTypes={filter?.filterTypes}>
							<SelectListInner filterToolbar={filter?.filterToolbar}>
								<SelectOption>
									<SelectItemTrigger>
										<SelectListItemUI>
											{children}
										</SelectListItemUI>
									</SelectItemTrigger>
								</SelectOption>
							</SelectListInner>
						</SelectDataView>
					</SelectPopoverContent>
				</Popover>
				{createNewForm && (
					<CreateEntityDialog trigger={<SelectCreateNewTrigger />}>
						{createNewForm}
					</CreateEntityDialog>
				)}
			</div>
		</SortableMultiSelect>
)
}, ({ children, field, sortableBy, connectAt, options }) => {
	return (
		<SortableMultiSelect field={field} sortableBy={sortableBy} connectAt={connectAt} options={options}>
			{children}
		</SortableMultiSelect>
	)
})
