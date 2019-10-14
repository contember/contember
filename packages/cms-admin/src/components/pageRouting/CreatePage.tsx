import { lcfirst } from 'cms-common'
import * as React from 'react'
import { EntityCreator } from '../../binding/coreComponents'
import { RequestChange } from '../../state/request'
import { DefaultRenderer, DefaultRendererProps } from '../bindingFacade'
import { DynamicLink } from '../DynamicLink'
import { PageProvider } from './PageProvider'
import { SingleEntityPageProps } from './SingleEntityPageProps'

interface CreatePageProps extends Omit<SingleEntityPageProps, 'where'> {
	redirectOnSuccess?: RequestChange // TODO we cannot really redirect to an edit page of the newly-created entity.
	rendererProps?: Omit<DefaultRendererProps, 'children'>
}

const CreatePage: Partial<PageProvider<CreatePageProps>> & React.ComponentType<CreatePageProps> = React.memo(
	(props: CreatePageProps) => {
		if (!props.redirectOnSuccess) {
			return <EntityCreator entityName={props.entityName}>{props.children}</EntityCreator>
		}

		return (
			<DynamicLink
				requestChange={props.redirectOnSuccess}
				Component={({ onClick }) => (
					<EntityCreator
						entityName={props.entityName}
						//onSuccessfulPersist={onClick}
					>
						<DefaultRenderer {...props.rendererProps}>{props.children}</DefaultRenderer>
					</EntityCreator>
				)}
			/>
		)
	},
)

CreatePage.getPageName = (props: CreatePageProps) => props.pageName || `create_${lcfirst(props.entityName)}`

export { CreatePage }
