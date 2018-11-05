import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps, EntityListDataProvider } from '../../binding/coreComponents'
import { MultiEditRenderer, MultiEditRendererProps } from '../../binding/facade/renderers'
import PageWithLayout from './PageWithLayout'
import SpecificPageProps from './SpecificPageProps'

interface MultiEditPageProps<DRP extends MultiEditRendererProps> extends SpecificPageProps<DRP> {}

export default class MultiEditPage<DRP extends MultiEditRendererProps = MultiEditRendererProps> extends React.Component<
	MultiEditPageProps<DRP>
> {
	static getPageName(props: MultiEditPageProps<MultiEditRendererProps>) {
		return `multiEdit_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityListDataProvider
					name={this.props.entity}
					renderer={this.props.renderer || (MultiEditRenderer as React.ComponentClass<DRP & DataRendererProps>)}
					rendererProps={this.props.rendererProps}
				>
					{this.props.children}
				</EntityListDataProvider>
			</PageWithLayout>
		)
	}
}
