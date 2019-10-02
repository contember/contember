import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { FieldName, PRIMARY_KEY_NAME } from '../../../bindingTypes'
import {
	EnforceSubtypeRelation,
	EntityListDataProvider,
	Field,
	FieldMetadata,
	SyntheticChildrenProvider,
	ToMany,
	ToOne,
} from '../../../coreComponents'
import { EntityAccessor, Environment, Literal, VariableLiteral, VariableScalar } from '../../../dao'
import { Scalar } from '../../../dataTree'
import { QueryLanguage } from '../../../queryLanguage'
import { DynamicChoiceField, DynamicChoiceFieldProps } from './DynamicChoiceField'
import { StaticChoiceField, StaticChoiceFieldProps } from './StaticChoiceField'

export enum ChoiceArity {
	Single = 'single',
	Multiple = 'multiple',
}

export interface ChoiceFieldPublicProps {
	name: FieldName
}

export interface BaseChoiceMetadata extends Omit<FieldMetadata, 'data'> {
	data: ChoiceField.Data<ChoiceField.DynamicValue | ChoiceField.StaticValue>
}

export interface SingleChoiceFieldMetadata extends BaseChoiceMetadata {
	currentValue: ChoiceField.ValueRepresentation
	onChange: (newValue: ChoiceField.ValueRepresentation) => void
}

export interface MultipleChoiceFieldMetadata extends BaseChoiceMetadata {
	currentValues: Array<ChoiceField.ValueRepresentation>
	onChange: (optionKey: ChoiceField.ValueRepresentation, isChosen: boolean) => void
}

export type ChoiceFieldBaseProps = ChoiceFieldPublicProps & {
	optionFieldFactory?: React.ReactNode
} & (
		| {
				arity: ChoiceArity.Single
				children: (metadata: SingleChoiceFieldMetadata) => React.ReactElement | null
		  }
		| {
				arity: ChoiceArity.Multiple
				children: (metadata: MultipleChoiceFieldMetadata) => React.ReactElement | null
		  })

export type ChoiceFieldProps = ChoiceFieldBaseProps & {
	options: StaticChoiceFieldProps['options'] | DynamicChoiceFieldProps['options']
}

class ChoiceField extends React.PureComponent<ChoiceFieldProps> {
	public static displayName = 'ChoiceField'

	public render() {
		return (
			<Field.DataRetriever name={this.props.name}>
				{rawMetadata => {
					// Unfortunately, the "any" type is necessary because the TS inference otherwise fails here for some reason.
					const commonProps: any = {
						...rawMetadata,
						name: this.props.name,
						options: this.props.options,
						arity: this.props.arity,
						children: this.props.children,
						optionFieldFactory: this.props.optionFieldFactory,
					}

					if (Array.isArray(this.props.options)) {
						return <StaticChoiceField {...commonProps} />
					}
					return <DynamicChoiceField {...commonProps} />
				}}
			</Field.DataRetriever>
		)
	}

	public static generateSyntheticChildren(
		props: Omit<ChoiceFieldProps, 'children'>,
		environment: Environment,
	): React.ReactNode {
		if (Array.isArray(props.options)) {
			return QueryLanguage.wrapRelativeSingleField(props.name, environment)
		}

		const metadata:
			| QueryLanguage.WrappedQualifiedEntityList
			| QueryLanguage.WrappedQualifiedFieldList = props.optionFieldFactory
			? QueryLanguage.wrapQualifiedEntityList(props.options, props.optionFieldFactory, environment)
			: QueryLanguage.wrapQualifiedFieldList(props.options, fieldName => <Field name={fieldName} />, environment)

		return QueryLanguage.wrapRelativeSingleField(props.name, environment, fieldName => (
			<>
				<EntityListDataProvider entityName={metadata.entityName} filter={metadata.filter} associatedField={props.name}>
					{metadata.children}
				</EntityListDataProvider>
				{props.arity === ChoiceArity.Single && (
					<ToOne field={fieldName}>
						<Field name={PRIMARY_KEY_NAME} />
					</ToOne>
				)}
				{props.arity === ChoiceArity.Multiple && (
					<ToMany field={fieldName}>
						<Field name={PRIMARY_KEY_NAME} />
					</ToMany>
				)}
			</>
		))
	}
}

namespace ChoiceField {
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

	export type InnerBaseProps = Field.RawMetadata & ChoiceFieldBaseProps
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof ChoiceField,
	SyntheticChildrenProvider<ChoiceFieldProps>
>

export { ChoiceField }
