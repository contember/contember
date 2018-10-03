import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { EntityName, FieldName } from '../bindingTypes'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import MarkerTreeGenerator from '../model/MarkerTreeGenerator'
import { MarkerTreeRootProvider } from './MarkerProvider'
import DataProvider from './DataProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'

interface EntityListDataProviderProps {
	name: EntityName
	associatedField?: FieldName
	where?: Input.Where<GraphQlBuilder.Literal>
}

export default class EntityListDataProvider extends React.Component<EntityListDataProviderProps> {
	public static displayName = 'EntityListDataProvider'

	public render() {
		const markerTreeGenerator = new MarkerTreeGenerator(
			<EntityListDataProvider {...this.props}>{this.props.children}</EntityListDataProvider>,
		)

		return <DataProvider markerTree={markerTreeGenerator.generate()}>
			{this.props.children}
		</DataProvider>
	}

	public static generateMarkerTreeRoot(
		props: EntityListDataProviderProps,
		fields: MarkerTreeRoot['fields'],
	): MarkerTreeRoot {
		return MarkerTreeRoot.createInstance(
			props.name,
			fields,
			{
				where: props.where,
				whereType: 'nonUnique',
			},
			props.associatedField,
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof EntityListDataProvider, MarkerTreeRootProvider>
