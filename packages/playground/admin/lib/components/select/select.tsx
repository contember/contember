import * as React from 'react'
import { ReactNode } from 'react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { Component, SugaredQualifiedEntityList } from '@contember/interface'
import { Button } from '../ui/button'
import { SugaredRelativeSingleEntity } from '@contember/react-binding'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import { SelectCreateNewTrigger, SelectDefaultPlaceholderUI, SelectInputActionsUI, SelectInputUI, SelectListItemUI, SelectPopoverContent } from './ui'
import { SelectListInner } from './list'
import { createDefaultSelectFilter } from './filter'
import { Select, SelectDataView, SelectEachValue, SelectItemTrigger, SelectOption, SelectPlaceholder } from '@contember/react-select'
import { CreateEntityDialog } from './create-new'

export interface SelectInputProps {
	field: SugaredRelativeSingleEntity['field']
	children: ReactNode
	options: SugaredQualifiedEntityList['entities']
	filterField?: string
	placeholder?: ReactNode
	createNewForm?: ReactNode
}


export const SelectInput = Component<SelectInputProps>(({ field, filterField, options, children, placeholder, createNewForm }, env) => {
	const filter = createDefaultSelectFilter(filterField)
	const [open, setOpen] = React.useState(false)

	return (
		<Select field={field} onSelect={() => setOpen(false)} options={options}>
			<div className="flex gap-1 items-center">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>

						<SelectInputUI>
							<SelectPlaceholder>
								{placeholder ?? <SelectDefaultPlaceholderUI />}
							</SelectPlaceholder>
							<SelectEachValue>
								{children}
							</SelectEachValue>
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
		</Select>
	)
}, ({ field, children, options }) => {
	return (
		<Select field={field} options={options}>
			{children}
		</Select>
	)
})

