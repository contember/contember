import * as React from 'react'
import { EntityCreator, EntityCreatorProps } from '@contember/binding'
import { RequestChange } from '../../state/request'
import { MutableSingleEntityRenderer, MutableSingleEntityRendererProps } from '../bindingFacade'
import { DynamicLink } from '../DynamicLink'
import { PageProvider } from './PageProvider'

export interface CreatePageProps extends Omit<EntityCreatorProps, 'entities'> {
	pageName: string
	entity: EntityCreatorProps['entities']
	redirectOnSuccess?: RequestChange // TODO we cannot really redirect to an edit page of the newly-created entity.
	rendererProps?: Omit<MutableSingleEntityRendererProps, 'children'>
}

const CreatePage: Partial<PageProvider<CreatePageProps>> & React.ComponentType<CreatePageProps> = React.memo(
	(props: CreatePageProps) => {
		if (!props.redirectOnSuccess) {
			return (
				<EntityCreator
					{...props}
					entities={props.entity}
					//onSuccessfulPersist={onClick}
				>
					<MutableSingleEntityRenderer {...props.rendererProps}>{props.children}</MutableSingleEntityRenderer>
				</EntityCreator>
			)
		}

		return (
			<DynamicLink
				requestChange={props.redirectOnSuccess}
				Component={({ onClick }) => (
					<EntityCreator
						{...props}
						entities={props.entity}
						//onSuccessfulPersist={onClick}
					>
						<MutableSingleEntityRenderer {...props.rendererProps}>{props.children}</MutableSingleEntityRenderer>
					</EntityCreator>
				)}
			/>
		)
	},
)

CreatePage.displayName = 'CreatePage'
CreatePage.getPageName = (props: CreatePageProps) => props.pageName

export { CreatePage }
