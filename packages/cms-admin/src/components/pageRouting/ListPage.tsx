import * as React from 'react'
import { EntityName } from '../../binding'
import EntityListDataProvider from '../../binding/coreComponents/EntityListDataProvider'
import PageWithLayout from './PageWithLayout'

interface ListPageProps {
	entity: EntityName
	layout?: React.ComponentType<{ children?: React.ReactNode }>
}

export default class ListPage extends React.Component<ListPageProps> {
	static getPageName(props: ListPageProps) {
		return `list_${props.entity.toLowerCase()}`
	}

	render(): React.ReactNode {
		return <PageWithLayout layout={this.props.layout}>
			<EntityListDataProvider name={this.props.entity}>{this.props.children}</EntityListDataProvider>
		</PageWithLayout>
	}
}
