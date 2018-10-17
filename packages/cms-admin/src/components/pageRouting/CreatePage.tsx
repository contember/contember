import * as React from 'react'
import { EntityName } from '../../binding/bindingTypes'
import EntityCreator from '../../binding/coreComponents/EntityCreator'
import PageWithLayout from './PageWithLayout'

interface CreatePageProps {
	entity: EntityName
	layout?: React.ComponentType<{ children?: React.ReactNode }>
}

export default class CreatePage extends React.Component<CreatePageProps> {
	static getPageName(props: CreatePageProps) {
		return `create_${props.entity.toLowerCase()}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityCreator name={this.props.entity}>{this.props.children}</EntityCreator>
			</PageWithLayout>
		)
	}
}
