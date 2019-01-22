import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps, SingleEntityDataProvider } from '../../binding/coreComponents'
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
					{(parameters: any) => (
						<SingleEntityDataProvider
							where={parameters}
							name={this.props.entity}
							renderer={this.props.renderer}
							rendererProps={this.props.rendererProps}
						>
							{this.props.children}
						</SingleEntityDataProvider>
					)}
				</ParametersContext.Consumer>
			</PageWithLayout>
		)
	}
}
