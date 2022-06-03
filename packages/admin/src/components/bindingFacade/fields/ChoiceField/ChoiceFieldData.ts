import type { ReactElement, ReactNode } from 'react'
import { FieldErrors } from '@contember/ui'

export namespace ChoiceFieldData {

	export interface SingleDatum<ActualValue = unknown > {
		label: ReactNode
		searchKeywords: string
		description?: ReactNode
		actualValue: ActualValue
		key: string
	}

	export type Data<ActualValue = unknown> = SingleDatum<ActualValue>[]

	export interface BaseChoiceMetadata<ActualValue = unknown> {
		data: Data<ActualValue>
		errors: FieldErrors | undefined
		onSearch?: (input: string) => void
		isLoading?: boolean
		onAddNew?: () => void
	}

	export interface SingleChoiceFieldMetadata<ActualValue = unknown> extends BaseChoiceMetadata<ActualValue> {
		currentValue: SingleDatum<ActualValue> | null
		onSelect: (newValue: SingleDatum<ActualValue>) => void
		onClear: () => void
	}

	export interface MultipleChoiceFieldMetadata<ActualValue> extends BaseChoiceMetadata<ActualValue> {
		currentValues: SingleDatum<ActualValue>[]
		onClear: () => void
		onAdd: (option: SingleDatum<ActualValue>) => void
		onRemove: (option: SingleDatum<ActualValue>) => void
		onMove?: (oldIndex: number, newIndex: number) => void
	}

	export interface SingleChoiceFieldProps<ActualValue = unknown> {
		children: (metadata: SingleChoiceFieldMetadata<ActualValue>) => ReactElement | null
	}

	export interface MultiChoiceFieldProps<ActualValue = unknown> {
		children: (metadata: MultipleChoiceFieldMetadata<ActualValue>) => ReactElement | null
	}

}
