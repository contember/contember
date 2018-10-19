import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import Dimensions from '../../components/Dimensions'
import { SelectedDimension } from '../../state/request'
import { EntityName, FieldName } from '../bindingTypes'
import Environment from '../dao/Environment'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import MarkerTreeGenerator from '../model/MarkerTreeGenerator'
import DataProvider, { DataRendererProps } from './DataProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import EnvironmentContext from './EnvironmentContext'
import { MarkerTreeRootProvider } from './MarkerProvider'

interface SingleEntityDataProviderProps {
	name: EntityName
	associatedField?: FieldName
	where: Input.UniqueWhere<GraphQlBuilder.Literal>
	renderer?: React.ComponentClass<DataRendererProps>
}

export default class SingleEntityDataProvider extends React.Component<SingleEntityDataProviderProps> {
	public static displayName = 'SingleEntityDataProvider'

	public render() {
		return (
			<Dimensions>
				{(dimensions: SelectedDimension) => {
					const environment = new Environment({ dimensions })
					const markerTreeGenerator = new MarkerTreeGenerator(
						<SingleEntityDataProvider {...this.props}>{this.props.children}</SingleEntityDataProvider>,
						environment
					)

					return (
						<EnvironmentContext.Provider value={environment}>
							<DataProvider markerTree={markerTreeGenerator.generate()} renderer={this.props.renderer}>
								{this.props.children}
							</DataProvider>
						</EnvironmentContext.Provider>
					)
				}}
			</Dimensions>
		)
	}

	public static generateMarkerTreeRoot(
		props: SingleEntityDataProviderProps,
		fields: MarkerTreeRoot['fields']
	): MarkerTreeRoot {
		return new MarkerTreeRoot(
			props.name,
			fields,
			{
				where: props.where,
				whereType: 'unique'
			},
			props.associatedField
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof SingleEntityDataProvider, MarkerTreeRootProvider>
