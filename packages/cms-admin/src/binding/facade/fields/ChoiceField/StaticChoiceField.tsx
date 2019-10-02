import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { Field } from '../../../coreComponents'
import { DataBindingError, Environment, VariableLiteral, VariableScalar } from '../../../dao'
import { Scalar } from '../../../dataTree'
import { VariableInputTransformer } from '../../../model/VariableInputTransformer'
import { ChoiceArity, ChoiceField } from './ChoiceField'

export interface StaticOption {
	label: React.ReactNode
	description?: React.ReactNode
}

export interface ScalarStaticOption extends StaticOption {
	value: Scalar | VariableScalar
}

export interface NormalizedStaticOption extends StaticOption {
	value: GraphQlBuilder.Literal | Scalar
}

export interface LiteralStaticOption extends StaticOption {
	value: VariableLiteral | GraphQlBuilder.Literal
}

export type StaticChoiceFieldProps = ChoiceField.InnerBaseProps & {
	options: ScalarStaticOption[] | LiteralStaticOption[]
}

export class StaticChoiceField extends React.PureComponent<StaticChoiceFieldProps> {
	public render() {
		if (this.props.arity === ChoiceArity.Multiple) {
			throw new DataBindingError('Static multiple-choice choice fields are not supported yet.')
		}

		const rawOptions = this.props.options
		const children = this.props.children

		if (rawOptions.length === 0) {
			return null
		}

		const environment = this.props.environment
		const options = this.normalizeOptions(rawOptions, environment)

		return (
			<Field name={this.props.fieldName}>
				{({ data, ...otherMetadata }): React.ReactNode => {
					if (this.props.arity === ChoiceArity.Multiple) {
						throw new DataBindingError('Static multiple-choice choice fields are not supported yet.')
					}

					const currentValue: ChoiceField.ValueRepresentation = options.findIndex(({ value }) => {
						return (
							data.hasValue(value) ||
							(value instanceof GraphQlBuilder.Literal &&
								typeof data.currentValue === 'string' &&
								value.value === data.currentValue)
						)
					}, null)

					return children({
						data: options.map(({ label, description, value: actualValue }, i) => ({
							key: i,
							description,
							label,
							actualValue,
						})),
						currentValue,
						onChange: (newValue: ChoiceField.ValueRepresentation) => {
							data.updateValue && data.updateValue(options[newValue].value)
						},
						...otherMetadata,
					})
				}}
			</Field>
		)
	}

	private normalizeOptions(options: Array<ScalarStaticOption | LiteralStaticOption>, environment: Environment) {
		return options.map(
			(options): NormalizedStaticOption => ({
				value: VariableInputTransformer.transformValue(options.value, environment),
				label: options.label,
				description: options.description,
			}),
		)
	}
}
