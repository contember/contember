import { GraphQlBuilder } from 'cms-client'
import { assertNever } from 'cms-common'
import * as React from 'react'
import { FieldName, PRIMARY_KEY_NAME, Scalar } from '../../bindingTypes'
import {
	EnforceSubtypeRelation,
	EntityListDataProvider,
	Field,
	FieldMetadata,
	SyntheticChildrenProvider,
	ToMany,
	ToOne
} from '../../coreComponents'
import {
	AccessorTreeRoot,
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	EntityForRemovalAccessor,
	Environment,
	FieldAccessor,
	Literal,
	ReferenceMarker,
	VariableLiteral,
	VariableScalar
} from '../../dao'
import { VariableInputTransformer } from '../../model/VariableInputTransformer'
import { Parser, QueryLanguage } from '../../queryLanguage'

export enum ChoiceArity {
	Single = 'single',
	Multiple = 'multiple'
}

export interface ChoiceFieldPublicProps {
	name: FieldName
}

export interface ChoiceFieldMetadata extends Omit<FieldMetadata, 'data'> {
	data: ChoiceField.Data<ChoiceField.DynamicValue | ChoiceField.StaticValue>
	currentValues: Array<ChoiceField.ValueRepresentation> | undefined
	onChange: ((optionKey: ChoiceField.ValueRepresentation, isChosen: boolean) => void) &
		((entityIndex: number, newValue: ChoiceField.ValueRepresentation) => void)
}

export interface ChoiceFieldBaseProps extends ChoiceFieldPublicProps {
	arity: ChoiceArity
	children: (metadata: ChoiceFieldMetadata) => React.ReactNode
}

export interface ChoiceFieldProps extends ChoiceFieldBaseProps {
	options: ChoiceField.StaticProps['options'] | ChoiceField.DynamicProps['options']
}

class ChoiceField extends React.PureComponent<ChoiceFieldProps> {
	public static displayName = 'ChoiceField'

	public render() {
		return (
			<Field.DataRetriever name={this.props.name}>
				{rawMetadata => {
					const commonProps: ChoiceField.InnerBaseProps = {
						rawMetadata,
						arity: this.props.arity,
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
		props: Omit<ChoiceFieldProps, 'children'>,
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

	export interface SingleDatum<ActualValue extends Environment.Value = string> {
		key: ValueRepresentation
		label: Label
		actualValue: ActualValue
	}

	export type Data<ActualValue extends Environment.Value = string> = SingleDatum<ActualValue>[]

	export interface InnerBaseProps extends ChoiceFieldBaseProps {
		rawMetadata: Field.RawMetadata
	}

	export interface StaticProps extends InnerBaseProps {
		options: Array<[ChoiceField.LiteralValue, Label]> | Array<[ChoiceField.ScalarValue, Label]>
	}

	export class Static extends React.PureComponent<StaticProps> {
		public render() {
			if (this.props.arity === ChoiceArity.Multiple) {
				throw new DataBindingError('Static multiple-choice choice fields are not supported yet.')
			}

			const rawOptions = this.props.options
			const children = this.props.children

			if (rawOptions.length === 0) {
				return null
			}

			const environment = this.props.rawMetadata.environment
			const options: Array<[GraphQlBuilder.Literal | Scalar, Label]> = this.isLiteralStaticMode(rawOptions)
				? this.normalizeLiteralStaticOptions(rawOptions, environment)
				: this.normalizeScalarStaticOptions(rawOptions, environment)

			return (
				<Field name={this.props.rawMetadata.fieldName}>
					{({ data, ...otherMetadata }): React.ReactNode => {
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
								actualValue: item[0]
							})),
							currentValues: currentValue === -1 ? undefined : [currentValue],
							onChange: (newValue: ChoiceField.ValueRepresentation) => {
								data.onChange && data.onChange(options[newValue][0])
							},
							...otherMetadata
						})
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
			const data = this.props.rawMetadata.data

			if (!(data instanceof EntityAccessor)) {
				throw new DataBindingError('Corrupted data')
			}

			const { fieldName, toOneProps } = Parser.parseQueryLanguageExpression(
				this.props.options,
				Parser.EntryPoint.QualifiedFieldList,
				this.props.rawMetadata.environment
			)

			const subTreeRootAccessor = data.data.getTreeRoot(fieldName)
			const currentValueEntity = data.data.getField(this.props.rawMetadata.fieldName)

			if (!(subTreeRootAccessor instanceof AccessorTreeRoot)) {
				throw new DataBindingError('Corrupted data: dynamic choice field options have not been retrieved.')
			}
			if (
				currentValueEntity === undefined ||
				currentValueEntity instanceof FieldAccessor ||
				currentValueEntity instanceof AccessorTreeRoot
			) {
				throw new DataBindingError(
					'Corrupted data: dynamic choice field must be a reference, not a field or a sub-tree.'
				)
			}

			if (
				this.props.arity === ChoiceArity.Single &&
				!(currentValueEntity instanceof EntityAccessor || currentValueEntity instanceof EntityForRemovalAccessor)
			) {
				throw new DataBindingError(
					'Corrupted data: dynamic single-choice field must be a reference to a single entity.'
				)
			}
			if (this.props.arity === ChoiceArity.Multiple && !(currentValueEntity instanceof EntityCollectionAccessor)) {
				throw new DataBindingError(
					'Corrupted data: dynamic multiple-choice field must be a reference to a collection of entities.'
				)
			}

			const subTreeData = subTreeRootAccessor.root

			if (!(subTreeData instanceof EntityCollectionAccessor)) {
				throw new DataBindingError('Corrupted data')
			}
			const filteredData = subTreeData.entities.filter(
				(accessor): accessor is EntityAccessor => accessor instanceof EntityAccessor && !!accessor.getPersistedKey()
			)

			const optionEntities: EntityAccessor[] = []

			for (let entity of filteredData) {
				for (let i = toOneProps.length - 1; i >= 0; i--) {
					const props = toOneProps[i]

					const field = entity.data.getField(
						props.field,
						ReferenceMarker.ExpectedCount.UpToOne,
						VariableInputTransformer.transformFilter(props.filter, this.props.rawMetadata.environment),
						props.reducedBy
					)

					if (field instanceof EntityAccessor) {
						entity = field
					} else {
						throw new DataBindingError('Corrupted data')
					}
				}
				optionEntities.push(entity)
			}

			const entities =
				currentValueEntity instanceof EntityCollectionAccessor ? currentValueEntity.entities : [currentValueEntity]

			const currentValues: ChoiceField.ValueRepresentation[] = []

			for (const entity of entities) {
				if (entity instanceof EntityAccessor) {
					const currentKey = entity.getKey()
					const index = filteredData.findIndex(entity => {
						const key = entity.getPersistedKey()
						return !!key && key === currentKey
					})
					if (index > -1) {
						currentValues.push(index)
					}
				}
			}

			const normalizedData = optionEntities.map(
				(item, i): ChoiceField.SingleDatum => {
					const field = item.data.getField(fieldName)
					const label: Label = field instanceof FieldAccessor ? field.currentValue : undefined

					return {
						key: i,
						label,

						// We can get away with the "!" since this collection was created from filteredData above.
						// If this is actually an unpersisted entity, we've got a huge problem.
						actualValue: item.getPersistedKey()!
					}
				}
			)

			return this.props.children({
				...this.props.rawMetadata,
				data: normalizedData,
				currentValues: currentValues.length ? currentValues : undefined,
				onChange: (
					optionKeyOrEntityIndex: ChoiceField.ValueRepresentation | number,
					isChosenOrNewValue: boolean | ChoiceField.ValueRepresentation
				) => {
					if (typeof isChosenOrNewValue === 'boolean') {
						const optionKey: ChoiceField.ValueRepresentation = optionKeyOrEntityIndex
						const isChosen: boolean = isChosenOrNewValue

						if (this.props.arity === ChoiceArity.Single) {
							if (currentValueEntity instanceof EntityAccessor) {
								if (isChosen) {
									currentValueEntity.replaceWith(optionEntities[optionKey])
								} else {
									currentValueEntity.remove && currentValueEntity.remove(EntityAccessor.RemovalType.Disconnect)
								}
							}
						} else if (this.props.arity === ChoiceArity.Multiple) {
							if (currentValueEntity instanceof EntityCollectionAccessor && currentValueEntity.addNew) {
								if (isChosen) {
									currentValueEntity.addNew(optionEntities[optionKey])
								} else {
									const targetEntityId = optionEntities[optionKey].getPersistedKey()

									for (const searchedEntity of currentValueEntity.entities) {
										if (!(searchedEntity instanceof EntityAccessor)) {
											continue
										}
										if (searchedEntity.getPersistedKey() === targetEntityId) {
											searchedEntity.remove && searchedEntity.remove(EntityAccessor.RemovalType.Disconnect)
											break
										}
									}
								}
							}
						} else {
							assertNever(this.props.arity)
						}
					} else {
						const entityIndex: number = optionKeyOrEntityIndex
						const newValue: number = isChosenOrNewValue

						const entity = entities[entityIndex]
						if (entity === undefined) {
							return
						}

						if (newValue === -1) {
							if (entity instanceof EntityAccessor && entity.remove) {
								entity.remove(EntityAccessor.RemovalType.Disconnect)
							}
						} else {
							entity.replaceWith(filteredData[newValue])
						}
					}
				},
				errors: currentValueEntity.errors,
				fieldName: fieldName
			})
		}
	}
}

export { ChoiceField }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof ChoiceField,
	SyntheticChildrenProvider<ChoiceFieldProps>
>
