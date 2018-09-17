import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import MarkerTreeGenerator from '../model/MarkerTreeGenerator'
import { MarkerTreeRootProvider } from './DataMarkerProvider'
import DataProvider from './DataProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'

interface EntityListDataProviderProps {
	where?: Input.Where<GraphQlBuilder.Literal>
}

export default class EntityListDataProvider extends React.Component<EntityListDataProviderProps> {
	public static displayName = 'EntityListDataProvider'

	public render() {
		const markerTreeGenerator = new MarkerTreeGenerator(
			<EntityListDataProvider {...this.props}>{this.props.children}</EntityListDataProvider>
		)

		return <DataProvider markerTree={markerTreeGenerator.generate()}>{this.props.children}</DataProvider>
	}

	public static generateMarkerTreeRoot(
		props: EntityListDataProviderProps,
		treeRoot: MarkerTreeRoot['root']
	): MarkerTreeRoot {
		return MarkerTreeRoot.createInstance(treeRoot, {
			where: props.where,
			whereType: 'nonUnique'
		})
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof EntityListDataProvider, MarkerTreeRootProvider>
