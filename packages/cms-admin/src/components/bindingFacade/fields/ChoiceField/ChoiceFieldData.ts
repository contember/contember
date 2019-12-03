import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { EntityAccessor, Environment, Field, FieldMetadata, FieldName, Scalar } from '../../../../binding'

export namespace ChoiceFieldData {
	export enum ChoiceArity {
		Single = 'single',
		Multiple = 'multiple',
	}

	export type StaticValue = GraphQlBuilder.Literal | Scalar

	export type DynamicValue = EntityAccessor['primaryKey']

	// This is just the JS array index as specified in options or as returned from the server.
	export type ValueRepresentation = number

	export interface SingleDatum<ActualValue extends Environment.Value = string> {
		key: ValueRepresentation
		label: React.ReactNode
		description?: React.ReactNode
		actualValue: ActualValue
	}

	export type Data<ActualValue extends Environment.Value = string> = SingleDatum<ActualValue>[]

	export interface BaseChoiceMetadata extends Omit<FieldMetadata, 'data'> {
		data: ChoiceFieldData.Data<ChoiceFieldData.DynamicValue | ChoiceFieldData.StaticValue>
	}

	export interface SingleChoiceFieldMetadata extends BaseChoiceMetadata {
		currentValue: ChoiceFieldData.ValueRepresentation
		onChange: (newValue: ChoiceFieldData.ValueRepresentation) => void
	}

	export interface MultipleChoiceFieldMetadata extends BaseChoiceMetadata {
		currentValues: Array<ChoiceFieldData.ValueRepresentation>
		onChange: (optionKey: ChoiceFieldData.ValueRepresentation, isChosen: boolean) => void
	}

	export type InnerBaseProps = Field.RawMetadata & BaseProps

	export interface ChoiceFieldPublicProps {
		name: FieldName
	}

	export type BaseProps = ChoiceFieldPublicProps & {
		optionFieldFactory?: React.ReactNode
	} & (
			| {
					arity: ChoiceArity.Single
					children: (metadata: SingleChoiceFieldMetadata) => React.ReactElement | null
			  }
			| {
					arity: ChoiceArity.Multiple
					children: (metadata: MultipleChoiceFieldMetadata) => React.ReactElement | null
			  }
		)
}
