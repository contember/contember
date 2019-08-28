import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { Scalar } from '../../../bindingTypes'
import { Field } from '../../../coreComponents'
import { DataBindingError, Environment, Literal, VariableLiteral, VariableScalar } from '../../../dao'
import { VariableInputTransformer } from '../../../model/VariableInputTransformer'
import { ChoiceArity, ChoiceField, ChoiceFieldProps } from './ChoiceField'

export type StaticChoiceFieldProps = ChoiceField.InnerBaseProps & {
	options: Array<[ChoiceField.LiteralValue, ChoiceField.Label]> | Array<[ChoiceField.ScalarValue, ChoiceField.Label]>
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
		const options: Array<[GraphQlBuilder.Literal | Scalar, ChoiceField.Label]> = this.isLiteralStaticMode(rawOptions)
			? this.normalizeLiteralStaticOptions(rawOptions, environment)
			: this.normalizeScalarStaticOptions(rawOptions, environment)

		return (
			<Field name={this.props.fieldName}>
				{({ data, ...otherMetadata }): React.ReactNode => {
					if (this.props.arity === ChoiceArity.Multiple) {
						throw new DataBindingError('Static multiple-choice choice fields are not supported yet.')
					}

					const currentValue: ChoiceField.ValueRepresentation = options.findIndex(([value]) => {
						return (
							data.hasValue(value) ||
							(value instanceof GraphQlBuilder.Literal &&
								typeof data.currentValue === 'string' &&
								value.value === data.currentValue)
						)
					}, null)

					return children({
						data: options.map((item, i) => ({
							key: i,
							label: item[1],
							actualValue: item[0],
						})),
						currentValue,
						onChange: (newValue: ChoiceField.ValueRepresentation) => {
							data.updateValue && data.updateValue(options[newValue][0])
						},
						...otherMetadata,
					})
				}}
			</Field>
		)
	}

	private normalizeLiteralStaticOptions(
		options: Array<[ChoiceField.LiteralValue, ChoiceField.Label]>,
		environment: Environment,
	): Array<[GraphQlBuilder.Literal, ChoiceField.Label]> {
		return options.map(([key, value]): [GraphQlBuilder.Literal, ChoiceField.Label] => [
			key instanceof VariableLiteral ? VariableInputTransformer.transformVariableLiteral(key, environment) : key,
			value,
		])
	}

	private normalizeScalarStaticOptions(
		options: Array<[ChoiceField.ScalarValue, ChoiceField.Label]>,
		environment: Environment,
	): Array<[Scalar, ChoiceField.Label]> {
		return options.map(([key, value]): [Scalar, ChoiceField.Label] => [
			key instanceof VariableScalar ? VariableInputTransformer.transformVariableScalar(key, environment) : key,
			value,
		])
	}

	private isLiteralStaticMode(
		options: ChoiceFieldProps['options'],
	): options is Array<[ChoiceField.LiteralValue, ChoiceField.Label]> {
		if (options.length === 0) {
			return false
		}

		const optionIndicator = options[0][0]
		return optionIndicator instanceof VariableLiteral || optionIndicator instanceof Literal
	}
}
