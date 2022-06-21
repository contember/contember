import { EntityAccessor } from '@contember/binding'
import { useCallback } from 'react'
import { unstable_batchedUpdates } from 'react-dom'

export type EntityConnectorFactory = (accessor: EntityAccessor) => EntityConnector

export interface EntityConnector {
	entity: EntityAccessor
	(baseEntity: EntityAccessor): void
}

export const useConnectSelectedEntities = (
	createNewEntity: (initialize: EntityAccessor.BatchUpdatesHandler) => void,
) => {
	return useCallback((selectedEntities: EntityConnector[]) => {
		unstable_batchedUpdates(() => {
			for (const selected of selectedEntities) {
				createNewEntity(getEntity => {
					selected(getEntity())
				})
			}
		})
	}, [createNewEntity])
}
