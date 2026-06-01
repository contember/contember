import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Popover, PopoverTrigger } from '@contember/react-ui-lib-base'
import {
	Component,
	RecursionTerminatorPortal,
	SugaredQualifiedEntityList,
	SugaredRelativeSingleEntity,
	useEntity,
	useEntityBeforePersist,
} from '@contember/interface'
import { Button } from '@contember/react-ui-lib-base'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import {
	SelectCreateNewTrigger,
	SelectDefaultPlaceholderUI,
	SelectInputActionsUI,
	SelectInputUI,
	SelectInputWrapperUI,
	SelectPopoverContent,
} from './ui.js'
import { DefaultSelectDataView } from './list.js'
import { Select, SelectEachValue, SelectItemTrigger, SelectPlaceholder } from '@contember/react-select'
import { CreateEntityDialog } from './create-new.js'
import { DataViewSortingDirections, DataViewUnionFilterFields } from '@contember/react-dataview'
import { useFormFieldId } from '@contember/react-form'
import { dict } from '@contember/react-ui-lib-base'

export type SelectInputProps = {
	field: SugaredRelativeSingleEntity['field']
	children: ReactNode
	options?: SugaredQualifiedEntityList['entities']
	placeholder?: ReactNode
	createNewForm?: ReactNode
	queryField?: DataViewUnionFilterFields
	initialSorting?: DataViewSortingDirections
	required?: boolean
}

export const SelectInput = Component<SelectInputProps>(
	({ field, queryField, options, children, placeholder, createNewForm, initialSorting, required }) => {
		const [open, setOpen] = React.useState(false)
		const id = useFormFieldId()
		const getEntity = useEntity().getAccessor
		useEntityBeforePersist(useCallback(() => {
			if (!required) {
				return
			}
			const entity = getEntity().getEntity({ field })
			if (!entity.existsOnServer && !entity.hasUnpersistedChanges) {
				entity.addError(dict.errors.required)
			}
		}, [field, getEntity, required]))

		return (
			<Select
				field={field}
				onSelect={() => setOpen(false)}
				options={options}
			>
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
									<SelectInputActionsUI>
										<SelectEachValue>
											<SelectItemTrigger>
												<Button size="xs" variant="ghost" onClick={event => event.stopPropagation()}>
													<XIcon className="w-4 h-4" />
												</Button>
											</SelectItemTrigger>
										</SelectEachValue>
										<ChevronDownIcon className="w-4 h-4" />
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
						<RecursionTerminatorPortal field={{ field, kind: 'hasOne' }}>
							<CreateEntityDialog trigger={<SelectCreateNewTrigger />}>
								{createNewForm}
							</CreateEntityDialog>
						</RecursionTerminatorPortal>
					)}
				</div>
			</Select>
		)
	},
	({ field, children, options }) => {
		return (
			<Select field={field} options={options}>
				{children}
			</Select>
		)
	},
)
