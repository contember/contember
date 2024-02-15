import * as React from 'react'
import { forwardRef, ReactNode, useMemo } from 'react'
import { MultiSelectItemContentUI, MultiSelectItemRemoveButtonUI, MultiSelectItemUI, SelectDefaultPlaceholderUI, SelectInputActionsUI, SelectInputUI, SelectListItemUI, SelectPopoverContent } from './ui'
import { ChevronDownIcon } from 'lucide-react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { Component, EntityAccessor, HasMany, SugaredQualifiedEntityList, SugaredRelativeEntityList, useEntity, useEntityList } from '@contember/interface'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { createDefaultSelectFilter } from './filter'
import { SelectList } from './list'

export interface MultiSelectInputProps {
	field: SugaredRelativeEntityList['field']
	children: ReactNode
	options: SugaredQualifiedEntityList['entities']
	filterField?: string
	placeholder?: ReactNode
}

export const MultiSelectInput = Component<MultiSelectInputProps>(({ field, filterField, options, children, placeholder }) => {
	const filter = createDefaultSelectFilter(filterField)

	placeholder ??= <SelectDefaultPlaceholderUI />

	const entities = useEntityList({ field })
	const hasEntities = entities.length > 0
	const selectedEntities = useMemo(() => Array.from(entities).map(it => it.id), [entities])
	const [open, setOpen] = React.useState(false)
	const handleSelect = useReferentiallyStableCallback((selected: EntityAccessor) => {
		if (selectedEntities.includes(selected.id)) {
			entities.disconnectEntity(selected)
		} else {
			entities.connectEntity(selected)
		}
		// setOpen(false)
	})
	const RemoveButton = () => {
		const itemEntity = useEntity()
		return (
			<MultiSelectItemRemoveButtonUI onClick={e => {
				entities.disconnectEntity(itemEntity)
				e.stopPropagation()
			}} />
		)
	}
	const isSelected = (entity: EntityAccessor) => {
		return selectedEntities.includes(entity.id)
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
				<SelectList filterToolbar={filter?.filterToolbar} filterTypes={filter?.filterTypes} entities={options} onSelect={handleSelect} isSelected={isSelected}>
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
