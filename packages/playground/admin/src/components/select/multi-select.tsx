import * as React from 'react'
import { ReactNode } from 'react'
import { MultiSelectItemContentUI, MultiSelectItemRemoveButtonUI, MultiSelectItemUI, SelectDefaultPlaceholderUI, SelectInputActionsUI, SelectInputUI, SelectListItemUI, SelectPopoverContent } from './ui'
import { ChevronDownIcon } from 'lucide-react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { Component, EntityAccessor, HasMany, SugaredQualifiedEntityList, SugaredRelativeEntityList, useEntity } from '@contember/interface'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { createDefaultSelectFilter } from './filter'
import { SelectList } from './list'

export interface MultiSelectFieldProps {
	field: SugaredRelativeEntityList['field']
	children: ReactNode
	options: SugaredQualifiedEntityList['entities']
	filterField?: string
	placeholder?: ReactNode
}

export const MultiSelectField = Component<MultiSelectFieldProps>(({ field, filterField, options, children, placeholder }) => {
	const filter = filterField ? createDefaultSelectFilter(filterField) : {
		filterTypes: undefined,
		filterToolbar: undefined,
	}
	placeholder ??= <SelectDefaultPlaceholderUI />
	const entity = useEntity()
	const hasEntities = entity.getEntityList({ field }).length > 0
	const [open, setOpen] = React.useState(false)
	const handleSelect = useReferentiallyStableCallback((selected: EntityAccessor) => {

		entity.getEntityList({ field }).connectEntity(selected)
		// setOpen(false)
	})
	const RemoveButton = () => {
		const itemEntity = useEntity()
		return (
			<MultiSelectItemRemoveButtonUI onClick={e => {
				entity.getEntityList({ field }).disconnectEntity(itemEntity)
				e.stopPropagation()
			}} />
		)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<SelectInputUI>
					{!hasEntities ? placeholder : null}
					<HasMany field={field}>
						<MultiSelectItemUI>
							<MultiSelectItemContentUI>
								{children}
							</MultiSelectItemContentUI>
							<RemoveButton />
						</MultiSelectItemUI>
					</HasMany>
					<SelectInputActionsUI>
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
		<HasMany field={field}>
			{children}
		</HasMany>
	)
})
