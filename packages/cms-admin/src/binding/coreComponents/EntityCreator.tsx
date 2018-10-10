import * as React from 'react'
import { EntityName } from '../bindingTypes'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import MarkerTreeGenerator from '../model/MarkerTreeGenerator'
import DataProvider from './DataProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import { MarkerTreeRootProvider } from './MarkerProvider'

interface EntityCreatorProps {
	name: EntityName
}

export default class EntityCreator extends React.Component<EntityCreatorProps> {
	public static displayName = 'EntityCreator'

	public render() {
		const markerTreeGenerator = new MarkerTreeGenerator(
			<EntityCreator {...this.props}>{this.props.children}</EntityCreator>,
		)

		return <DataProvider markerTree={markerTreeGenerator.generate()}>
			{this.props.children}
		</DataProvider>
	}

	public static generateMarkerTreeRoot(
		props: EntityCreatorProps,
		fields: MarkerTreeRoot['fields'],
	): MarkerTreeRoot {
		return new MarkerTreeRoot(props.name, fields, undefined)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof EntityCreator, MarkerTreeRootProvider>
