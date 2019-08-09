import { lcfirst } from 'cms-common'
import { Input } from '@contember/schema'
import * as React from 'react'
import { DataRendererProps, EntityListDataProvider } from '../../binding/coreComponents'
import { CommonRendererProps, ListRenderer } from '../../binding/facade/renderers'
import PageWithLayout from './PageWithLayout'
import SpecificPageProps from './SpecificPageProps'
import { Filter } from '../../binding'
import { CrudQueryBuilder } from 'cms-client'

interface ListPageProps<DRP> extends SpecificPageProps<DRP> {
	filter?: string | Filter
	orderBy?: Input.OrderBy<CrudQueryBuilder.OrderDirection>[]
	offset?: number
	limit?: number
}

export default class ListPage<DRP extends CommonRendererProps> extends React.Component<ListPageProps<DRP>> {
	static getPageName(props: ListPageProps<DataRendererProps>) {
		return props.pageName || `list_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityListDataProvider
					entityName={this.props.entity}
					renderer={this.props.renderer || (ListRenderer as React.ComponentType<DRP & DataRendererProps>)}
					rendererProps={this.props.rendererProps}
					filter={this.props.filter}
					orderBy={this.props.orderBy}
					offset={this.props.offset}
					limit={this.props.limit}
				>
					{this.props.children}
				</EntityListDataProvider>
			</PageWithLayout>
		)
	}
}
