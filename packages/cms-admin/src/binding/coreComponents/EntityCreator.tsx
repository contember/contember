import * as React from 'react'
import { EntityName } from '../bindingTypes'
import { Environment, MarkerTreeRoot } from '../dao'
import { MarkerTreeGenerator } from '../model'
import { DataRendererProps, getDataProvider } from './DataProvider'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { MarkerTreeRootProvider } from './MarkerProvider'
import { DefaultRenderer } from '../facade/renderers'

interface EntityCreatorProps<DRP> {
	name: EntityName
	renderer?: React.ComponentType<DRP & DataRendererProps>
	rendererProps?: DRP
	onSuccessfulPersist?: () => void
}

export class EntityCreator<DRP> extends React.PureComponent<EntityCreatorProps<DRP>> {
	public static displayName = 'EntityCreator'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) => {
					const markerTreeGenerator = new MarkerTreeGenerator(
						<EntityCreator {...this.props}>{this.renderRenderer()}</EntityCreator>,
						environment,
					)
					const DataProvider = getDataProvider<DRP>()

					return (
						<DataProvider
							markerTree={markerTreeGenerator.generate()}
							renderer={this.props.renderer}
							rendererProps={this.props.rendererProps}
							onSuccessfulPersist={this.props.onSuccessfulPersist}
						>
							{this.props.children}
						</DataProvider>
					)
				}}
			</EnvironmentContext.Consumer>
		)
	}

	private renderRenderer(): React.ReactNode {
		if (this.props.renderer) {
			const Renderer = this.props.renderer
			if (typeof this.props.rendererProps === 'undefined') {
				throw new Error(`No rendererProps passed to custom renderer.`)
			}
			return <Renderer {...this.props.rendererProps}>{this.props.children}</Renderer>
		} else {
			return <DefaultRenderer {...this.props.rendererProps}>{this.props.children}</DefaultRenderer>
		}
	}

	public static generateMarkerTreeRoot(
		props: EntityCreatorProps<unknown>,
		fields: MarkerTreeRoot['fields'],
	): MarkerTreeRoot {
		return new MarkerTreeRoot(props.name, fields, undefined)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof EntityCreator,
	MarkerTreeRootProvider<EntityCreatorProps<any>>
>
