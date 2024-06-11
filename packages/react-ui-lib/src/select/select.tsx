import * as React from 'react'
import { ReactNode } from 'react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { Component, SugaredQualifiedEntityList } from '@contember/interface'
import { Button } from '../ui/button'
import { SugaredRelativeSingleEntity } from '@contember/interface'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import { SelectCreateNewTrigger, SelectDefaultPlaceholderUI, SelectInputActionsUI, SelectInputUI, SelectInputWrapperUI, SelectListItemUI, SelectPopoverContent } from './ui'
import { SelectListInner } from './list'
import { Select, SelectDataView, SelectEachValue, SelectItemTrigger, SelectOption, SelectPlaceholder } from '@contember/react-select'
import { CreateEntityDialog } from './create-new'
import { SelectDefaultFilter } from './filter'
import { DataViewSortingDirections, DataViewUnionFilterFields } from '@contember/react-dataview'
import { useFormFieldId } from '@contember/react-form'

export type SelectInputProps =
	& {
		field: SugaredRelativeSingleEntity['field']
		children: ReactNode
		options?: SugaredQualifiedEntityList['entities']
		placeholder?: ReactNode
		createNewForm?: ReactNode
		queryField?: DataViewUnionFilterFields
		initialSorting?: DataViewSortingDirections
	}


export const SelectInput = Component<SelectInputProps>(({ field, queryField, options, children, placeholder, createNewForm, initialSorting }) => {
	const [open, setOpen] = React.useState(false)
	const id = useFormFieldId()

	return (
		<Select field={field} onSelect={() => setOpen(false)} options={options}>
			<div className="flex gap-1 items-center">
				<Popover open={open} onOpenChange={setOpen}>
					<SelectInputWrapperUI>
						<PopoverTrigger asChild>
							<SelectInputUI id={id ? `${id}-input` : undefined}>
								<SelectPlaceholder>
									{placeholder ?? <SelectDefaultPlaceholderUI />}
								</SelectPlaceholder>
								<SelectEachValue>
									{children}
								</SelectEachValue>
							</SelectInputUI>
						</PopoverTrigger>
						<SelectInputActionsUI>
							<SelectEachValue>
								<SelectItemTrigger>
									<Button size={'xs'} variant={'ghost'}>
										<XIcon className={'w-4 h-4'} />
									</Button>
								</SelectItemTrigger>
							</SelectEachValue>
							<ChevronDownIcon className={'w-4 h-4'} />
						</SelectInputActionsUI>
					</SelectInputWrapperUI>
					<SelectPopoverContent>
						<SelectDataView initialSorting={initialSorting} queryField={queryField}>
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
		</Select>
	)
}, ({ field, children, options }) => {
	return (
		<Select field={field} options={options}>
			{children}
		</Select>
	)
})

