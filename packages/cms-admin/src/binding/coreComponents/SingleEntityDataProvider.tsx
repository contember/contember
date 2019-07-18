import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { EntityName, FieldName } from '../bindingTypes'
import { Environment, MarkerTreeRoot } from '../dao'
import { MarkerTreeGenerator } from '../model'
import { DataRendererProps, getDataProvider } from './DataProvider'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { MarkerTreeRootProvider } from './MarkerProvider'

interface SingleEntityDataProviderProps<DRP> {
	entityName: EntityName
	associatedField?: FieldName
	where: Input.UniqueWhere<GraphQlBuilder.Literal>
	renderer?: React.ComponentClass<DRP & DataRendererProps>
	rendererProps?: DRP
}

export class SingleEntityDataProvider<DRP> extends React.PureComponent<SingleEntityDataProviderProps<DRP>> {
	public static displayName = 'SingleEntityDataProvider'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) => {
					const markerTreeGenerator = new MarkerTreeGenerator(
						<SingleEntityDataProvider {...this.props}>{this.props.children}</SingleEntityDataProvider>,
						environment
					)
					const DataProvider = getDataProvider<DRP>()

					return (
						<DataProvider
							markerTree={markerTreeGenerator.generate()}
							renderer={this.props.renderer}
							rendererProps={this.props.rendererProps}
						>
							{this.props.children}
						</DataProvider>
					)
				}}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateMarkerTreeRoot(
		props: SingleEntityDataProviderProps<unknown>,
		fields: MarkerTreeRoot['fields']
	): MarkerTreeRoot {
		return new MarkerTreeRoot(
			props.entityName,
			fields,
			{
				where: props.where,
				whereType: 'unique'
			},
			props.associatedField
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof SingleEntityDataProvider,
	MarkerTreeRootProvider<SingleEntityDataProviderProps<any>>
>
