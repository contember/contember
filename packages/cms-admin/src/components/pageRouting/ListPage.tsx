import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps, EntityListDataProvider } from '../../binding/coreComponents'
import { CommonRendererProps, ListRenderer } from '../../binding/facade/renderers'
import PageWithLayout from './PageWithLayout'
import SpecificPageProps from './SpecificPageProps'

interface ListPageProps<DRP> extends SpecificPageProps<DRP> {}

export default class ListPage<DRP extends CommonRendererProps> extends React.Component<ListPageProps<DRP>> {
	static getPageName(props: ListPageProps<DataRendererProps>) {
		return props.pageName || `list_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityListDataProvider
					name={this.props.entity}
					renderer={this.props.renderer || (ListRenderer as React.ComponentClass<DRP & DataRendererProps>)}
					rendererProps={this.props.rendererProps}
				>
					{this.props.children}
				</EntityListDataProvider>
			</PageWithLayout>
		)
	}
}
