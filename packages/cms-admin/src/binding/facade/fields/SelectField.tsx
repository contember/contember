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
	ToOne
} from '../../coreComponents'
import { AccessorTreeRoot, DataBindingError, EntityAccessor, EntityCollectionAccessor, FieldAccessor } from '../../dao'

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
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const fieldAccessor = data.data.getTreeRoot(this.props.name)
						const currentValueEntity = data.data.getField(this.props.name)

						// TODO this fails when `currentValueEntity` is `null` which may legitimately happen.
						if (!(fieldAccessor instanceof AccessorTreeRoot) || !(currentValueEntity instanceof EntityAccessor)) {
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
		)
	}

	public static generateSyntheticChildren(props: SelectFieldProps): React.ReactNode {
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

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof SelectField,
	SyntheticChildrenProvider<SelectFieldProps>
>
