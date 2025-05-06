import {
	Component,
	RecursionTerminatorPortal,
	SugaredQualifiedEntityList,
	SugaredRelativeEntityList,
} from '@contember/interface'
import { DataViewSortingDirections, DataViewUnionFilterFields } from '@contember/react-dataview'
import { useFormFieldId } from '@contember/react-form'
import { MultiSelect, SelectEachValue, SelectItemTrigger, SelectPlaceholder } from '@contember/react-select'
import { ChevronDownIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { Popover, PopoverTrigger } from '../ui/popover'
import { CreateEntityDialog } from './create-new'
import { DefaultSelectDataView } from './list'
import {
	MultiSelectItemContentUI,
	MultiSelectItemRemoveButtonUI,
	MultiSelectItemUI,
	MultiSelectItemWrapperUI,
	SelectCreateNewTrigger,
	SelectDefaultPlaceholderUI,
	SelectInputActionsUI,
	SelectInputUI,
	SelectInputWrapperUI,
	SelectPopoverContent,
} from './ui'

export type MultiSelectInputProps =
	& {
		/** Specifies the field to bind the selection to. */
		field: SugaredRelativeEntityList['field']
		/** An array of entities to populate the selection list. */
		options?: SugaredQualifiedEntityList['entities']
		/** React nodes for rendering the content of each selected item. */
		children: ReactNode
		/** Custom placeholder text when no items are selected. */
		placeholder?: ReactNode
		/** Content for creating a new entity. */
		createNewForm?: ReactNode
		/** Field used for querying and filtering options. */
		queryField?: DataViewUnionFilterFields
		/** Defines the initial sorting order for the options. */
		initialSorting?: DataViewSortingDirections
	}

/**
 * MultiSelectInput is a component for selecting multiple values from a list of options,
 * with support for inline entity creation, filtering, and sorting.
 *
 * #### Example: Basic usage with inline entity creation
 * ```tsx
 * <MultiSelectInput
 *   field="tags"
 *   placeholder="Select tags"
 *   options={[
 *     { field: 'id', operator: 'eq', value: '1', label: 'Tag 1' },
 *     { field: 'id', operator: 'eq', value: '2', label: 'Tag 2' },
 *   ]}
 *   createNewForm={<div>Form to create a new tag</div>}
 *   initialSorting="ASC"
 * >
 *   <Field field="name" />
 * </MultiSelectInput>
 * ```
 *
 * #### Sub-components
 * - {@link SelectInputWrapperUI}
 * - {@link SelectInputUI}
 * - {@link SelectDefaultPlaceholderUI}
 * - {@link MultiSelectItemWrapperUI}
 * - {@link SelectEachValue}
 * - {@link MultiSelectItemUI}
 * - {@link MultiSelectItemContentUI}
 * - {@link SelectItemTrigger}
 * - {@link MultiSelectItemRemoveButtonUI}
 * - {@link SelectInputActionsUI}
 * - {@link SelectPopoverContent}
 * - {@link Popover}
 * - {@link PopoverTrigger}
 *
 */
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

								<MultiSelectItemWrapperUI>
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
								</MultiSelectItemWrapperUI>

								<SelectInputActionsUI>
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
