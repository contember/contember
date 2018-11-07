import * as React from 'react'
import Dimensions from '../../components/Dimensions'
import { SelectedDimension } from '../../state/request'
import { EntityName } from '../bindingTypes'
import { Environment, MarkerTreeRoot } from '../dao'
import { MarkerTreeGenerator } from '../model'
import { DataRendererProps, getDataProvider } from './DataProvider'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { MarkerTreeRootProvider } from './MarkerProvider'

interface EntityCreatorProps<DRP> {
	name: EntityName
	renderer?: React.ComponentClass<DRP & DataRendererProps>
	rendererProps?: DRP
}

export class EntityCreator<DRP> extends React.Component<EntityCreatorProps<DRP>> {
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
					const DataProvider = getDataProvider<DRP>()

					return (
						<EnvironmentContext.Provider value={environment}>
							<DataProvider
								markerTree={markerTreeGenerator.generate()}
								renderer={this.props.renderer}
								rendererProps={this.props.rendererProps}
							>
								{this.props.children}
							</DataProvider>
						</EnvironmentContext.Provider>
					)
				}}
			</Dimensions>
		)
	}

	public static generateMarkerTreeRoot(
		props: EntityCreatorProps<unknown>,
		fields: MarkerTreeRoot['fields']
	): MarkerTreeRoot {
		return new MarkerTreeRoot(props.name, fields, undefined)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof EntityCreator,
	MarkerTreeRootProvider<EntityCreatorProps<any>>
>
