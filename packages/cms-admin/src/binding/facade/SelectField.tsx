import { FormGroup, HTMLSelect, IFormGroupProps } from '@blueprintjs/core'
import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { EntityName, FieldName } from '../bindingTypes'
import DataContext, { DataContextValue } from '../coreComponents/DataContext'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import Entity from '../coreComponents/Entity'
import EntityListDataProvider from '../coreComponents/EntityListDataProvider'
import Field from '../coreComponents/Field'
import { SyntheticChildrenProvider } from '../coreComponents/MarkerProvider'
import ToOne from '../coreComponents/ToOne'
import AccessorTreeRoot from '../dao/AccessorTreeRoot'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import FieldAccessor from '../dao/FieldAccessor'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import PlaceholderGenerator from '../model/PlaceholderGenerator'

export interface SelectFieldProps {
	name: FieldName
	label: IFormGroupProps['label']
	entityName: EntityName
	optionFieldName: FieldName
	where?: Input.Where<GraphQlBuilder.Literal>
}

export default class SelectField extends React.Component<SelectFieldProps> {
	public static displayName = 'SelectField'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const fieldAccessor = data.data[PlaceholderGenerator.getMarkerTreePlaceholder(this.props.name)]
						const currentValueEntity = data.data[this.props.name]

						// TODO this fails when `currentValueEntity` is `null` which may legitimately happen.
						if (!(fieldAccessor instanceof AccessorTreeRoot) || !(currentValueEntity instanceof EntityAccessor)) {
							throw new DataBindingError('Corrupted data')
						}

						const currentValueField = currentValueEntity.data[this.props.optionFieldName]
						const subTreeData = fieldAccessor.root

						if (!(currentValueField instanceof FieldAccessor)) {
							throw new DataBindingError('Corrupted data')
						}

						if (subTreeData instanceof EntityCollectionAccessor) {
							const normalizedData = subTreeData.entities.filter(
								(accessor): accessor is EntityAccessor => accessor instanceof EntityAccessor,
							)
							return (
								<FormGroup label={this.props.label}>
									<HTMLSelect
										value={currentValueEntity.primaryKey}
										onChange={e => {
											const newPrimaryKey = e.currentTarget.value
											const newAccessor = normalizedData.find(accessor => accessor.primaryKey === newPrimaryKey)

											newAccessor && currentValueEntity.replaceWith(newAccessor)
										}}
										options={normalizedData.map(datum => {
											const optionField = datum.data[this.props.optionFieldName]

											if (!(optionField instanceof FieldAccessor)) {
												throw new DataBindingError('Corrupted data')
											}
											return {
												value: datum.primaryKey!,
												label: (optionField.currentValue || '').toString(),
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
				<EntityListDataProvider name={props.entityName} where={props.where} associatedField={props.name}>
					<Field name={props.optionFieldName} />
				</EntityListDataProvider>
				<ToOne field={props.name}>
					<Field name={props.optionFieldName} />
				</ToOne>
			</>
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof SelectField, SyntheticChildrenProvider>
