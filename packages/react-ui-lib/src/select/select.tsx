import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Popover, PopoverTrigger } from '../ui/popover'
import {
	Component,
	RecursionTerminatorPortal,
	SugaredQualifiedEntityList,
	SugaredRelativeSingleEntity,
	useEntity,
	useEntityBeforePersist,
} from '@contember/interface'
import { Button } from '../ui/button'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import {
	SelectCreateNewTrigger,
	SelectDefaultPlaceholderUI,
	SelectInputActionsUI,
	SelectInputUI,
	SelectInputWrapperUI,
	SelectPopoverContent,
} from './ui'
import { DefaultSelectDataView } from './list'
import { Select, SelectEachValue, SelectItemTrigger, SelectPlaceholder } from '@contember/react-select'
import { CreateEntityDialog } from './create-new'
import { DataViewSortingDirections, DataViewUnionFilterFields } from '@contember/react-dataview'
import { useFormFieldId } from '@contember/react-form'
import { dict } from '../dict'

export type SelectInputProps =
	& {
		/** The field to bind the selection to (`SugaredRelativeSingleEntity['field']`) */
		field: SugaredRelativeSingleEntity['field']
		/** React nodes for rendering each value or additional content inside the selection UI. */
		children: ReactNode
		/** Defines the entity options to be displayed. */
		options?: SugaredQualifiedEntityList['entities']
		/** Custom placeholder content when no value is selected. */
		placeholder?: ReactNode
		/** Content for creating a new entity, displayed within a `CreateEntityDialog`. */
		createNewForm?: ReactNode
		/** Specifies the field to query for filtering or sorting. */
		queryField?: DataViewUnionFilterFields
		/** Defines the initial sorting order of the options. */
		initialSorting?: DataViewSortingDirections
		/** Boolean flag to enforce validation for the selection input. */
		required?: boolean
	}

/**
 * SelectInput is a versatile component for rendering a selectable input field with advanced functionality.
 * It supports optional entity creation, validation, and sorting within the context of Contember's interface.
 *
 * #### Example: Basic usage with entity creation
 * ```tsx
 * <SelectInput
 *   field="category"
 *   placeholder="Select a category"
 *   options={[
 *     { field: 'id', operator: 'eq', value: '1', label: 'Option 1' },
 *     { field: 'id', operator: 'eq', value: '2', label: 'Option 2' }
 *   ]}
 *   createNewForm={<div>Form for creating a new category</div>}
 *   required
 * >
 *   <Field field="label" />
 * </SelectInput>
 * ```
 */
export const SelectInput = Component<SelectInputProps>(({ field, queryField, options, children, placeholder, createNewForm, initialSorting, required }) => {
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
}, ({ field, children, options }) => {
	return (
		<Select field={field} options={options}>
			{children}
		</Select>
	)
})
