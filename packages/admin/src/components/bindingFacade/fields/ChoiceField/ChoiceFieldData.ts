import type { ReactElement, ReactNode } from 'react'
import { FieldErrors } from '@contember/ui'

export namespace ChoiceFieldData {

	export interface SingleOption<Value = unknown > {
		label: ReactNode
		searchKeywords: string
		description?: ReactNode
		value: Value
		key: string
	}

	export type Options<Value = unknown> = SingleOption<Value>[]

	export interface BaseChoiceMetadata<Value = unknown> {
		data: Options<Value>
		errors: FieldErrors | undefined
		onSearch?: (input: string) => void
		isLoading?: boolean
		onAddNew?: () => void
	}

	export interface SingleChoiceFieldMetadata<Value = unknown> extends BaseChoiceMetadata<Value> {
		currentValue: SingleOption<Value> | null
		onSelect: (newValue: SingleOption<Value>) => void
		onClear: () => void
	}

	export interface MultipleChoiceFieldMetadata<Value> extends BaseChoiceMetadata<Value> {
		currentValues: SingleOption<Value>[]
		onClear: () => void
		onAdd: (option: SingleOption<Value>) => void
		onRemove: (option: SingleOption<Value>) => void
		onMove?: (oldIndex: number, newIndex: number) => void
	}

	export interface SingleChoiceFieldProps<Value = unknown> {
		children: (metadata: SingleChoiceFieldMetadata<Value>) => ReactElement | null
	}

	export interface MultiChoiceFieldProps<Value = unknown> {
		children: (metadata: MultipleChoiceFieldMetadata<Value>) => ReactElement | null
	}

}
