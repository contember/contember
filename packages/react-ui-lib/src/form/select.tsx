import {
	MultiSelectInput,
	MultiSelectInputProps,
	SelectDefaultPlaceholderUI,
	SelectInput,
	SelectInputActionsUI,
	SelectInputProps,
	SelectInputUI,
	SelectInputWrapperUI,
	SelectListItemUI,
	SelectPopoverContent,
	SortableMultiSelectInput,
	SortableMultiSelectInputProps,
} from '../select/index.js'
import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { FormContainer, FormContainerProps } from './container.js'
import { FormFieldScope, FormHasManyRelationScope, FormHasOneRelationScope, useFormFieldState } from '@contember/react-form'
import { Component, Field, RecursionTerminator, SugaredRelativeSingleField, useEntityBeforePersist, useField } from '@contember/interface'
import { Popover, PopoverTrigger } from '@contember/react-ui-lib-base'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { dict } from '@contember/react-ui-lib-base'
import { useEnumOptionsFormatter } from '../labels/index.js'

export type SelectFieldProps =
	& SelectInputProps
	& Omit<FormContainerProps, 'children'>

/**
 * `SelectField` is a component for single-entity relationship selection (hasOne). Must be used within an Entity context.
 *
 * ## Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * ## Features
 * - Manages hasOne relationships through a dropdown interface.
 * - Supports custom option rendering and creation of new entities.
 * - Sorts options by a specified field.
 * - Query-based option filtering.
 *
 * ## Example: Basic usage
 * ```tsx
 * <SelectField
 *   field="country"
 *   label="Home Country"
 * >
 *   <Field field="name" />
 * </SelectField>
 * ```
 *
 * ## Example: With sorting and form allowing creation of new entities
 * ```tsx
 * <SelectField
 *   field="author"
 *   label="Author"
 *   initialSorting={{ name: 'asc' }}
 *   createNewForm={<CountryForm />}
 * >
 *   <Field field="name" />
 * </SelectField>
 * ```
 *
 * ## Example: With query-based filtering
 * ```tsx
 * <SelectField
 *   field="author"
 *   label="Author"
 *   options="Author[archived != false]"
 * >
 *   <Field field="name" />
 * </SelectField>
 * ```
 */
export const SelectField = Component<SelectFieldProps>(
	({ field, label, description, children, options, queryField, placeholder, createNewForm, errors, initialSorting, required }, env) => {
		return (
			<RecursionTerminator field={{ field, kind: 'hasOne' }}>
				<FormHasOneRelationScope field={field}>
					<FormContainer description={description} label={label} errors={errors} required={required}>
						<SelectInput
							field={field}
							queryField={queryField}
							options={options}
							placeholder={placeholder}
							createNewForm={createNewForm}
							initialSorting={initialSorting}
							required={required}
						>
							{children}
						</SelectInput>
					</FormContainer>
				</FormHasOneRelationScope>
			</RecursionTerminator>
		)
	},
)

export type MultiSelectFieldProps =
	& MultiSelectInputProps
	& Omit<FormContainerProps, 'children' | 'required'>

/**
 * MultiSelectField component for managing multiple-entity (hasMany) relationships.
 *
 * ## Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`)
 *
 * ## Features
 * - Multiple entity selection with chip display
 * - Supports custom option rendering and creation of new entities
 * - Maintains selection order based on user interaction
 * - Query-based option filtering with initial sorting
 * - Integrated error state handling from parent form
 *
 * ## Example: Basic usage
 * ```tsx
 * <MultiSelectField
 *   field="categories"
 *   label="Article Categories"
 * >
 *   <Field field="name" />
 * </MultiSelectField>
 * ```
 *
 * ## Example: With creation form and sorting
 * ```tsx
 * <MultiSelectField
 *   field="tags"
 *   label="Article Tags"
 *   initialSorting={{ name: 'asc' }}
 *   createNewForm={<TagCreateForm />}
 * >
 *   <Field field="name" />
 * </MultiSelectField>
 * ```
 */
export const MultiSelectField = Component<MultiSelectFieldProps>(
	({ field, label, description, children, options, queryField, placeholder, createNewForm, errors, initialSorting }) => {
		return (
			<RecursionTerminator field={{ field, kind: 'hasMany' }}>
				<FormHasManyRelationScope field={field}>
					<FormContainer description={description} label={label} errors={errors}>
						<MultiSelectInput
							field={field}
							queryField={queryField}
							options={options}
							placeholder={placeholder}
							createNewForm={createNewForm}
							initialSorting={initialSorting}
						>
							{children}
						</MultiSelectInput>
					</FormContainer>
				</FormHasManyRelationScope>
			</RecursionTerminator>
		)
	},
)

export type SortableMultiSelectFieldProps =
	& SortableMultiSelectInputProps
	& Omit<FormContainerProps, 'children' | 'required'>

/**
 * SortableMultiSelectField component for ordered multi-entity relationships with drag-and-drop.
 *
 * ## Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`)
 * - Requires sort field configuration via `sortableBy` prop
 *
 * ## Features
 * - Drag-and-drop reordering of selected items
 * - Visual sorting indicators during drag operations
 * - Customizable sort field storage
 * - Connection point management for complex relationships
 * - Inherits all MultiSelectField features
 *
 * ## Example: Basic usage
 * ```tsx
 * <SortableMultiSelectField
 *   field="chapterPages"
 *   label="Page Order"
 *   sortableBy="pageNumber"
 *   connectAt="bookChapter"
 * >
 *   <Field field="content" />
 * </SortableMultiSelectField>
 * ```
 */
export const SortableMultiSelectField = Component<SortableMultiSelectFieldProps>(
	({ field, label, description, children, options, queryField, placeholder, sortableBy, connectAt, createNewForm, errors, initialSorting }) => {
		return (
			<FormHasManyRelationScope field={field}>
				<FormContainer description={description} label={label} errors={errors}>
					<SortableMultiSelectInput
						field={field}
						queryField={queryField}
						options={options}
						placeholder={placeholder}
						sortableBy={sortableBy}
						connectAt={connectAt}
						createNewForm={createNewForm}
						initialSorting={initialSorting}
					>
						{children}
					</SortableMultiSelectInput>
				</FormContainer>
			</FormHasManyRelationScope>
		)
	},
)

export type SelectEnumFieldProps =
	& Omit<FormContainerProps, 'children'>
	& {
		field: SugaredRelativeSingleField['field']
		options?: Record<string, React.ReactNode> | { value: null | string | number | boolean; label: React.ReactNode }[]
		placeholder?: React.ReactNode
		defaultValue?: string
		required?: boolean
	}

/**
 * SelectEnumField component for enum value selection with auto-option detection.
 *
 * ## Requirements
 * - Field must be an enum type when using auto-detection
 * - Manual options must be provided if enum not detected
 *
 * ## Features
 * - Auto-detects enum options from schema definition
 * - Supports mixed value types (string, number, boolean, null)
 * - Two option formats: object map or array of {value/label}
 * - Required field validation with error feedback
 * - Custom placeholder support
 * - Pre-persist validation for required fields
 *
 * ## Example: Auto-detected enum usage
 * ```tsx
 * <SelectEnumField
 *   field="articleStatus"
 *   label="Publication Status"
 *   required
 * />
 * ```
 *
 * ## Example: Manual options with mixed types
 * ```tsx
 * <SelectEnumField
 *   field="notificationSettings"
 *   label="Alert Preferences"
 *   options={[
 *     { value: 'email', label: 'Email Notifications' },
 *     { value: 1, label: 'SMS Alerts' },
 *     { value: null, label: 'No Notifications' }
 *   ]}
 *   placeholder="Select preference..."
 * />
 * ```
 *
 * ## Example: Object-based options
 * ```tsx
 * <SelectEnumField
 *   field="userRole"
 *   label="Account Type"
 *   options={{
 *     admin: 'Administrator',
 *     user: 'Standard User',
 *     guest: 'Temporary Access'
 *   }}
 * />
 * ```
 */
export const SelectEnumField = Component<SelectEnumFieldProps>(
	({ field, label, description, options, placeholder, required }) => {
		return (
			<FormFieldScope field={field}>
				<FormContainer description={description} label={label} required={required}>
					<SelectEnumFieldInner field={field} options={options} placeholder={placeholder} required={required} />
				</FormContainer>
			</FormFieldScope>
		)
	},
	({ field, defaultValue }) => <Field field={field} defaultValue={defaultValue} />,
	'SelectEnumField',
)

const useNormalizedOptions = (options: SelectEnumFieldProps['options']) => {
	return useMemo(() => {
		if (!options) return []
		return Array.isArray(options)
			? options
			: Object.entries(options).map(([value, label]) => ({ value, label }))
	}, [options])
}

const SelectEnumFieldInner = ({ field, options, placeholder, required }: SelectEnumFieldProps) => {
	const [open, setOpen] = React.useState(false)
	const fieldAccessor = useField(field)
	const fieldAccessorGetter = fieldAccessor.getAccessor

	useEntityBeforePersist(useCallback(() => {
		if (!required) {
			return
		}

		const field = fieldAccessorGetter()
		if (!field.value) {
			field.addError(dict.errors.required)
		}
	}, [fieldAccessorGetter, required]))

	const fieldState = useFormFieldState()
	const enumLabelsFormatter = useEnumOptionsFormatter()
	const id = fieldState?.htmlId
	const enumName = fieldState?.field?.enumName

	options ??= enumName ? enumLabelsFormatter(enumName) : undefined
	if (!options) {
		throw new Error('SelectEnumFields: options are required')
	}

	const normalizedOptions = useNormalizedOptions(options)
	const selectedValue = useMemo(() => normalizedOptions.find(it => it.value === fieldAccessor.value), [fieldAccessor.value, normalizedOptions])

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<SelectInputWrapperUI>
				<PopoverTrigger asChild>
					<SelectInputUI id={id ? `${id}-input` : undefined}>
						{selectedValue?.label ?? placeholder ?? <SelectDefaultPlaceholderUI />}
						<SelectInputActionsUI>
							{open ? <ChevronUpIcon className={'w-4 h-4'} /> : <ChevronDownIcon className={'w-4 h-4'} />}
						</SelectInputActionsUI>
					</SelectInputUI>
				</PopoverTrigger>
			</SelectInputWrapperUI>
			<SelectPopoverContent>
				{normalizedOptions.map(({ value, label }) => (
					<SelectListItemUI
						key={value?.toString()}
						onClick={() => {
							fieldAccessor.updateValue(value)
							setOpen(false)
						}}
					>
						{label}
					</SelectListItemUI>
				))}
			</SelectPopoverContent>
		</Popover>
	)
}
