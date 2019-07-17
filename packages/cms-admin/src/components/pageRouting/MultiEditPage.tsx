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
		return props.pageName || `multiEdit_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityListDataProvider<DRP>
					entityName={this.props.entity}
					renderer={
						this.props.renderer ||
						// The as any cast is necessary because MultiEditRenderer is also a namespace… 🙄
						((MultiEditRenderer as any) as React.ComponentClass<DRP & DataRendererProps>)
					}
					rendererProps={this.props.rendererProps}
				>
					{this.props.children}
				</EntityListDataProvider>
			</PageWithLayout>
		)
	}
}
