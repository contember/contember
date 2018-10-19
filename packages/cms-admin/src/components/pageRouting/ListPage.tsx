import * as React from 'react'
import { EntityName } from '../../binding'
import { DataRendererProps } from '../../binding/coreComponents/DataProvider'
import EntityListDataProvider from '../../binding/coreComponents/EntityListDataProvider'
import { ListRenderer } from '../../binding/facade/renderers'
import PageWithLayout from './PageWithLayout'

interface ListPageProps {
	entity: EntityName
	layout?: React.ComponentType<{ children?: React.ReactNode }>
	renderer?: React.ComponentClass<DataRendererProps>
}

export default class ListPage extends React.Component<ListPageProps> {
	static getPageName(props: ListPageProps) {
		return `list_${props.entity.toLowerCase()}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityListDataProvider name={this.props.entity} renderer={this.props.renderer || ListRenderer}>
					{this.props.children}
				</EntityListDataProvider>
			</PageWithLayout>
		)
	}
}
