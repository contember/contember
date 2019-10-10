import { lcfirst } from 'cms-common'
import * as React from 'react'
import { EntityListDataProvider } from '../../binding/coreComponents'
import { EntityListPageProps } from './EntityListPageProps'

interface MultiEditPageProps extends EntityListPageProps {}

export class MultiEditPage extends React.PureComponent<MultiEditPageProps> {
	static getPageName(props: MultiEditPageProps) {
		return props.pageName || `multiEdit_${lcfirst(props.entityName)}`
	}

	render(): React.ReactNode {
		return (
			<EntityListDataProvider
				entityName={this.props.entityName}
				orderBy={this.props.orderBy}
				offset={this.props.offset}
				limit={this.props.limit}
				filter={this.props.filter}
			>
				{this.props.children}
			</EntityListDataProvider>
		)
	}
}
