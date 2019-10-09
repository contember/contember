import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { EntityName, FieldName } from '../bindingTypes'
import { MarkerTreeRoot, SugaredSingleEntityTreeConstraints } from '../dao'
import { Component } from '../facade/auxiliary'

export interface SingleEntityDataProviderProps extends SugaredSingleEntityTreeConstraints {
	entityName: EntityName
	associatedField?: FieldName
	children: React.ReactNode
}

export const SingleEntityDataProvider = Component<SingleEntityDataProviderProps>(
	props => {
		const accessorTreeState = useAccessorTreeState(props.children)

		return (
			<AccessorTreeStateContext.Provider value={accessorTreeState}>{props.children}</AccessorTreeStateContext.Provider>
		)
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			MarkerTreeRoot.createFromSugaredSingleEntityConstraints(
				environment,
				props.entityName,
				fields,
				{
					where: props.where,
					whereType: 'unique',
				},
				props.associatedField,
			),
	},
	'SingleEntityDataProvider',
)
