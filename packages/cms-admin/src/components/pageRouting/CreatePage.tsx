import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps, EntityCreator } from '../../binding/coreComponents'
import { CommonRendererProps } from '../../binding/facade/renderers'
import PageWithLayout from './PageWithLayout'
import SpecificPageProps from './SpecificPageProps'

interface CreatePageProps<DRP> extends SpecificPageProps<DRP> {}

export default class CreatePage<DRP extends CommonRendererProps = CommonRendererProps> extends React.Component<
	CreatePageProps<DRP>
> {
	static getPageName(props: CreatePageProps<DataRendererProps>) {
		return `create_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityCreator name={this.props.entity} renderer={this.props.renderer} rendererProps={this.props.rendererProps}>
					{this.props.children}
				</EntityCreator>
			</PageWithLayout>
		)
	}
}
