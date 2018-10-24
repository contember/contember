import { lcfirst } from 'cms-common'
import * as React from 'react'
import { EntityName } from '../../binding'
import { DataRendererProps } from '../../binding/coreComponents/DataProvider'
import EntityCreator from '../../binding/coreComponents/EntityCreator'
import PageWithLayout from './PageWithLayout'

interface CreatePageProps {
	entity: EntityName
	layout?: React.ComponentType<{ children?: React.ReactNode }>
	renderer?: React.ComponentClass<DataRendererProps>
}

export default class CreatePage extends React.Component<CreatePageProps> {
	static getPageName(props: CreatePageProps) {
		return `create_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityCreator name={this.props.entity} renderer={this.props.renderer}>
					{this.props.children}
				</EntityCreator>
			</PageWithLayout>
		)
	}
}
