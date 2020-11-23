import * as React from 'react'
import {
	EntityAccessor,
	Environment,
	ErrorAccessor,
	FieldAccessor,
	FieldValue,
	SugaredRelativeSingleField,
} from '@contember/binding'

export namespace ChoiceFieldData {
	export type ChoiceArity = 'single' | 'multiple'

	export type StaticValue = FieldValue
	export type DynamicValue = EntityAccessor['primaryKey']

	// This is just the JS array index as specified in options or as returned from the server.
	export type ValueRepresentation = number

	export interface SingleDatum<ActualValue extends Environment.Value = string> {
		key: ValueRepresentation
		label: React.ReactNode
		searchKeywords: string
		description?: React.ReactNode
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
				children: (metadata: ChoiceFieldData.SingleChoiceFieldMetadata) => React.ReactElement | null
		  }
		| {
				arity: 'multiple'
				children: (metadata: ChoiceFieldData.MultipleChoiceFieldMetadata) => React.ReactElement | null
		  }
}
