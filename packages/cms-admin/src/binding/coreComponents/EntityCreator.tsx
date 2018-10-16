import * as React from 'react'
import Dimensions from '../../components/Dimensions'
import { SelectedDimension } from '../../state/request'
import { EntityName } from '../bindingTypes'
import Environment from '../dao/Environment'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import MarkerTreeGenerator from '../model/MarkerTreeGenerator'
import DataProvider from './DataProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import EnvironmentContext from './EnvironmentContext'
import { MarkerTreeRootProvider } from './MarkerProvider'

interface EntityCreatorProps {
	name: EntityName
}

export default class EntityCreator extends React.Component<EntityCreatorProps> {
	public static displayName = 'EntityCreator'

	public render() {
		return (
			<Dimensions>
				{(dimensions: SelectedDimension) => {
					const environment = new Environment({ dimensions })
					const markerTreeGenerator = new MarkerTreeGenerator(
						<EntityCreator {...this.props}>{this.props.children}</EntityCreator>,
						environment
					)

					return (
						<EnvironmentContext.Provider value={environment}>
							<DataProvider markerTree={markerTreeGenerator.generate()}>{this.props.children}</DataProvider>
						</EnvironmentContext.Provider>
					)
				}}
			</Dimensions>
		)
	}

	public static generateMarkerTreeRoot(props: EntityCreatorProps, fields: MarkerTreeRoot['fields']): MarkerTreeRoot {
		return new MarkerTreeRoot(props.name, fields, undefined)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof EntityCreator, MarkerTreeRootProvider>
