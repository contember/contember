import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { EntityName, FieldName } from '../bindingTypes'
import { MarkerFactory } from '../queryLanguage'
import { Component } from './Component'

export interface SingleEntityDataProviderProps
	extends Omit<MarkerFactory.SugaredSingleEntityTreeConstraints, 'whereType'> {
	entityName: EntityName
	associatedField?: FieldName
	children: React.ReactNode
}

export const SingleEntityDataProvider = Component<SingleEntityDataProviderProps>(
	props => {
		const children = React.useMemo(
			() => <SingleEntityDataProvider {...props}>{props.children}</SingleEntityDataProvider>,
			[props],
		)
		const accessorTreeState = useAccessorTreeState(children)

		return (
			<AccessorTreeStateContext.Provider value={accessorTreeState}>{props.children}</AccessorTreeStateContext.Provider>
		)
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			MarkerFactory.createSingleEntityMarkerTreeRoot(
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
