import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps } from '../../binding/coreComponents/DataProvider'
import EntityListDataProvider from '../../binding/coreComponents/EntityListDataProvider'
import { ListRenderer } from '../../binding/facade/renderers'
import CommonRendererProps from '../../binding/facade/renderers/CommonRendererProps'
import PageWithLayout from './PageWithLayout'
import SpecificPageProps from './SpecificPageProps'

interface ListPageProps<DRP> extends SpecificPageProps<DRP> {}

export default class ListPage<DRP extends CommonRendererProps> extends React.Component<ListPageProps<DRP>> {
	static getPageName(props: ListPageProps<DataRendererProps>) {
		return `list_${lcfirst(props.entity)}`
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
