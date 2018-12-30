import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { EntityName, FieldName, Filter, Scalar, VariableInput } from '../../bindingTypes'
import {
	EnforceSubtypeRelation,
	EntityListDataProvider,
	Field,
	Props,
	SyntheticChildrenProvider,
	ToOne
} from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { VariableInputTransformer } from '../../model/VariableInputTransformer'
import { Parser } from '../../queryLanguage'

export interface ChoiceFieldPublicProps {
	name: FieldName
}

export interface ChoiceFieldBaseProps<Label extends React.ReactNode = React.ReactNode> {
	children: (
		data: ChoiceField.Data<Label>,
		currentValue: ChoiceField.ValueRepresentation | null,
		onChange: (newValue: ChoiceField.ValueRepresentation) => void,
		environment: Environment
	) => React.ReactNode
}

export interface ChoiceFieldStaticProps<Label extends React.ReactNode = React.ReactNode> {
	options: Array<[ChoiceField.Value, Label]>
}

export interface ChoiceFieldDynamicProps {
	entityName: EntityName
	optionFieldName: FieldName
	filter?: Filter
}

export type ChoiceFieldProps<Label extends React.ReactNode = React.ReactNode> = ChoiceFieldPublicProps &
	ChoiceFieldBaseProps<Label> &
	(ChoiceFieldDynamicProps | ChoiceFieldStaticProps<Label>)

class ChoiceField<Label extends React.ReactNode = React.ReactNode> extends React.Component<ChoiceFieldProps<Label>> {
	public static displayName = 'ChoiceField'

	public render() {
		return (
			<Field.DataRetriever name={this.props.name}>
				{(fieldName, data, environment) => {
					if ('options' in this.props) {
						const rawOptions = this.props.options

						return (
							<Field name={fieldName}>
								{(data: FieldAccessor): React.ReactNode => {
									const options = this.normalizeStaticOptions(rawOptions, environment)

									return this.props.children(
										options.map((item, i): [ChoiceField.ValueRepresentation, Label] => [i.toFixed(0), item[1]]),
										options.reduce((acc: ChoiceField.ValueRepresentation | null, [value], index) => {
											if (acc !== null) {
												return acc
											}
											return data.hasValue(value) ? index.toFixed(0) : null
										}, null),
										(newValue: ChoiceField.ValueRepresentation) => {
											data.onChange && data.onChange(options[parseInt(newValue, 10)][0])
										},
										environment
									)
								}}
							</Field>
						)
					}
					return null // TODO handle the dynamic case
				}}
			</Field.DataRetriever>
		)
	}

	private normalizeStaticOptions(
		options: ChoiceFieldStaticProps<Label>['options'],
		environment: Environment
	): Array<[GraphQlBuilder.Literal | Scalar, Label]> {
		return options.map(
			([key, value]): [GraphQlBuilder.Literal | Scalar, Label] => [
				VariableInputTransformer.transformValue(key, environment),
				value
			]
		)
	}

	public static generateSyntheticChildren(
		props: Props<ChoiceFieldPublicProps & (ChoiceFieldStaticProps | ChoiceFieldDynamicProps)>,
		environment: Environment
	): React.ReactNode {
		if ('options' in props) {
			return Parser.generateWrappedNode(props.name, fieldName => <Field name={fieldName} />, environment)
		}
		return (
			<>
				<EntityListDataProvider name={props.entityName} filter={props.filter} associatedField={props.name}>
					<Field name={props.optionFieldName} />
				</EntityListDataProvider>
				<ToOne field={props.name}>
					<Field name={props.optionFieldName} />
				</ToOne>
			</>
		)
	}
}

namespace ChoiceField {
	export type Value = Scalar | VariableInput

	export type ValueRepresentation = string

	export type Data<Label extends React.ReactNode = React.ReactNode> = Array<[ValueRepresentation, Label]>

	export type Options<Label extends React.ReactNode = React.ReactNode> = Array<[ChoiceField.Value, Label]>
}

export { ChoiceField }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof ChoiceField,
	SyntheticChildrenProvider<ChoiceFieldProps>
>
