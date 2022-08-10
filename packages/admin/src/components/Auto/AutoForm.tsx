import { Component, EntityAccessor, EntityId, EntitySubTree } from '@contember/binding'
import { NotFoundWrapper } from '../pageRouting'
import { AutoFields } from './AutoFields'
import { RoutingLinkTarget } from '../../routing'


export type AutoFormProps = {
	entity: string,
	id?: EntityId,
	onCreateSuccess?: EntityAccessor.PersistSuccessHandler | Set<EntityAccessor.PersistSuccessHandler>
	createEditLink?: (entity: string) => RoutingLinkTarget
}

export const AutoForm = Component<AutoFormProps>(
	({ entity, id, onCreateSuccess, createEditLink }) => {
		if (id === undefined) {
			return (
				<EntitySubTree entity={entity} isCreating onPersistSuccess={onCreateSuccess}>
					<AutoFields createEditLink={createEditLink} />
				</EntitySubTree>
			)

		} else {
			return (
				<EntitySubTree entity={{ entityName: entity, where: { id } }}>
					<NotFoundWrapper>
						<AutoFields createEditLink={createEditLink} />
					</NotFoundWrapper>
				</EntitySubTree>
			)
		}
	},
)
