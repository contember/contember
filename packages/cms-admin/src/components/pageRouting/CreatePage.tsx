import { lcfirst } from 'cms-common'
import * as React from 'react'
import { EntityCreator } from '../../binding/coreComponents'
import { RequestChange } from '../../state/request'
import { DynamicLink } from '../DynamicLink'
import { SingleEntityPageProps } from './SingleEntityPageProps'

interface CreatePageProps extends Omit<SingleEntityPageProps, 'where'> {
	redirectOnSuccess?: RequestChange // TODO we cannot really redirect to an edit page of the newly-created entity.
}

export class CreatePage extends React.PureComponent<CreatePageProps> {
	static getPageName(props: CreatePageProps) {
		return props.pageName || `create_${lcfirst(props.entityName)}`
	}

	render(): React.ReactNode {
		if (!this.props.redirectOnSuccess) {
			return <EntityCreator entityName={this.props.entityName}>{this.props.children}</EntityCreator>
		}

		return (
			<DynamicLink
				requestChange={this.props.redirectOnSuccess}
				Component={({ onClick }) => (
					<EntityCreator
						entityName={this.props.entityName}
						//onSuccessfulPersist={onClick}
					>
						{this.props.children}
					</EntityCreator>
				)}
			/>
		)
	}
}
