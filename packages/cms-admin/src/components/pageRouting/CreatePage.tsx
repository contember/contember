import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps, EntityCreator } from '../../binding/coreComponents'
import { CommonRendererProps } from '../../binding/facade/renderers'
import { RequestChange } from '../../state/request'
import { DynamicLink } from '../DynamicLink'
import { SpecificPageProps } from './SpecificPageProps'

interface CreatePageProps<DRP> extends SpecificPageProps<DRP> {
	redirectOnSuccess?: RequestChange // TODO we cannot really redirect to an edit page of the newly-created entity.
}

export class CreatePage<DRP extends CommonRendererProps = CommonRendererProps> extends React.Component<
	CreatePageProps<DRP>
> {
	static getPageName(props: CreatePageProps<DataRendererProps>) {
		return props.pageName || `create_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		if (!this.props.redirectOnSuccess) {
			return (
				<EntityCreator name={this.props.entity} renderer={this.props.renderer} rendererProps={this.props.rendererProps}>
					{this.props.children}
				</EntityCreator>
			)
		}

		return (
			<DynamicLink
				requestChange={this.props.redirectOnSuccess}
				Component={({ onClick }) => (
					<EntityCreator
						name={this.props.entity}
						renderer={this.props.renderer}
						rendererProps={this.props.rendererProps}
						onSuccessfulPersist={onClick}
					>
						{this.props.children}
					</EntityCreator>
				)}
			/>
		)
	}
}
