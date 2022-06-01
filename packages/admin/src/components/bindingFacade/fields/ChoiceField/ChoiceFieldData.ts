import type { ReactElement, ReactNode } from 'react'
import { FieldErrors } from '@contember/ui'

export namespace ChoiceFieldData {

	// This is just the JS array index as specified in options or as returned from the server.
	export type ValueRepresentation = number

	export interface SingleDatum<ActualValue = unknown > {
		key: ValueRepresentation
		label: ReactNode
		searchKeywords: string
		description?: ReactNode
		actualValue: ActualValue
	}

	export type Data<ActualValue = unknown> = SingleDatum<ActualValue>[]

	export interface BaseChoiceMetadata<ActualValue = unknown> {
		data: Data<ActualValue>
		errors: FieldErrors | undefined
		onAddNew?: () => void
	}

	export interface SingleChoiceFieldMetadata<ActualValue = unknown> extends BaseChoiceMetadata<ActualValue> {
		currentValue: ValueRepresentation
		onChange: (newValue: ValueRepresentation) => void
	}

	export interface MultipleChoiceFieldMetadata<ActualValue = unknown> extends BaseChoiceMetadata<ActualValue> {
		currentValues: ValueRepresentation[]
		clear: () => void
		onChange: (optionKey: ValueRepresentation, isChosen: boolean) => void
		onMove?: (oldIndex: number, newIndex: number) => void
	}

	export interface SingleChoiceFieldProps<ActualValue = unknown> {
		children: (metadata: SingleChoiceFieldMetadata<ActualValue>) => ReactElement | null
	}

	export interface MultiChoiceFieldProps<ActualValue = unknown> {
		children: (metadata: MultipleChoiceFieldMetadata<ActualValue>) => ReactElement | null
	}

}
