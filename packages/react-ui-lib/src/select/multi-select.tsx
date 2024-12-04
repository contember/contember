import * as React from 'react'
import { ReactNode } from 'react'
import {
	MultiSelectItemContentUI,
	MultiSelectItemRemoveButtonUI,
	MultiSelectItemUI,
	SelectCreateNewTrigger,
	SelectDefaultPlaceholderUI,
	SelectInputActionsUI,
	SelectInputUI,
	SelectInputWrapperUI,
	SelectPopoverContent,
} from './ui'
import { ChevronDownIcon } from 'lucide-react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { Component, RecursionTerminatorPortal, SugaredQualifiedEntityList, SugaredRelativeEntityList } from '@contember/interface'
import { DefaultSelectDataView } from './list'
import { MultiSelect, SelectEachValue, SelectItemTrigger, SelectPlaceholder } from '@contember/react-select'
import { CreateEntityDialog } from './create-new'
import { DataViewSortingDirections, DataViewUnionFilterFields } from '@contember/react-dataview'
import { useFormFieldId } from '@contember/react-form'

export type MultiSelectInputProps =
	& {
		field: SugaredRelativeEntityList['field']
		options?: SugaredQualifiedEntityList['entities']
		children: ReactNode
		placeholder?: ReactNode
		createNewForm?: ReactNode
		queryField?: DataViewUnionFilterFields
		initialSorting?: DataViewSortingDirections
	}

export const MultiSelectInput = Component<MultiSelectInputProps>(({ field, queryField, options, children, placeholder, createNewForm, initialSorting }) => {
	const id = useFormFieldId()

	return (
		<MultiSelect field={field} options={options}>
			<div className="flex gap-1 items-center">
				<Popover>
					<SelectInputWrapperUI>
						<PopoverTrigger asChild>
							<SelectInputUI id={id ? `${id}-input` : undefined}>
								<SelectPlaceholder>
									{placeholder ?? <SelectDefaultPlaceholderUI />}
								</SelectPlaceholder>

								<SelectEachValue>
									<MultiSelectItemUI>
										<MultiSelectItemContentUI>
											{children}
										</MultiSelectItemContentUI>
										<SelectItemTrigger>
											<MultiSelectItemRemoveButtonUI onClick={e => e.stopPropagation()} />
										</SelectItemTrigger>
									</MultiSelectItemUI>
								</SelectEachValue>

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
					<RecursionTerminatorPortal field={{ field, kind: 'hasMany' }}>
						<CreateEntityDialog trigger={<SelectCreateNewTrigger />}>
							{createNewForm}
						</CreateEntityDialog>
					</RecursionTerminatorPortal>
				)}
			</div>
		</MultiSelect>
	)
}, ({ field, options, children }) => {
	return (
		<MultiSelect field={field} options={options}>
			{children}
		</MultiSelect>
	)
})
