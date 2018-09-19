import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FieldName } from '../bindingTypes'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import MarkerTreeGenerator from '../model/MarkerTreeGenerator'
import { MarkerTreeRootProvider } from './DataMarkerProvider'
import DataProvider from './DataProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'

interface SingleEntityDataProviderProps {
	associatedField?: FieldName
	where: Input.UniqueWhere<GraphQlBuilder.Literal>
}

export default class SingleEntityDataProvider extends React.Component<SingleEntityDataProviderProps> {
	public static displayName = 'SingleEntityDataProvider'

	public render() {
		const markerTreeGenerator = new MarkerTreeGenerator(
			<SingleEntityDataProvider {...this.props}>{this.props.children}</SingleEntityDataProvider>
		)

		return <DataProvider markerTree={markerTreeGenerator.generate()}>{this.props.children}</DataProvider>
	}

	public static generateMarkerTreeRoot(
		props: SingleEntityDataProviderProps,
		treeRoot: MarkerTreeRoot['root']
	): MarkerTreeRoot {
		return MarkerTreeRoot.createInstance(
			treeRoot,
			{
				where: props.where,
				whereType: 'unique'
			},
			props.associatedField
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof SingleEntityDataProvider, MarkerTreeRootProvider>
