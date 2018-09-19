import { HTMLSelect } from '@blueprintjs/core'
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
import OneToOne from '../coreComponents/OneToOne'
import AccessorTreeRoot from '../dao/AccessorTreeRoot'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'
import FieldAccessor from '../dao/FieldAccessor'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'

export interface SelectFieldProps {
	name: FieldName
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
						const fieldAccessor = data.data[MarkerTreeRoot.getPlaceholderName(this.props.name)]
						const currentValueEntity = data.data[this.props.name]

						if (!(fieldAccessor instanceof AccessorTreeRoot) || !(currentValueEntity instanceof EntityAccessor)) {
							throw new DataBindingError('Corrupted data')
						}

						const currentValueField = currentValueEntity.data[this.props.optionFieldName]
						const subTreeData = fieldAccessor.root

						if (!(currentValueField instanceof FieldAccessor)) {
							throw new DataBindingError('Corrupted data')
						}

						if (Array.isArray(subTreeData)) {
							return (
								<HTMLSelect
									value={currentValueEntity.primaryKey}
									onChange={e => {
										// TODO
									}}
									options={subTreeData.map(datum => {
										const optionField = datum.data[this.props.optionFieldName]

										if (!(optionField instanceof FieldAccessor)) {
											throw new DataBindingError('Corrupted data')
										}
										return {
											value: datum.primaryKey!,
											label: optionField.currentValue,
										}
									})}
								/>
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
				<EntityListDataProvider where={props.where} associatedField={props.name}>
					<Entity name={props.entityName}>
						<Field name={props.optionFieldName} />
					</Entity>
				</EntityListDataProvider>
				<OneToOne field={props.name}>
					<Entity name={props.entityName}>
						<Field name={props.optionFieldName} />
					</Entity>
				</OneToOne>
			</>
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof SelectField, SyntheticChildrenProvider>
