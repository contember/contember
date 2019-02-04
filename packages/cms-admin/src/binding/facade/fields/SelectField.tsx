import { FormGroup, HTMLSelect, IFormGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import { EntityName, FieldName, Filter } from '../../bindingTypes'
import {
	DataContext,
	DataContextValue,
	EnforceSubtypeRelation,
	EntityListDataProvider,
	Field,
	SyntheticChildrenProvider,
	ToOne,
	EnvironmentContext
} from '../../coreComponents'
import {
	AccessorTreeRoot,
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	FieldAccessor,
	Environment
} from '../../dao'
import { Parser } from '../../queryLanguage'

export interface SelectFieldProps {
	name: FieldName
	label: IFormGroupProps['label']
	entityName: EntityName
	optionFieldName: FieldName
	filter?: Filter
}

export class SelectField extends React.PureComponent<SelectFieldProps> {
	public static displayName = 'SelectField'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) =>
					Parser.generateWrappedNode(
						this.props.name,
						fieldName => (
							<DataContext.Consumer>
								{(data: DataContextValue) => {
									if (data instanceof EntityAccessor) {
										const fieldAccessor = data.data.getTreeRoot(fieldName)
										const currentValueEntity = data.data.getField(fieldName)

										// TODO this fails when `currentValueEntity` is `null` which may legitimately happen.
										if (
											!(fieldAccessor instanceof AccessorTreeRoot) ||
											!(currentValueEntity instanceof EntityAccessor)
										) {
											throw new DataBindingError('Corrupted data')
										}

										const subTreeData = fieldAccessor.root

										if (subTreeData instanceof EntityCollectionAccessor) {
											const normalizedData = subTreeData.entities.filter(
												(accessor): accessor is EntityAccessor => accessor instanceof EntityAccessor
											)
											return (
												<FormGroup label={this.props.label}>
													<HTMLSelect
														value={currentValueEntity.primaryKey as string}
														onChange={e => {
															const newPrimaryKey = e.currentTarget.value
															const newAccessor = normalizedData.find(accessor => accessor.primaryKey === newPrimaryKey)

															newAccessor && currentValueEntity.replaceWith(newAccessor)
														}}
														options={normalizedData.map(datum => {
															const optionField = datum.data.getField(this.props.optionFieldName)

															if (!(optionField instanceof FieldAccessor)) {
																throw new DataBindingError('Corrupted data')
															}
															return {
																value: datum.primaryKey as string,
																label: (optionField.currentValue || '').toString()
															}
														})}
													/>
												</FormGroup>
											)
										}
									}
									throw new DataBindingError('Corrupted data')
								}}
							</DataContext.Consumer>
						),
						environment
					)
				}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: SelectFieldProps, environment: Environment): React.ReactNode {
		return (
			<>
				{Parser.generateWrappedNode(
					`${props.name}.${props.optionFieldName}`,
					fieldName => (
						<>
							<Field name={fieldName} />
							<EntityListDataProvider name={props.entityName} filter={props.filter} associatedField={fieldName}>
								<Field name={fieldName} />
							</EntityListDataProvider>
						</>
					),
					environment
				)}
			</>
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof SelectField,
	SyntheticChildrenProvider<SelectFieldProps>
>
