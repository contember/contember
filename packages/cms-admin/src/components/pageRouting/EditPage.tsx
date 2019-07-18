import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps, EnvironmentContext, SingleEntityDataProvider } from '../../binding/coreComponents'
import { CommonRendererProps } from '../../binding/facade/renderers'
import { ParametersContext } from './Pages'
import PageWithLayout from './PageWithLayout'
import SpecificPageProps from './SpecificPageProps'

interface EditPageProps<DRP> extends SpecificPageProps<DRP> {}

export default class EditPage<DRP extends CommonRendererProps = CommonRendererProps> extends React.Component<
	EditPageProps<DRP>
> {
	static getPageName(props: EditPageProps<DataRendererProps>) {
		return props.pageName || `edit_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<ParametersContext.Consumer>
					{parameters => (
						<EnvironmentContext.Consumer>
							{environment => (
								<SingleEntityDataProvider
									where={
										typeof this.props.where === 'function'
											? this.props.where(parameters, environment)
											: this.props.where === undefined
											? parameters
											: this.props.where
									}
									entityName={this.props.entity}
									renderer={this.props.renderer}
									rendererProps={this.props.rendererProps}
								>
									{this.props.children}
								</SingleEntityDataProvider>
							)}
						</EnvironmentContext.Consumer>
					)}
				</ParametersContext.Consumer>
			</PageWithLayout>
		)
	}
}
