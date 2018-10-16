import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import Dimensions from '../../components/Dimensions'
import { SelectedDimension } from '../../state/request'
import { EntityName, FieldName } from '../bindingTypes'
import Environment from '../dao/Environment'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import MarkerTreeGenerator from '../model/MarkerTreeGenerator'
import { MarkerTreeRootProvider } from './MarkerProvider'
import DataProvider from './DataProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import EnvironmentContext from '../coreComponents/EnvironmentContext'

interface EntityListDataProviderProps {
	name: EntityName
	associatedField?: FieldName
	where?: Input.Where<GraphQlBuilder.Literal>
}

export default class EntityListDataProvider extends React.Component<EntityListDataProviderProps> {
	public static displayName = 'EntityListDataProvider'

	public render() {
		return (
			<Dimensions>
				{(dimensions: SelectedDimension) => {
					const environment = new Environment({ dimensions })
					const markerTreeGenerator = new MarkerTreeGenerator(
						<EntityListDataProvider {...this.props}>{this.props.children}</EntityListDataProvider>,
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

	public static generateMarkerTreeRoot(
		props: EntityListDataProviderProps,
		fields: MarkerTreeRoot['fields']
	): MarkerTreeRoot {
		return new MarkerTreeRoot(
			props.name,
			fields,
			{
				where: props.where,
				whereType: 'nonUnique'
			},
			props.associatedField
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof EntityListDataProvider, MarkerTreeRootProvider>
