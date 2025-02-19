import {
	Component,
	HasOne,
	SugaredQualifiedEntityList,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
} from '@contember/interface'
import { DataViewSortingDirections, DataViewUnionFilterFields } from '@contember/react-dataview'
import { useFormFieldId } from '@contember/react-form'
import {
	RepeaterSortable,
	RepeaterSortableDragOverlay,
	RepeaterSortableDropIndicator,
	RepeaterSortableEachItem,
	RepeaterSortableItemActivator,
	RepeaterSortableItemNode,
} from '@contember/react-repeater-dnd-kit'
import { SelectItemTrigger, SelectPlaceholder, SortableMultiSelect } from '@contember/react-select'
import { ChevronDownIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { DropIndicator } from '../ui/sortable'
import { cn } from '../utils'
import { CreateEntityDialog } from './create-new'
import { DefaultSelectDataView } from './list'
import {
	MultiSelectItemDragOverlayUI,
	MultiSelectItemRemoveButtonUI,
	MultiSelectItemUI,
	MultiSelectItemWrapperUI,
	MultiSelectSortableItemContentUI,
	SelectCreateNewTrigger,
	SelectDefaultPlaceholderUI,
	SelectInputActionsUI,
	SelectInputUI,
	SelectInputWrapperUI,
	SelectPopoverContent,
} from './ui'

const MultiSortableSelectDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={cn('relative', position === 'before' ? '-translate-x-0.5' : 'translate-x-1.5')}>
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'left' : 'right'} />
		</RepeaterSortableDropIndicator>
	</div>
)

export type SortableMultiSelectInputProps =
	& {
		field: SugaredRelativeEntityList['field']
		sortableBy: SugaredRelativeSingleField['field']
		connectAt: SugaredRelativeSingleEntity['field']
		children: ReactNode
		options?: SugaredQualifiedEntityList['entities']
		placeholder?: ReactNode
		createNewForm?: ReactNode
		queryField?: DataViewUnionFilterFields
		initialSorting?: DataViewSortingDirections
	}

export const SortableMultiSelectInput = Component<SortableMultiSelectInputProps>(({ field, queryField, options, children, sortableBy, connectAt, placeholder, createNewForm, initialSorting }) => {
	const id = useFormFieldId()
	return (
		<SortableMultiSelect field={field} sortableBy={sortableBy} connectAt={connectAt} options={options}>
			<div className="flex gap-1 items-center">
				<Popover>
					<SelectInputWrapperUI>
						<PopoverTrigger asChild>
							<SelectInputUI id={id ? `${id}-input` : undefined}>
								<SelectPlaceholder>
									{placeholder ?? <SelectDefaultPlaceholderUI />}
								</SelectPlaceholder>

								<MultiSelectItemWrapperUI>
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
								</MultiSelectItemWrapperUI>

								<SelectInputActionsUI>
									<ChevronDownIcon className={'w-4 h-4'} />
								</SelectInputActionsUI>
							</SelectInputUI>
						</PopoverTrigger>
					</SelectInputWrapperUI>

					<SelectPopoverContent>
						<DefaultSelectDataView initialSorting={initialSorting} queryField={queryField}>
							{children}
						</DefaultSelectDataView>
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
