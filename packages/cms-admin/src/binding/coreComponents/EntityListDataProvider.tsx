import * as React from 'react'
import { EntityName, FieldName, Filter } from '../bindingTypes'
import { EnvironmentContext } from '../coreComponents'
import { Environment, MarkerTreeRoot } from '../dao'
import { DefaultRenderer } from '../facade/renderers'
import { MarkerTreeGenerator } from '../model'
import { DataRendererProps, getDataProvider } from './DataProvider'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { ImmutableDataProvider } from './ImmutableDataProvider'
import { MarkerTreeRootProvider } from './MarkerProvider'

interface EntityListDataProviderProps<DRP> {
	name: EntityName
	associatedField?: FieldName
	filter?: Filter
	renderer?: React.ComponentClass<DRP & DataRendererProps>
	rendererProps?: DRP
	immutable?: boolean
}

export class EntityListDataProvider<DRP> extends React.PureComponent<EntityListDataProviderProps<DRP>> {
	public static displayName = 'EntityListDataProvider'

	public render() {
		return (
			<ImmutableDataProvider immutable={!!this.props.immutable}>
				{(data, onDataAvailable) => {
					if (data && this.props.immutable) {
						return this.renderRenderer(data)
					}

					return (
						<EnvironmentContext.Consumer>
							{(environment: Environment) => {
								const markerTreeGenerator = new MarkerTreeGenerator(
									<EntityListDataProvider {...this.props}>{this.renderRenderer(undefined)}</EntityListDataProvider>,
									environment
								)
								const DataProvider = getDataProvider<DRP>()

								return (
									<DataProvider
										markerTree={markerTreeGenerator.generate()}
										renderer={this.props.renderer}
										rendererProps={this.props.rendererProps}
										onDataAvailable={this.props.immutable ? onDataAvailable : undefined}
									>
										{this.props.children}
									</DataProvider>
								)
							}}
						</EnvironmentContext.Consumer>
					)
				}}
			</ImmutableDataProvider>
		)
	}

	private renderRenderer(data: DataRendererProps['data']): React.ReactNode {
		if (this.props.renderer) {
			const Renderer = this.props.renderer
			if (typeof this.props.rendererProps === 'undefined') {
				throw new Error(`No rendererProps passed to custom renderer.`)
			}
			return (
				<Renderer {...this.props.rendererProps} data={data}>
					{this.props.children}
				</Renderer>
			)
		} else {
			return (
				<DefaultRenderer {...this.props.rendererProps} data={data}>
					{this.props.children}
				</DefaultRenderer>
			)
		}
	}

	public static generateMarkerTreeRoot(
		props: EntityListDataProviderProps<unknown>,
		fields: MarkerTreeRoot['fields']
	): MarkerTreeRoot {
		return new MarkerTreeRoot(
			props.name,
			fields,
			{
				filter: props.filter,
				whereType: 'nonUnique'
			},
			props.associatedField
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof EntityListDataProvider,
	MarkerTreeRootProvider<EntityListDataProviderProps<any>>
>
