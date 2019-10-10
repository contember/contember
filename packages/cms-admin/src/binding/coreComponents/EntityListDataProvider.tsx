import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { EntityName, FieldName } from '../bindingTypes'
import { MarkerTreeRoot, SugaredEntityListTreeConstraints } from '../dao'
import { Component } from './Component'

export interface EntityListDataProviderProps extends Omit<SugaredEntityListTreeConstraints, 'whereType'> {
	entityName: EntityName
	associatedField?: FieldName
	children: React.ReactNode
}

export const EntityListDataProvider = Component<EntityListDataProviderProps>(
	props => {
		const accessorTreeState = useAccessorTreeState(props.children)

		return (
			<AccessorTreeStateContext.Provider value={accessorTreeState}>{props.children}</AccessorTreeStateContext.Provider>
		)
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			MarkerTreeRoot.createFromSugaredEntityListConstraints(
				environment,
				props.entityName,
				fields,
				{
					filter: props.filter,
					orderBy: props.orderBy,
					offset: props.offset,
					limit: props.limit,
					whereType: 'nonUnique',
				},
				props.associatedField,
			),
	},
	'EntityListDataProvider',
)
