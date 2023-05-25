import { Component, EntityAccessor, EntityId, EntitySubTree } from '@contember/react-binding'
import { NotFoundWrapper } from '@contember/react-binding-ui'
import { AutoFields } from './AutoFields'
import { LinkComponent } from './types'


export type AutoFormProps = {
	entity: string,
	id?: EntityId,
	onCreateSuccess?: EntityAccessor.PersistSuccessHandler | Set<EntityAccessor.PersistSuccessHandler>
	LinkComponent?: LinkComponent
}

/**
 * @group Auto Admin
 */
export const AutoForm = Component<AutoFormProps>(
	({ entity, id, onCreateSuccess, LinkComponent }) => {
		if (id === undefined) {
			return (
				<EntitySubTree entity={entity} isCreating onPersistSuccess={onCreateSuccess}>
					<AutoFields LinkComponent={LinkComponent} />
				</EntitySubTree>
			)

		} else {
			return (
				<EntitySubTree entity={{ entityName: entity, where: { id } }}>
					<NotFoundWrapper>
						<AutoFields LinkComponent={LinkComponent} />
					</NotFoundWrapper>
				</EntitySubTree>
			)
		}
	},
)
