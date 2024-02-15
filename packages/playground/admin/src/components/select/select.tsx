import * as React from 'react'
import { MouseEventHandler, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Component, SugaredQualifiedEntityList, useEntity } from '@contember/interface'
import { Button } from '../ui/button'
import { EntityAccessor, HasOne, SugaredRelativeSingleEntity } from '@contember/react-binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import { SelectDefaultPlaceholderUI, SelectInputActionsUI, SelectInputUI, SelectListItemUI, SelectPopoverContent } from './ui'
import { SelectList } from './list'
import { createDefaultSelectFilter } from './filter'

export interface SelectInputProps {
	field: SugaredRelativeSingleEntity['field']
	children: ReactNode
	options: SugaredQualifiedEntityList['entities']
	filterField?: string
	placeholder?: ReactNode
}


export const SelectInput = Component<SelectInputProps>(({ field, filterField, options, children, placeholder }) => {
	placeholder ??= <SelectDefaultPlaceholderUI />
	const filter = filterField ? createDefaultSelectFilter(filterField) : { filterTypes: undefined, filterToolbar: undefined }
	const entity = useEntity()
	const selectedEntity = entity.getEntity({ field })
	const entityExists = selectedEntity.existsOnServer || selectedEntity.hasUnpersistedChanges
	const [open, setOpen] = React.useState(false)
	const handleSelect = useReferentiallyStableCallback((selected: EntityAccessor) => {
		entity.connectEntityAtField({ field }, selected)
		setOpen(false)
	})
	const handleClear = useReferentiallyStableCallback<MouseEventHandler>(e => {
		entity.disconnectEntityAtField({ field })
		e.stopPropagation()
	})

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<SelectInputUI>
					{entityExists
						? <HasOne field={field}>{children}</HasOne>
						: placeholder
					}
					<SelectInputActionsUI>
						{entityExists && <Button size={'xs'} variant={'ghost'}>
							<XIcon className={'w-4 h-4'} onClick={handleClear} />
						</Button>}

						<ChevronDownIcon className={'w-4 h-4'} />
					</SelectInputActionsUI>

				</SelectInputUI>
			</PopoverTrigger>
			<SelectPopoverContent>
				<SelectList filterToolbar={filter?.filterToolbar} filterTypes={filter?.filterTypes} entities={options} onSelect={handleSelect}>
					<SelectListItemUI>
						{children}
					</SelectListItemUI>
				</SelectList>
			</SelectPopoverContent>
		</Popover>
	)
}, ({ field, children }) => {
	return (
		<HasOne field={field}>
			{children}
		</HasOne>
	)
})

