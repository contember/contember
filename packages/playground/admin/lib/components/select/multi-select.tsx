import * as React from 'react'
import { ReactNode } from 'react'
import { MultiSelectItemContentUI, MultiSelectItemRemoveButtonUI, MultiSelectItemUI, SelectCreateNewTrigger, SelectDefaultPlaceholderUI, SelectInputActionsUI, SelectInputUI, SelectListItemUI, SelectPopoverContent } from './ui'
import { ChevronDownIcon } from 'lucide-react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { Component, SugaredQualifiedEntityList, SugaredRelativeEntityList } from '@contember/interface'
import { SelectDefaultFilter } from './filter'
import { SelectListInner } from './list'
import { MultiSelect, SelectDataView, SelectEachValue, SelectItemTrigger, SelectOption, SelectPlaceholder } from '@contember/react-select'
import { CreateEntityDialog } from './create-new'
import { DataViewUnionFilterFields } from '@contember/react-dataview'

export type MultiSelectInputProps =
	& {
		field: SugaredRelativeEntityList['field']
		options?: SugaredQualifiedEntityList['entities']
		children: ReactNode
		placeholder?: ReactNode
		createNewForm?: ReactNode
		queryField?: DataViewUnionFilterFields
}

export const MultiSelectInput = Component<MultiSelectInputProps>(({ field, queryField, options, children, placeholder, createNewForm }) => {
	return (
		<MultiSelect field={field} options={options}>
			<div className="flex gap-1 items-center">
				<Popover>
					<PopoverTrigger asChild>
						<SelectInputUI>
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
					<SelectPopoverContent>
						<SelectDataView queryField={queryField}>
							<SelectListInner filterToolbar={<SelectDefaultFilter />}>
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
		</MultiSelect>
	)
})
