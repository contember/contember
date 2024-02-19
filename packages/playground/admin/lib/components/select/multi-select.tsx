import * as React from 'react'
import { ReactNode } from 'react'
import { MultiSelectItemContentUI, MultiSelectItemRemoveButtonUI, MultiSelectItemUI, SelectCreateNewTrigger, SelectDefaultPlaceholderUI, SelectInputActionsUI, SelectInputUI, SelectListItemUI, SelectPopoverContent } from './ui'
import { ChevronDownIcon, PlusIcon } from 'lucide-react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { Component, SugaredQualifiedEntityList, SugaredRelativeEntityList } from '@contember/interface'
import { createDefaultSelectFilter } from './filter'
import { SelectListInner } from './list'
import { MultiSelect, SelectDataView, SelectEachValue, SelectItemTrigger, SelectOption, SelectPlaceholder } from '@contember/react-select'
import { CreateEntityDialog } from './create-new'
import { Button } from '../ui/button'

export interface MultiSelectInputProps {
	field: SugaredRelativeEntityList['field']
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
	filterField?: string
	placeholder?: ReactNode
	createNewForm?: ReactNode
}

export const MultiSelectInput = Component<MultiSelectInputProps>(({ field, filterField, options, children, placeholder, createNewForm }) => {
	const filter = createDefaultSelectFilter(filterField)
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
		</MultiSelect>
)
})
