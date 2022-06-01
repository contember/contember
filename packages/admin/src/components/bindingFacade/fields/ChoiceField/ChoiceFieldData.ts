import type { EntityAccessor, EntityId, Environment, ErrorAccessor, FieldValue } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { FieldErrors } from '@contember/ui'

export namespace ChoiceFieldData {

	export type StaticValue = FieldValue
	export type DynamicValue = EntityAccessor['idOnServer']

	// This is just the JS array index as specified in options or as returned from the server.
	export type ValueRepresentation = number

	export interface SingleDatum<ActualValue extends Environment.Value | EntityId = EntityId> {
		key: ValueRepresentation
		label: ReactNode
		searchKeywords: string
		description?: ReactNode
		actualValue: ActualValue
	}

	export type Data<ActualValue extends Environment.Value | EntityId = EntityId> = SingleDatum<ActualValue>[]

	export interface BaseChoiceMetadata {
		data: Data<DynamicValue | StaticValue>
		errors: FieldErrors | undefined
		onAddNew?: () => void
	}

	export interface SingleChoiceFieldMetadata extends BaseChoiceMetadata {
		currentValue: ValueRepresentation
		onChange: (newValue: ValueRepresentation) => void
	}

	export interface MultipleChoiceFieldMetadata extends BaseChoiceMetadata {
		currentValues: ValueRepresentation[]
		clear: () => void
		onChange: (optionKey: ValueRepresentation, isChosen: boolean) => void
		onMove?: (oldIndex: number, newIndex: number) => void
	}

	export interface SingleChoiceFieldProps {
		children: (metadata: SingleChoiceFieldMetadata) => ReactElement | null
	}

	export interface MultiChoiceFieldProps {
		children: (metadata: MultipleChoiceFieldMetadata) => ReactElement | null
	}

}
