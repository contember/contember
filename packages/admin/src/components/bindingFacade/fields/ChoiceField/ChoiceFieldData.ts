import { EntityAccessor, Environment, ErrorAccessor, FieldValue } from '@contember/binding'
import { ReactElement, ReactNode } from 'react'

export namespace ChoiceFieldData {
	export type ChoiceArity = 'single' | 'multiple'

	export type StaticValue = FieldValue
	export type DynamicValue = EntityAccessor['idOnServer']

	// This is just the JS array index as specified in options or as returned from the server.
	export type ValueRepresentation = number

	export interface SingleDatum<ActualValue extends Environment.Value = string> {
		key: ValueRepresentation
		label: ReactNode
		searchKeywords: string
		description?: ReactNode
		actualValue: ActualValue
	}

	export type Data<ActualValue extends Environment.Value = string> = SingleDatum<ActualValue>[]

	export interface BaseChoiceMetadata {
		data: Data<DynamicValue | StaticValue>
		errors: ErrorAccessor | undefined
		environment: Environment
		isMutating: boolean
	}

	export interface SingleChoiceFieldMetadata extends BaseChoiceMetadata {
		currentValue: ValueRepresentation
		onChange: (newValue: ValueRepresentation) => void
	}

	export interface MultipleChoiceFieldMetadata extends BaseChoiceMetadata {
		currentValues: ValueRepresentation[]
		clear: () => void
		onChange: (optionKey: ValueRepresentation, isChosen: boolean) => void
	}

	export interface MetadataByArity {
		single: SingleChoiceFieldMetadata
		multiple: MultipleChoiceFieldMetadata
	}

	export type MetadataPropsByArity =
		| {
				arity: 'single'
				children: (metadata: ChoiceFieldData.SingleChoiceFieldMetadata) => ReactElement | null
		  }
		| {
				arity: 'multiple'
				children: (metadata: ChoiceFieldData.MultipleChoiceFieldMetadata) => ReactElement | null
		  }
}
