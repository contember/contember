import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { FieldName, Scalar } from '../../bindingTypes'
import {
	DataContextValue,
	EnforceSubtypeRelation,
	EntityListDataProvider,
	Field,
	Props,
	SyntheticChildrenProvider,
	ToOne
} from '../../coreComponents'
import {
	AccessorTreeRoot,
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	Environment,
	FieldAccessor,
	Literal,
	VariableLiteral,
	VariableScalar
} from '../../dao'
import { VariableInputTransformer } from '../../model/VariableInputTransformer'
import { QueryLanguage } from '../../queryLanguage'

export interface ChoiceFieldPublicProps {
	name: FieldName
}

export interface ChoiceFieldBaseProps extends ChoiceFieldPublicProps {
	children: (
		data: ChoiceField.Data<ChoiceField.DynamicValue | ChoiceField.StaticValue>,
		currentValue: ChoiceField.ValueRepresentation | null,
		onChange: (newValue: ChoiceField.ValueRepresentation) => void,
		environment: Environment
	) => React.ReactNode
}

export interface ChoiceFieldProps extends ChoiceFieldBaseProps {
	options: ChoiceField.StaticProps['options'] | ChoiceField.DynamicProps['options']
}

class ChoiceField extends React.PureComponent<ChoiceFieldProps> {
	public static displayName = 'ChoiceField'

	public render() {
		return (
			<Field.DataRetriever name={this.props.name}>
				{(fieldName, data, environment) => {
					const commonProps = {
						fieldName,
						data,
						environment,
						children: this.props.children,
						name: this.props.name
					}

					if (Array.isArray(this.props.options)) {
						return <ChoiceField.Static {...commonProps} options={this.props.options} />
					}
					return <ChoiceField.Dynamic {...commonProps} options={this.props.options} />
				}}
			</Field.DataRetriever>
		)
	}

	public static generateSyntheticChildren(
		props: Props<Pick<ChoiceFieldProps, Exclude<keyof ChoiceFieldProps, 'children'>>>,
		environment: Environment
	): React.ReactNode {
		if (Array.isArray(props.options)) {
			return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
		}

		const metadata = QueryLanguage.wrapQualifiedFieldList(
			props.options,
			fieldName => <Field name={fieldName} />,
			environment
		)

		return (
			<>
				{QueryLanguage.wrapRelativeSingleField(
					props.name,
					fieldName => (
						<>
							<EntityListDataProvider
								name={metadata.entityName}
								filter={metadata.filter}
								associatedField={metadata.fieldName}
							>
								{metadata.children}
							</EntityListDataProvider>
							<ToOne field={fieldName}>
								<Field name={metadata.fieldName} />
							</ToOne>
						</>
					),
					environment
				)}
			</>
		)
	}
}

namespace ChoiceField {
	export type Label = React.ReactNode

	export type ScalarValue = Scalar | VariableScalar

	export type LiteralValue = VariableLiteral | Literal

	export type StaticValue = GraphQlBuilder.Literal | Scalar

	export type DynamicValue = EntityAccessor['primaryKey']

	// This is just the JS array index as specified in options or as returned from the server.
	export type ValueRepresentation = number

	export type Data<ActualValue extends Environment.Value = string> = Array<[ValueRepresentation, Label, ActualValue]>

	export interface InnerBaseProps extends ChoiceFieldBaseProps {
		fieldName: FieldName
		data: DataContextValue
		environment: Environment
	}

	export interface StaticProps extends InnerBaseProps {
		options: Array<[ChoiceField.LiteralValue, Label]> | Array<[ChoiceField.ScalarValue, Label]>
	}

	export class Static extends React.PureComponent<StaticProps> {
		public render() {
			const rawOptions = this.props.options
			const children = this.props.children

			if (rawOptions.length === 0) {
				return null
			}

			const options: Array<[GraphQlBuilder.Literal | Scalar, Label]> = this.isLiteralStaticMode(rawOptions)
				? this.normalizeLiteralStaticOptions(rawOptions, this.props.environment)
				: this.normalizeScalarStaticOptions(rawOptions, this.props.environment)

			return (
				<Field name={this.props.fieldName}>
					{(data: FieldAccessor): React.ReactNode => {
						const currentValue: ChoiceField.ValueRepresentation = options.findIndex(([value]) => {
							return (
								data.hasValue(value) ||
								(value instanceof GraphQlBuilder.Literal &&
									typeof data.currentValue === 'string' &&
									value.value === data.currentValue)
							)
						}, null)

						return children(
							options.map(
								(item, i): [ChoiceField.ValueRepresentation, Label, ChoiceField.StaticValue] => [i, item[1], item[0]]
							),
							currentValue === -1 ? null : currentValue,
							(newValue: ChoiceField.ValueRepresentation) => {
								data.onChange && data.onChange(options[newValue][0])
							},
							this.props.environment
						)
					}}
				</Field>
			)
		}

		private normalizeLiteralStaticOptions(
			options: Array<[ChoiceField.LiteralValue, Label]>,
			environment: Environment
		): Array<[GraphQlBuilder.Literal, Label]> {
			return options.map(
				([key, value]): [GraphQlBuilder.Literal, Label] => [
					key instanceof VariableLiteral ? VariableInputTransformer.transformVariableLiteral(key, environment) : key,
					value
				]
			)
		}

		private normalizeScalarStaticOptions(
			options: Array<[ChoiceField.ScalarValue, Label]>,
			environment: Environment
		): Array<[Scalar, Label]> {
			return options.map(
				([key, value]): [Scalar, Label] => [
					key instanceof VariableScalar ? VariableInputTransformer.transformVariableScalar(key, environment) : key,
					value
				]
			)
		}

		private isLiteralStaticMode(
			options: ChoiceFieldProps['options']
		): options is Array<[ChoiceField.LiteralValue, Label]> {
			if (options.length === 0) {
				return false
			}

			const optionIndicator = options[0][0]
			return optionIndicator instanceof VariableLiteral || optionIndicator instanceof Literal
		}
	}

	export interface DynamicProps extends InnerBaseProps {
		options: FieldName
	}

	export class Dynamic extends React.PureComponent<DynamicProps> {
		public render() {
			const data = this.props.data

			if (!(data instanceof EntityAccessor)) {
				throw new DataBindingError('Corrupted data')
			}

			const metadata = QueryLanguage.wrapQualifiedFieldList(
				this.props.options,
				fieldName => <Field name={fieldName} />,
				this.props.environment
			)
			const fieldAccessor = data.data.getTreeRoot(metadata.fieldName)
			const currentValueEntity = data.data.getField(this.props.fieldName)

			if (!(fieldAccessor instanceof AccessorTreeRoot) || !(currentValueEntity instanceof EntityAccessor)) {
				throw new DataBindingError('Corrupted data')
			}

			const subTreeData = fieldAccessor.root

			if (!(subTreeData instanceof EntityCollectionAccessor)) {
				throw new DataBindingError('Corrupted data')
			}
			const filteredData = subTreeData.entities.filter(
				(accessor): accessor is EntityAccessor => accessor instanceof EntityAccessor && !!accessor.getPersistedKey()
			)

			const currentKey = currentValueEntity.getKey()
			const currentValue: ChoiceField.ValueRepresentation = filteredData.findIndex(entity => {
				const key = entity.getPersistedKey()
				return !!key && key === currentKey
			})
			const normalizedData = filteredData.map(
				(item, i): [ChoiceField.ValueRepresentation, Label, ChoiceField.DynamicValue] => {
					const field = item.data.getField(metadata.fieldName)
					const label: Label = field instanceof FieldAccessor ? field.currentValue : undefined

					return [i, label, item.primaryKey]
				}
			)

			return this.props.children(
				normalizedData,
				currentValue === -1 ? null : currentValue,
				(newValue: ChoiceField.ValueRepresentation) => {
					currentValueEntity.replaceWith(filteredData[newValue])
				},
				this.props.environment
			)
		}
	}
}

export { ChoiceField }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof ChoiceField,
	SyntheticChildrenProvider<ChoiceFieldProps>
>
